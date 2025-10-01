
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Student, FaceDescriptorData, AttendanceRecord, AttendanceStatus } from '../../types';
import AttendanceStudentCard from '../AttendanceStudentCard';
import StudentAttendanceDetailView from '../StudentAttendanceDetailView';
import { speak } from '../../utils/voiceService';
import { useData } from '../../context/DataContext';
import PlaceholderAvatar from '../PlaceholderAvatar';
import CheckCircleIcon from '../icons/CheckCircleIcon';

declare const faceapi: any;

// --- New UI Components for Pose Guidance ---
const PoseIcon: React.FC<{ type: string; isComplete: boolean; isActive: boolean }> = ({ type, isComplete, isActive }) => {
    const baseClasses = "h-8 w-8 transition-colors";
    const colorClasses = isComplete ? "text-green-500" : isActive ? "text-blue-500 animate-pulse" : "text-gray-400 dark:text-gray-500";
    const Icon = {
        'up': () => <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />,
        'down': () => <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />,
        'left': () => <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />,
        'right': () => <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />,
        'center': () => <circle cx="12" cy="12" r="3" stroke="none" fill="currentColor" />,
    }[type] || (() => <circle cx="12" cy="12" r="3" stroke="none" fill="currentColor" />);

    return <svg xmlns="http://www.w3.org/2000/svg" className={`${baseClasses} ${colorClasses}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><Icon /></svg>;
};

const PoseIndicator: React.FC<{ steps: string[], currentStepIndex: number }> = ({ steps, currentStepIndex }) => {
    return (
        <div className="grid grid-cols-3 grid-rows-3 gap-2 w-32 h-32 mx-auto my-4">
            <div className="col-start-2 flex items-center justify-center"><PoseIcon type="up" isComplete={steps.indexOf('up') < currentStepIndex} isActive={steps[currentStepIndex] === 'up'} /></div>
            <div className="flex items-center justify-center"><PoseIcon type="left" isComplete={steps.indexOf('left') < currentStepIndex} isActive={steps[currentStepIndex] === 'left'} /></div>
            <div className="flex items-center justify-center"><PoseIcon type="center" isComplete={steps.indexOf('center') < currentStepIndex} isActive={steps[currentStepIndex] === 'center'} /></div>
            <div className="flex items-center justify-center"><PoseIcon type="right" isComplete={steps.indexOf('right') < currentStepIndex} isActive={steps[currentStepIndex] === 'right'} /></div>
            <div className="col-start-2 flex items-center justify-center"><PoseIcon type="down" isComplete={steps.indexOf('down') < currentStepIndex} isActive={steps[currentStepIndex] === 'down'} /></div>
        </div>
    );
};
// --- End New UI Components ---

interface StudentAttendanceData extends Student {
    status: AttendanceStatus;
    lastSeen: string | null;
    isRegistered: boolean;
}

const getHeadPose = (landmarks: any) => {
    if (!landmarks) return 'center';
    const nose = landmarks.getNose()[3]; 
    const leftEye = landmarks.getLeftEye()[0];
    const rightEye = landmarks.getRightEye()[3];
    const jaw = landmarks.getJawOutline();
    const jawLeft = jaw[0];
    const jawRight = jaw[16];
    const jawBottom = jaw[8];
    const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
    const faceWidth = jawRight.x - jawLeft.x;
    if (faceWidth < 50) return 'center'; 
    const horizontalRatio = (nose.x - eyeCenter.x) / faceWidth;
    const faceHeight = jawBottom.y - eyeCenter.y;
    if (faceHeight < 50) return 'center';
    const verticalRatio = (nose.y - eyeCenter.y) / faceHeight;

    if (horizontalRatio > 0.15) return 'left';
    if (horizontalRatio < -0.15) return 'right';
    if (verticalRatio < 0.1) return 'up';
    if (verticalRatio > 0.3) return 'down';

    return 'center';
};


export const StudentRoster: React.FC = () => {
    const { students, faceDescriptors, attendanceRecords, handleSaveFaceDescriptor, showToast } = useData();
    
    const [studentRoster, setStudentRoster] = useState<StudentAttendanceData[]>([]);
    const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
    const [registrationCandidateId, setRegistrationCandidateId] = useState<string | null>(null);
    const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'scanning' | 'scanned' | 'saving' | 'success'>('idle');
    const [capturedDescriptor, setCapturedDescriptor] = useState<Float32Array | null>(null);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanMessage, setScanMessage] = useState('');
    const scanSteps = useMemo(() => ['center', 'up', 'down', 'left', 'right'], []);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [tempDescriptors, setTempDescriptors] = useState<Float32Array[]>([]);
    const [filters, setFilters] = useState({ grade: '', batch: '', searchQuery: '', registrationStatus: 'All' });

    const regVideoRef = useRef<HTMLVideoElement>(null);
    const regCanvasRef = useRef<HTMLCanvasElement>(null);
    const regIntervalRef = useRef<number | null>(null);

    const registrationCandidate = useMemo(() => studentRoster.find(s => s.id === registrationCandidateId), [registrationCandidateId, studentRoster]);
    const viewingStudent = useMemo(() => studentRoster.find(s => s.id === viewingStudentId), [viewingStudentId, studentRoster]);
    const recordsForViewingStudent = useMemo(() => attendanceRecords.filter(r => r.studentId === viewingStudentId), [viewingStudentId, attendanceRecords]);

    useEffect(() => {
        const descriptorMap = new Map(faceDescriptors.map(d => [d.id, d.descriptor]));
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysRecordsMap: Map<string, AttendanceRecord> = new Map(attendanceRecords.filter(r => r.date === todayStr).map(r => [r.studentId, r]));
        const roster = students.filter(s => !s.isArchived).map(student => {
            const todaysRecord = todaysRecordsMap.get(student.id);
            return { 
                ...student, 
                status: todaysRecord?.status || 'None', 
                lastSeen: todaysRecord?.lastSeen || null, 
                isRegistered: descriptorMap.has(student.id)
            };
        });
        setStudentRoster(roster as StudentAttendanceData[]);
    }, [students, faceDescriptors, attendanceRecords]);

    const cancelRegistration = useCallback(() => {
        if (regIntervalRef.current) clearInterval(regIntervalRef.current);
        regIntervalRef.current = null;
        if (regVideoRef.current?.srcObject) {
            (regVideoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            regVideoRef.current.srcObject = null;
        }
        setRegistrationCandidateId(null);
        setRegistrationStatus('idle');
        setScanProgress(0);
        setCurrentStepIndex(0);
        setTempDescriptors([]);
        setCapturedDescriptor(null);
    }, []);

    const handleSaveRegistration = async () => {
        if (!capturedDescriptor || !registrationCandidateId || !registrationCandidate) return;
        setRegistrationStatus('saving');
        setScanMessage('Saving...');
        try {
            await handleSaveFaceDescriptor({ id: registrationCandidateId, descriptor: Array.from(capturedDescriptor) });
            const successMessage = `Registration complete for ${registrationCandidate.name}!`;
            showToast(successMessage, 'success');
            speak(`Thank you, ${registrationCandidate.name}, your face is registered.`);
            setRegistrationStatus('success');
            setScanMessage('Saved successfully!');
            setTimeout(cancelRegistration, 2000);
        } catch (error) {
            console.error("Failed to save face descriptor:", error);
            setRegistrationStatus('scanned'); 
            setScanMessage('Save failed. Please try again.');
            showToast('Could not save registration data.', 'error');
        }
    };
    
    useEffect(() => {
        if (currentStepIndex >= scanSteps.length && tempDescriptors.length > 0) {
            if (regIntervalRef.current) clearInterval(regIntervalRef.current);
            regIntervalRef.current = null;
            setRegistrationStatus('scanned');
            setScanMessage('Scan complete! Press save to confirm.');
            const avgDescriptor = new Float32Array(tempDescriptors[0].length).fill(0);
            for (const d of tempDescriptors) for (let i = 0; i < d.length; i++) avgDescriptor[i] += d[i];
            for (let i = 0; i < avgDescriptor.length; i++) avgDescriptor[i] /= tempDescriptors.length;
            setCapturedDescriptor(avgDescriptor);
        } else if (currentStepIndex < scanSteps.length && registrationStatus === 'scanning') {
            const nextStep = scanSteps[currentStepIndex];
            setScanMessage(nextStep === 'center' ? 'Look straight at the camera.' : `Slowly look ${nextStep}.`);
        }
    }, [currentStepIndex, scanSteps, tempDescriptors, registrationStatus]);
    
    useEffect(() => {
        if (registrationStatus !== 'scanning' || !regVideoRef.current || !regCanvasRef.current || currentStepIndex >= scanSteps.length) return;
        let stream: MediaStream | null = null, isMounted = true;
        const startRegistrationCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                if (regVideoRef.current) {
                    regVideoRef.current.srcObject = stream;
                    regVideoRef.current.onplay = () => {
                        if (isMounted) {
                            if (regIntervalRef.current) clearInterval(regIntervalRef.current);
                            regIntervalRef.current = window.setInterval(handleRegistrationCapture, 300);
                        }
                    };
                }
            } catch (err) { if (isMounted) setScanMessage("Camera error."); }
        };
        const handleRegistrationCapture = async () => {
            if (!regVideoRef.current || !regCanvasRef.current || !isMounted) return;
            const video = regVideoRef.current;
            const canvas = regCanvasRef.current;
            const displaySize = { width: 300, height: video.videoHeight * (300 / video.videoWidth) };
            faceapi.matchDimensions(canvas, displaySize);
            const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
            const context = canvas.getContext('2d');
            context?.clearRect(0, 0, canvas.width, canvas.height);
            if (detection) {
                const pose = getHeadPose(detection.landmarks);
                const requiredPose = scanSteps[currentStepIndex];
                const resizedDetection = faceapi.resizeResults(detection, displaySize);
                const { box } = resizedDetection.detection;
                if (pose === requiredPose) {
                    context.strokeStyle = 'lime'; context.lineWidth = 4; context.strokeRect(box.x, box.y, box.width, box.height);
                    setScanMessage('Hold steady...');
                    if (regIntervalRef.current) clearInterval(regIntervalRef.current);
                    setTimeout(() => {
                        if (isMounted) {
                            setTempDescriptors(prev => [...prev, detection.descriptor]);
                            setScanProgress(p => p + (100 / scanSteps.length));
                            setCurrentStepIndex(i => i + 1);
                        }
                    }, 750);
                } else {
                    context.strokeStyle = 'yellow'; context.lineWidth = 2; context.strokeRect(box.x, box.y, box.width, box.height);
                    setScanMessage(scanSteps[currentStepIndex] === 'center' ? 'Look straight at the camera.' : `Please look ${scanSteps[currentStepIndex]}.`);
                }
            } else setScanMessage('Position face in frame...');
        };
        startRegistrationCamera();
        return () => {
            isMounted = false;
            if (regIntervalRef.current) clearInterval(regIntervalRef.current);
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [registrationStatus, currentStepIndex, scanSteps, cancelRegistration]);

    const handleRegisterClick = (studentId: string) => {
        setScanProgress(0);
        setCurrentStepIndex(0);
        setTempDescriptors([]);
        setCapturedDescriptor(null);
        setScanMessage('Get ready to scan...');
        setRegistrationCandidateId(studentId);
        setRegistrationStatus('scanning');
    };

    const filteredRoster = useMemo(() => studentRoster.filter(s => {
        if (filters.grade && s.grade !== filters.grade) return false;
        if (filters.batch && s.batch !== filters.batch) return false;
        if (filters.searchQuery && !s.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
        if (filters.registrationStatus === 'Registered' && !s.isRegistered) return false;
        if (filters.registrationStatus === 'Unregistered' && s.isRegistered) return false;
        return true;
    }), [studentRoster, filters]);
    
    const clearFilters = () => setFilters({ grade: '', batch: '', searchQuery: '', registrationStatus: 'All' });

    if (viewingStudent) return <StudentAttendanceDetailView student={viewingStudent} records={recordsForViewingStudent} onBack={() => setViewingStudentId(null)} />;
    
    return (
        <>
            {registrationCandidate && (
                <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4 text-white" onClick={cancelRegistration}>
                    <div className="bg-dark-card p-8 rounded-2xl shadow-lg w-full max-w-md text-center relative" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold">Registering {registrationCandidate.name}</h2>
                        
                        <PoseIndicator steps={scanSteps} currentStepIndex={currentStepIndex} />

                        <div className="relative w-full max-w-xs aspect-square mx-auto rounded-full overflow-hidden border-4 border-gray-600">
                            <video ref={regVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]"></video>
                            <canvas ref={regCanvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
                            {registrationStatus !== 'scanning' && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><PlaceholderAvatar /></div>}
                        </div>
                        <div className="px-4 mt-4"><div className="w-full bg-gray-600 rounded-full h-2.5 mb-2"><div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${scanProgress}%`, transition: 'width 0.5s ease-in-out' }}></div></div></div>
                        <div className="h-8 flex items-center justify-center">
                            {registrationStatus === 'success' ? <div className="flex items-center gap-3 text-green-400"><CheckCircleIcon className="h-8 w-8" /><p className="text-xl font-bold">{scanMessage}</p></div>
                             : (registrationStatus === 'scanning' || registrationStatus === 'saving') ? <div className="flex items-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div><p className="text-lg text-gray-300">{scanMessage}</p></div>
                             : <p className="text-lg text-gray-300">{scanMessage}</p>}
                        </div>
                        <div className="mt-6 space-y-2">
                            {registrationStatus === 'scanned' && <button onClick={handleSaveRegistration} className="w-full h-12 px-4 rounded-md bg-brand-blue text-white font-semibold hover:bg-blue-600">Save Registration</button>}
                            <button onClick={cancelRegistration} disabled={registrationStatus === 'scanning' || registrationStatus === 'saving'} className="w-full h-12 px-4 rounded-md bg-gray-600 text-white font-semibold hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed">{registrationStatus === 'scanned' ? 'Cancel' : 'Close'}</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 12rem)' }}>
                <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm mb-4 flex-shrink-0">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">Student Roster</h3>
                    <div className="space-y-3">
                        <input type="text" placeholder="Search student..." value={filters.searchQuery} onChange={e => setFilters(f => ({ ...f, searchQuery: e.target.value }))} className="block w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <select value={filters.grade} onChange={e => setFilters(f => ({ ...f, grade: e.target.value }))} className="block w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"><option value="">All Grades</option>{[...new Set(students.map(s => s.grade))].sort().map(g => <option key={g} value={g}>{g}</option>)}</select>
                            <select value={filters.batch} onChange={e => setFilters(f => ({ ...f, batch: e.target.value }))} className="block w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"><option value="">All Batches</option>{[...new Set(students.map(s => s.batch))].sort().map(b => <option key={b} value={b}>{b}</option>)}</select>
                            <select value={filters.registrationStatus} onChange={e => setFilters(f => ({ ...f, registrationStatus: e.target.value as any }))} className="block w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"><option value="All">All Statuses</option><option value="Registered">Registered</option><option value="Unregistered">Unregistered</option></select>
                            <button onClick={clearFilters} className="h-10 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-medium">Clear</button>
                        </div>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto thin-scrollbar -mr-2 pr-2">
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                        {filteredRoster.length > 0 ? filteredRoster.map(s => <AttendanceStudentCard key={s.id} student={s} onCardClick={() => setViewingStudentId(s.id)} onRegisterClick={() => handleRegisterClick(s.id)} isRegistering={registrationCandidateId === s.id}/>)
                        : <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400"><p className="font-semibold text-lg">No students match filters.</p><p className="text-sm">Try adjusting your filters.</p></div>}
                    </div>
                </div>
            </div>
        </>
    );
};
