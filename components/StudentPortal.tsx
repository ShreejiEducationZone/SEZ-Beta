import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { WorkItem, Test, Doubt, DoubtOrigin, DoubtPriority } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import LogoutIcon from './icons/LogoutIcon';
import TasksIcon from './icons/TasksIcon';
import TestIcon from './icons/TestIcon';
import { FaQuestionCircle } from 'react-icons/fa';
import { BsCalendar2Check } from 'react-icons/bs';
import { DOUBT_ORIGINS, DOUBT_PRIORITIES } from '../constants';
import { speak } from '../utils/voiceService';

declare const faceapi: any;

// Section Card Component
const SectionCard: React.FC<{ icon: React.ElementType; title: string; children: React.ReactNode; }> = ({ icon: Icon, title, children }) => (
    <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
            <Icon className="h-6 w-6 text-brand-blue" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
        </div>
        <div className="space-y-3 thin-scrollbar max-h-64 overflow-y-auto pr-2 -mr-2">
            {children}
        </div>
    </div>
);

const StudentPortal: React.FC = () => {
    const { 
        currentUser, 
        logout,
        workItems,
        tests,
        doubts,
        allStudentSubjects,
        faceDescriptors,
        handleSaveDoubt,
        handleSaveAttendanceRecord,
        showToast 
    } = useData();

    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [attendanceStatus, setAttendanceStatus] = useState<'idle' | 'scanning' | 'success' | 'fail' | 'loading'>('idle');

    const studentData = useMemo(() => {
        if (!currentUser || !currentUser.studentId) return null;
        const studentId = currentUser.studentId;
        const today = new Date().toISOString().split('T')[0];

        const pendingWork = workItems
            .filter(w => w.studentId === studentId && w.status !== 'Completed')
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        
        const upcomingTests = tests
            .filter(t => t.studentId === studentId && t.status === 'Upcoming' && t.testDate >= today)
            .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());

        return { pendingWork, upcomingTests };
    }, [currentUser, workItems, tests]);

    const studentSubjects = useMemo(() => {
        if (!currentUser?.studentId) return [];
        return allStudentSubjects[currentUser.studentId]?.subjects || [];
    }, [currentUser, allStudentSubjects]);

    // Handle Attendance
    const startAttendanceScan = useCallback(async () => {
        if (!currentUser?.studentId) return;
        setAttendanceStatus('loading');
        setIsAttendanceModalOpen(true);

        try {
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
            ]);

            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera or model loading error:", err);
            showToast("Could not start camera. Please check permissions.", 'error');
            setAttendanceStatus('fail');
        }
    }, [currentUser, showToast]);

    const onVideoPlay = useCallback(() => {
        setAttendanceStatus('scanning');
        const studentDescriptor = faceDescriptors.find(d => d.id === currentUser!.studentId);
        if (!studentDescriptor) {
            setAttendanceStatus('fail');
            showToast("Your face is not registered. Please contact the administrator.", 'error');
            return;
        }

        const labeledDescriptor = new faceapi.LabeledFaceDescriptors(currentUser!.studentId, [new Float32Array(studentDescriptor.descriptor)]);
        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptor, 0.6);

        const interval = setInterval(async () => {
            if (!videoRef.current) return;
            const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
            
            if (detection) {
                const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
                if (bestMatch.label === currentUser!.studentId) {
                    clearInterval(interval);
                    setAttendanceStatus('success');
                    speak(`Welcome, ${currentUser?.name}`);
                    const now = new Date();
                    const recordId = `${currentUser!.studentId}_${now.toISOString().split('T')[0]}`;
                    handleSaveAttendanceRecord({
                        id: recordId,
                        studentId: currentUser!.studentId,
                        date: now.toISOString().split('T')[0],
                        status: 'Present',
                        inTime: now.toLocaleTimeString('en-US', { hour12: false }),
                        lastSeen: now.toLocaleTimeString('en-US', { hour12: false })
                    });
                    setTimeout(() => {
                        setIsAttendanceModalOpen(false);
                        const stream = videoRef.current?.srcObject as MediaStream;
                        stream?.getTracks().forEach(track => track.stop());
                    }, 2000);
                }
            }
        }, 500);
    }, [currentUser, faceDescriptors, showToast, handleSaveAttendanceRecord, speak]);

    // Doubt Form State
    const [doubtText, setDoubtText] = useState('');
    const [doubtSubject, setDoubtSubject] = useState('');

    const handleDoubtSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!doubtText.trim() || !doubtSubject || !currentUser?.studentId) {
            showToast("Please select a subject and write your doubt.", 'error');
            return;
        }
        const newDoubt: Doubt = {
            id: `d_${Date.now()}`,
            studentId: currentUser.studentId,
            subject: doubtSubject,
            text: doubtText.trim(),
            priority: 'Medium',
            origin: 'Other',
            createdAt: new Date().toISOString().split('T')[0],
            status: 'Open'
        };
        try {
            await handleSaveDoubt(newDoubt);
            showToast("Your doubt has been submitted!", 'success');
            setDoubtText('');
            setDoubtSubject('');
        } catch (error) {
            showToast("Could not submit your doubt.", 'error');
        }
    };

    if (!currentUser) return null;

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-brand-blue">
                         {currentUser.avatarUrl ? <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back,</p>
                        <h1 className="text-3xl font-bold">{currentUser.name}</h1>
                    </div>
                </div>
                <button onClick={logout} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-dark-card hover:bg-gray-300 dark:hover:bg-gray-700 font-semibold">
                    <LogoutIcon className="h-5 w-5" />
                    <span>Logout</span>
                </button>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SectionCard icon={TasksIcon} title="My Work">
                    {studentData?.pendingWork.length ? studentData.pendingWork.map(item => (
                        <div key={item.id} className="p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.subject} - Due: {item.dueDate}</p>
                        </div>
                    )) : <p className="text-gray-500 italic text-center py-8">No pending work. Great job!</p>}
                </SectionCard>

                <SectionCard icon={TestIcon} title="Upcoming Tests">
                     {studentData?.upcomingTests.length ? studentData.upcomingTests.map(item => (
                        <div key={item.id} className="p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                            <p className="font-semibold">{item.title}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.subject} - On: {item.testDate}</p>
                        </div>
                    )) : <p className="text-gray-500 italic text-center py-8">No upcoming tests scheduled.</p>}
                </SectionCard>

                <SectionCard icon={FaQuestionCircle} title="Ask a Doubt">
                    <form onSubmit={handleDoubtSubmit} className="space-y-3">
                        <select
                            value={doubtSubject}
                            onChange={(e) => setDoubtSubject(e.target.value)}
                            className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
                        >
                            <option value="">Select Subject</option>
                            {studentSubjects.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
                        </select>
                        <textarea
                            value={doubtText}
                            onChange={(e) => setDoubtText(e.target.value)}
                            placeholder="Write your doubt here..."
                            rows={3}
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
                        />
                        <button type="submit" className="w-full h-10 rounded-lg bg-brand-blue text-white font-semibold">Submit Doubt</button>
                    </form>
                </SectionCard>

                <SectionCard icon={BsCalendar2Check} title="Attendance">
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
                        <p className="text-gray-600 dark:text-gray-400">Mark your attendance for today using face recognition.</p>
                        <button onClick={startAttendanceScan} className="h-12 px-6 rounded-lg bg-green-600 text-white font-semibold text-lg">
                            Mark My Attendance
                        </button>
                    </div>
                </SectionCard>
            </main>

            {isAttendanceModalOpen && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-card p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
                        <h2 className="text-2xl font-bold mb-4">Attendance Scan</h2>
                        <div className="relative w-full max-w-xs aspect-square mx-auto my-4 rounded-full overflow-hidden border-4 border-gray-600">
                             <video ref={videoRef} autoPlay muted playsInline onPlay={onVideoPlay} className="w-full h-full object-cover scale-x-[-1]"></video>
                             <div className="absolute inset-0 flex items-center justify-center">
                                {attendanceStatus === 'loading' && <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>}
                                {attendanceStatus === 'success' && <div className="text-green-400 text-6xl">✓</div>}
                                {attendanceStatus === 'fail' && <div className="text-red-400 text-6xl">✗</div>}
                            </div>
                        </div>
                        <p className="h-6 text-lg">
                            {attendanceStatus === 'loading' && "Loading camera..."}
                            {attendanceStatus === 'scanning' && "Please look at the camera..."}
                            {attendanceStatus === 'success' && `Welcome, ${currentUser.name}!`}
                            {attendanceStatus === 'fail' && "Could not verify. Please try again."}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentPortal;