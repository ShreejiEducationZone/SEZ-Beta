
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Student, FaceDescriptorData, AttendanceRecord } from '../types';
import AttendanceStudentCard from './AttendanceStudentCard';
import StudentAttendanceDetailView from './StudentAttendanceDetailView';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import FaceIdIcon from './icons/FaceIdIcon';
import AttendanceIcon from './icons/AttendanceIcon';
import PlaceholderAvatar from './PlaceholderAvatar';
import { speak } from '../utils/voiceService';
import { Toast } from './Toast';


declare const faceapi: any;

interface StudentAttendanceData extends Student {
    status: 'Present' | 'Absent';
    lastSeen: string | null;
    isRegistered: boolean;
    faceDescriptor: Float32Array | null;
}

interface AttendancePageProps {
    students: Student[];
    faceDescriptors: FaceDescriptorData[];
    attendanceRecords: AttendanceRecord[];
    onSaveFaceDescriptor: (descriptor: FaceDescriptorData) => Promise<void>;
    onSaveAttendanceRecord: (record: AttendanceRecord) => Promise<void>;
    showToast: (message: string, type: Toast['type']) => void;
}

interface DonutChartProps {
    value: number;
    total: number;
    label: string;
    colorClass: string;
    trackColorClass?: string;
}

const DonutChart: React.FC<DonutChartProps> = ({ value, total, label, colorClass, trackColorClass = 'text-gray-200 dark:text-gray-700' }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle
                        className={trackColorClass}
                        stroke="currentColor"
                        strokeWidth="14"
                        fill="transparent"
                        r={radius}
                        cx="60"
                        cy="60"
                    />
                    <circle
                        className={colorClass}
                        stroke="currentColor"
                        strokeWidth="14"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                        r={radius}
                        cx="60"
                        cy="60"
                        style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-gray-800 dark:text-white">{value}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">of {total}</span>
                </div>
            </div>
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">{label}</p>
        </div>
    );
};


const AttendancePage: React.FC<AttendancePageProps> = ({ students, faceDescriptors, attendanceRecords, onSaveFaceDescriptor, onSaveAttendanceRecord, showToast }) => {
    const [loadingStatus, setLoadingStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [studentRoster, setStudentRoster] = useState<StudentAttendanceData[]>([]);
    const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
    const [welcomedStudentIds, setWelcomedStudentIds] = useState<Set<string>>(new Set());
    
    const [registrationCandidateId, setRegistrationCandidateId] = useState<string | null>(null);
    const [registrationMessage, setRegistrationMessage] = useState<string>('');
    const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'scanning' | 'scanned' | 'saving' | 'success'>('idle');
    const [capturedDescriptor, setCapturedDescriptor] = useState<Float32Array | null>(null);

    const [faceMatcher, setFaceMatcher] = useState<any>(null);
    const [message, setMessage] = useState<string>('Turn on camera to begin.');

    const [filters, setFilters] = useState({ grade: '', batch: '', searchQuery: '', registrationStatus: 'All' });

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mainIntervalRef = useRef<number | null>(null);
    
    const regVideoRef = useRef<HTMLVideoElement>(null);
    const regCanvasRef = useRef<HTMLCanvasElement>(null);
    const regIntervalRef = useRef<number | null>(null);

    const registrationCandidate = useMemo(() => {
        if (!registrationCandidateId) return null;
        return studentRoster.find(s => s.id === registrationCandidateId);
    }, [registrationCandidateId, studentRoster]);

    const viewingStudent = useMemo(() => {
        if (!viewingStudentId) return null;
        return studentRoster.find(s => s.id === viewingStudentId);
    }, [viewingStudentId, studentRoster]);

    const recordsForViewingStudent = useMemo(() => {
        if (!viewingStudentId) return [];
        return attendanceRecords.filter(r => r.studentId === viewingStudentId);
    }, [viewingStudentId, attendanceRecords]);


    // Load face-api.js models on component mount
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                ]);
                setLoadingStatus('loaded');
            } catch (error) {
                console.error("Failed to load face-api models:", error);
                setLoadingStatus('error');
                showToast("Error loading AI models. Check console for details.", 'error');
            }
        };
        loadModels();
    }, [showToast]);

    // Initialize student roster from props and saved descriptors
    useEffect(() => {
        const descriptorMap = new Map(faceDescriptors.map(d => [d.id, d.descriptor]));
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysRecords = new Map(
            attendanceRecords
                .filter(r => r.date === todayStr)
                .map(r => [r.studentId, r])
        );

        const roster = students
            .filter(s => !s.isArchived)
            .map(student => {
                const descriptorValue = descriptorMap.get(student.id);
                const descriptorArray: number[] | undefined = Array.isArray(descriptorValue) ? descriptorValue : undefined;
                const descriptor = descriptorArray ? new Float32Array(descriptorArray) : null;
                
                const recordValue = todaysRecords.get(student.id);
                const todaysRecord: AttendanceRecord | undefined = (recordValue && typeof recordValue === 'object' && 'status' in recordValue) ? recordValue as AttendanceRecord : undefined;

                return {
                    ...student,
                    status: todaysRecord ? 'Present' : 'Absent',
                    lastSeen: todaysRecord ? todaysRecord.lastSeen : null,
                    isRegistered: !!descriptor,
                    faceDescriptor: descriptor,
                };
            });
        setStudentRoster(roster as StudentAttendanceData[]);
    }, [students, faceDescriptors, attendanceRecords]);
    
    // Create or update the FaceMatcher when the roster of registered students changes
    useEffect(() => {
        const registeredStudents = studentRoster.filter(s => s.isRegistered && s.faceDescriptor);
        if (registeredStudents.length > 0) {
            const labeledFaceDescriptors = registeredStudents.map(s =>
                new faceapi.LabeledFaceDescriptors(s.id, [s.faceDescriptor!])
            );
            setFaceMatcher(new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6));
        } else {
            setFaceMatcher(null);
        }
    }, [studentRoster]);

    // Cleanup camera on component unmount
    useEffect(() => () => stopAllCameras(), []);

    const startCamera = async () => {
        setWelcomedStudentIds(new Set()); // Reset for new session
        if (isCameraOn || !videoRef.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            videoRef.current.srcObject = stream;
            setIsCameraOn(true);
            setMessage('Camera active. Ready for detection.');
        } catch (err) {
            console.error("Error accessing webcam:", err);
            setMessage("Camera permission denied. Please allow camera access.");
        }
    };
    
    const stopAllCameras = () => {
        if (mainIntervalRef.current) clearInterval(mainIntervalRef.current);
        mainIntervalRef.current = null;
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
        setWelcomedStudentIds(new Set());
        setRegistrationCandidateId(null);
        setMessage('Turn on camera to begin.');
        if (canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };
    
    // Main detection loop for attendance
    const handleAttendanceDetection = useCallback(async () => {
        if (videoRef.current?.readyState !== 4 || !canvasRef.current || registrationCandidateId) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
        
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        
        const context = canvas.getContext('2d');
        context?.clearRect(0, 0, canvas.width, canvas.height);

        if (faceMatcher && resizedDetections.length > 0) {
            const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
            
            results.forEach((result, i) => {
                const box = resizedDetections[i].detection.box;
                const studentId = result.label;
                
                if (studentId !== 'unknown') {
                    const student = studentRoster.find(s => s.id === studentId);
                    if (student) {
                        const drawBox = new faceapi.draw.DrawBox(box, { label: student.name, boxColor: 'green' });
                        drawBox.draw(canvas);

                        const now = new Date();
                        const currentTimeStr = now.toLocaleTimeString('en-US', { hour12: false });
                        
                        if (student.status === 'Absent') {
                            if (!welcomedStudentIds.has(studentId)) {
                                const welcomeMessage = `Welcome, ${student.name}! Attendance marked.`;
                                const voiceMessage = `Welcome, ${student.name}.`;
                                showToast(welcomeMessage, 'info');
                                speak(voiceMessage);
                                setWelcomedStudentIds(prev => new Set(prev).add(studentId));
                            }
                            const todayStr = now.toISOString().split('T')[0];
                            const recordId = `${studentId}_${todayStr}`;
                            setStudentRoster(prev => prev.map(s => s.id === studentId ? { ...s, status: 'Present', lastSeen: currentTimeStr } : s));
                            const newRecord: AttendanceRecord = { id: recordId, studentId, date: todayStr, status: 'Present', inTime: currentTimeStr, lastSeen: currentTimeStr };
                            onSaveAttendanceRecord(newRecord);
                        } else {
                             setStudentRoster(prev => prev.map(s => s.id === studentId ? { ...s, lastSeen: currentTimeStr } : s));
                             const todayStr = now.toISOString().split('T')[0];
                             const recordId = `${studentId}_${todayStr}`;
                             const existingRecord = attendanceRecords.find(r => r.id === recordId);
                             if (existingRecord) {
                                onSaveAttendanceRecord({ ...existingRecord, lastSeen: currentTimeStr });
                             }
                        }
                    }
                } else {
                    const drawBox = new faceapi.draw.DrawBox(box, { label: 'Unregistered', boxColor: 'red' });
                    drawBox.draw(canvas);
                }
            });
            setMessage(results.some(r => r.label !== 'unknown') ? 'Attendance being marked...' : 'No registered students in frame.');
        } else {
            setMessage(faceMatcher ? 'Searching for faces...' : 'No students registered. Please register a student first.');
        }
    }, [faceMatcher, studentRoster, registrationCandidateId, onSaveAttendanceRecord, attendanceRecords, showToast, welcomedStudentIds]);

    const handleSaveRegistration = async () => {
        if (!capturedDescriptor || !registrationCandidateId || !registrationCandidate) return;

        setRegistrationStatus('saving');
        setRegistrationMessage('Saving...');

        const descriptorData: FaceDescriptorData = {
            id: registrationCandidateId,
            descriptor: Array.from(capturedDescriptor)
        };

        try {
            await onSaveFaceDescriptor(descriptorData);

            const studentName = registrationCandidate.name;
            const successMessage = `Registration complete for ${studentName}!`;
            const voiceMessage = `Thank you, ${studentName}, your face is registered.`;
            showToast(successMessage, 'success');
            speak(voiceMessage);

            setRegistrationStatus('success');
            setRegistrationMessage('Saved successfully!');

            setTimeout(() => {
                setRegistrationCandidateId(null);
                setRegistrationStatus('idle');
            }, 2000);
        } catch (error) {
            console.error("Failed to save face descriptor:", error);
            setRegistrationStatus('scanned'); // Revert to scanned state to allow retry
            setRegistrationMessage('Save failed. Please try again.');
            showToast('Could not save registration data.', 'error');
        }
    };
    
    const cancelRegistration = useCallback(() => {
        setRegistrationCandidateId(null);
        setRegistrationStatus('idle');
    }, []);

    useEffect(() => {
        if (registrationStatus !== 'scanning' || !regVideoRef.current || !regCanvasRef.current) return;

        let stream: MediaStream | null = null;
        let isMounted = true;

        const startRegistrationCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                if (regVideoRef.current) {
                    regVideoRef.current.srcObject = stream;
                    regVideoRef.current.onplay = () => {
                        if (isMounted) {
                            if (regIntervalRef.current) clearInterval(regIntervalRef.current);
                            regIntervalRef.current = window.setInterval(handleRegistrationCapture, 200);
                        }
                    };
                }
            } catch (err) {
                if (isMounted) setRegistrationMessage("Camera error. Please allow access.");
            }
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
                if (faceMatcher) {
                    const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
                    const matchedStudentId = bestMatch.label;
                    
                    if (matchedStudentId !== 'unknown' && matchedStudentId !== registrationCandidateId) {
                        const matchedStudent = studentRoster.find(s => s.id === matchedStudentId);
                        const errorMessage = `This face is already registered to ${matchedStudent?.name || 'another student'}. Please try with a different student.`;
                        
                        if (isMounted) {
                            showToast(errorMessage, 'error');
                            speak('This face is already registered to another student.');
                            
                            if (regIntervalRef.current) clearInterval(regIntervalRef.current);
                            regIntervalRef.current = null;
                            cancelRegistration();
                        }
                        return;
                    }
                }

                const resizedDetections = faceapi.resizeResults(detection, displaySize);
                if (context) {
                    context.strokeStyle = 'lime';
                    context.lineWidth = 4;
                    context.strokeRect(resizedDetections.detection.box.x, resizedDetections.detection.box.y, resizedDetections.detection.box.width, resizedDetections.detection.box.height);
                }

                if (regIntervalRef.current) clearInterval(regIntervalRef.current);
                regIntervalRef.current = null;
                
                if (isMounted) {
                    setCapturedDescriptor(detection.descriptor);
                    setRegistrationStatus('scanned');
                    setRegistrationMessage('Scan complete! Press save to confirm.');
                }
            } else {
                 if (isMounted) setRegistrationMessage('Position face in the frame...');
            }
        };
        
        startRegistrationCamera();

        return () => {
            isMounted = false;
            if (regIntervalRef.current) clearInterval(regIntervalRef.current);
            regIntervalRef.current = null;
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, [registrationStatus, faceMatcher, registrationCandidateId, studentRoster, showToast, cancelRegistration]);

    // Manages the detection interval, preventing stale closures.
    useEffect(() => {
        if (isCameraOn && videoRef.current) {
            mainIntervalRef.current = window.setInterval(handleAttendanceDetection, 500);
        } else {
            if (mainIntervalRef.current) {
                clearInterval(mainIntervalRef.current);
                mainIntervalRef.current = null;
            }
        }
        return () => {
            if (mainIntervalRef.current) {
                clearInterval(mainIntervalRef.current);
            }
        };
    }, [isCameraOn, handleAttendanceDetection]);

    const handleRegisterClick = (studentId: string) => {
        if (!isCameraOn) {
            showToast("Please start the main camera before registering a student.", "error");
            return;
        }
        setCapturedDescriptor(null);
        setRegistrationMessage('Loading registration camera...');
        setRegistrationCandidateId(studentId);
        setRegistrationStatus('scanning');
    };
    
    const stats = useMemo(() => {
        const totalRegistered = studentRoster.filter(s => s.isRegistered).length;
        const totalPresent = studentRoster.filter(s => s.status === 'Present').length;
        const totalStudents = studentRoster.length;

        return { totalRegistered, totalPresent, totalStudents };
    }, [studentRoster]);

    const filteredRoster = useMemo(() => {
        return studentRoster.filter(s => {
            if (filters.grade && s.grade !== filters.grade) return false;
            if (filters.batch && s.batch !== filters.batch) return false;
            if (filters.searchQuery && !s.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
            if (filters.registrationStatus === 'Registered' && !s.isRegistered) return false;
            if (filters.registrationStatus === 'Unregistered' && s.isRegistered) return false;
            return true;
        });
    }, [studentRoster, filters]);
    
    const clearFilters = () => setFilters({ grade: '', batch: '', searchQuery: '', registrationStatus: 'All' });

    if (viewingStudent) {
        return <StudentAttendanceDetailView student={viewingStudent} records={recordsForViewingStudent} onBack={() => setViewingStudentId(null)} />;
    }
    
    const renderRegistrationModal = () => {
        if (!registrationCandidate) return null;
        
        const isProcessing = registrationStatus === 'scanning' || registrationStatus === 'saving';

        return (
             <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center p-4 text-white">
                <div className="bg-dark-card p-8 rounded-2xl shadow-lg w-full max-w-md text-center relative" onClick={e => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold">Registering {registrationCandidate.name}</h2>
                    
                    <div className="relative w-full max-w-xs aspect-square mx-auto my-4 rounded-full overflow-hidden border-4 border-gray-600">
                        <video ref={regVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]"></video>
                        <canvas ref={regCanvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
                        {registrationStatus !== 'scanning' && registrationStatus !== 'scanned' && (
                             <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                <PlaceholderAvatar />
                            </div>
                        )}
                    </div>
                    
                    <div className="h-8 flex items-center justify-center">
                        {registrationStatus === 'success' ? (
                            <div className="flex items-center gap-3 text-green-400">
                                <CheckCircleIcon className="h-8 w-8" />
                                <p className="text-xl font-bold">{registrationMessage}</p>
                            </div>
                        ) : isProcessing ? (
                             <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <p className="text-lg text-gray-300">{registrationMessage}</p>
                             </div>
                        ) : (
                            <p className="text-lg text-gray-300">{registrationMessage}</p>
                        )}
                    </div>
                    
                    <div className="mt-6 space-y-2">
                        {registrationStatus === 'scanned' && (
                            <button
                                onClick={handleSaveRegistration}
                                className="w-full h-12 px-4 rounded-md bg-brand-blue text-white font-semibold hover:bg-blue-600"
                            >
                                Save Registration
                            </button>
                        )}
                        <button
                            onClick={cancelRegistration}
                            disabled={isProcessing}
                            className="w-full h-12 px-4 rounded-md bg-gray-600 text-white font-semibold hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
                        >
                            {registrationStatus === 'scanned' ? 'Cancel' : 'Close'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {renderRegistrationModal()}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar (LEFT) */}
                <div className="lg:w-96 xl:w-[420px] flex-shrink-0 w-full lg:sticky lg:top-8 space-y-8">
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Live Preview</h3>
                        <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg mb-4">
                            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]"></video>
                            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
                            {!isCameraOn && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                                    <p className="text-white text-lg font-semibold">Camera is off</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm text-center">
                            <p className="text-gray-600 dark:text-gray-300 font-medium min-h-[24px]">{message}</p>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button onClick={startCamera} disabled={loadingStatus !== 'loaded'} className="flex-1 h-12 px-4 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 disabled:bg-gray-400">
                                {
                                    loadingStatus === 'loaded' ? 'Start Camera' :
                                    loadingStatus === 'loading' ? 'Loading Models...' :
                                    'Models Failed'
                                }
                            </button>
                            <button onClick={stopAllCameras} className="flex-1 h-12 px-4 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700">Stop Camera</button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Today's Summary</h3>
                        <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-around items-center gap-6">
                            <DonutChart 
                                value={stats.totalPresent} 
                                total={stats.totalStudents}
                                label="Present"
                                colorClass="text-green-500"
                                trackColorClass="text-red-500/30 dark:text-red-500/20"
                            />
                            <div className="h-24 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
                            <DonutChart 
                                value={stats.totalRegistered}
                                total={stats.totalStudents}
                                label="Registered"
                                colorClass="text-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content: Roster (RIGHT) */}
                <div className="flex-grow w-full flex flex-col" style={{ height: 'calc(100vh - 7rem)' }}> {/* 5rem header + 2rem top padding from App.tsx */}
                    <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm mb-4 flex-shrink-0">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">Student Roster</h3>
                        <div className="space-y-3">
                            <input type="text" placeholder="Search student..." value={filters.searchQuery} onChange={e => setFilters(f => ({ ...f, searchQuery: e.target.value }))} className="block w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50" />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <select value={filters.grade} onChange={e => setFilters(f => ({ ...f, grade: e.target.value }))} className="block w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                                    <option value="">All Grades</option>
                                    {[...new Set(students.map(s => s.grade))].sort().map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <select value={filters.batch} onChange={e => setFilters(f => ({ ...f, batch: e.target.value }))} className="block w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                                    <option value="">All Batches</option>
                                    {[...new Set(students.map(s => s.batch))].sort().map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                                <select value={filters.registrationStatus} onChange={e => setFilters(f => ({ ...f, registrationStatus: e.target.value as any }))} className="block w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                                    <option value="All">All Statuses</option>
                                    <option value="Registered">Registered</option>
                                    <option value="Unregistered">Unregistered</option>
                                </select>
                                <button onClick={clearFilters} className="h-10 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-medium">Clear</button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto thin-scrollbar -mr-2 pr-2">
                        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                            {filteredRoster.length > 0 ? (
                                filteredRoster.map(s => <AttendanceStudentCard key={s.id} student={s} onCardClick={() => setViewingStudentId(s.id)} onRegisterClick={() => handleRegisterClick(s.id)} isRegistering={registrationCandidateId === s.id}/>)
                            ) : (
                                <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400">
                                    <p className="font-semibold text-lg">No students match the current filters.</p>
                                    <p className="text-sm">Try adjusting your search or filters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AttendancePage;
