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
import { useData } from '../context/DataContext';

declare const faceapi: any;

interface StudentAttendanceData extends Student {
    status: 'Present' | 'Absent';
    lastSeen: string | null;
    isRegistered: boolean;
    faceDescriptor: Float32Array | null;
}

interface DonutChartProps {
    value: number;
    total: number;
    label: string;
    colorClass: string;
    trackColorClass?: string;
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

const DonutChart: React.FC<DonutChartProps> = ({ value, total, label, colorClass, trackColorClass = 'text-gray-200 dark:text-gray-700' }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle className={trackColorClass} stroke="currentColor" strokeWidth="14" fill="transparent" r={radius} cx="60" cy="60" />
                    <circle className={colorClass} stroke="currentColor" strokeWidth="14" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="transparent" r={radius} cx="60" cy="60" style={{ transition: 'stroke-dashoffset 0.5s ease-out' }} />
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

type DetectionPhase = 'IDLE' | 'DETECTED' | 'STABILIZING' | 'RECOGNIZED' | 'UNKNOWN';
const getBoxCenter = (box: any) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
const getDistance = (point1: {x: number, y: number}, point2: {x: number, y: number}) => Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));

const AttendancePage: React.FC = () => {
    const { students, faceDescriptors, attendanceRecords, handleSaveFaceDescriptor, handleSaveAttendanceRecord, showToast } = useData();
    
    const [loadingStatus, setLoadingStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [studentRoster, setStudentRoster] = useState<StudentAttendanceData[]>([]);
    const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
    const [welcomedStudentIds, setWelcomedStudentIds] = useState<Set<string>>(new Set());
    const [registrationCandidateId, setRegistrationCandidateId] = useState<string | null>(null);
    const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'scanning' | 'scanned' | 'saving' | 'success'>('idle');
    const [capturedDescriptor, setCapturedDescriptor] = useState<Float32Array | null>(null);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanMessage, setScanMessage] = useState('');
    const scanSteps = useMemo(() => ['center', 'right', 'left', 'up', 'down'], []);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [tempDescriptors, setTempDescriptors] = useState<Float32Array[]>([]);
    const [faceMatcher, setFaceMatcher] = useState<any>(null);
    const [message, setMessage] = useState<string>('Turn on camera to begin.');
    const [filters, setFilters] = useState({ grade: '', batch: '', searchQuery: '', registrationStatus: 'All' });
    const [detectionPhase, setDetectionPhase] = useState<DetectionPhase>('IDLE');
    const [stabilizationInfo, setStabilizationInfo] = useState<{ startTime: number | null; box: any | null }>({ startTime: null, box: null });
    const [recognizedInfo, setRecognizedInfo] = useState<{ studentId: string; name: string; timestamp: number } | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mainIntervalRef = useRef<number | null>(null);
    const regVideoRef = useRef<HTMLVideoElement>(null);
    const regCanvasRef = useRef<HTMLCanvasElement>(null);
    const regIntervalRef = useRef<number | null>(null);
    const todayColumnRef = useRef<HTMLDivElement>(null);

    const registrationCandidate = useMemo(() => studentRoster.find(s => s.id === registrationCandidateId), [registrationCandidateId, studentRoster]);
    const viewingStudent = useMemo(() => studentRoster.find(s => s.id === viewingStudentId), [viewingStudentId, studentRoster]);
    const recordsForViewingStudent = useMemo(() => attendanceRecords.filter(r => r.studentId === viewingStudentId), [viewingStudentId, attendanceRecords]);

    useEffect(() => {
        const loadModels = async () => {
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
                    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
                    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
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

    useEffect(() => {
        const descriptorMap = new Map(faceDescriptors.map(d => [d.id, d.descriptor]));
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysRecordsMap: Map<string, AttendanceRecord> = new Map(attendanceRecords.filter(r => r.date === todayStr).map(r => [r.studentId, r]));
        const roster = students.filter(s => !s.isArchived).map(student => {
            const descriptorValue = descriptorMap.get(student.id);
            const descriptor = Array.isArray(descriptorValue) ? new Float32Array(descriptorValue) : null;
            const todaysRecord = todaysRecordsMap.get(student.id);
            return { ...student, status: todaysRecord?.status || 'Absent', lastSeen: todaysRecord?.lastSeen || null, isRegistered: !!descriptor, faceDescriptor: descriptor };
        });
        setStudentRoster(roster as StudentAttendanceData[]);
    }, [students, faceDescriptors, attendanceRecords]);
    
    useEffect(() => {
        const registeredStudents = studentRoster.filter(s => s.isRegistered && s.faceDescriptor);
        if (registeredStudents.length > 0) {
            const labeledFaceDescriptors = registeredStudents.map(s => new faceapi.LabeledFaceDescriptors(s.id, [s.faceDescriptor!]));
            setFaceMatcher(new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6));
        } else {
            setFaceMatcher(null);
        }
    }, [studentRoster]);

    const stopAllCameras = useCallback(() => {
        if (mainIntervalRef.current) clearInterval(mainIntervalRef.current);
        mainIntervalRef.current = null;
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
    }, []);

    useEffect(() => () => stopAllCameras(), [stopAllCameras]);

    const resetDetectionState = () => {
        setDetectionPhase('IDLE');
        setStabilizationInfo({ startTime: null, box: null });
        if (canvasRef.current) {
            canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const startCamera = async () => {
        resetDetectionState();
        setRecognizedInfo(null);
        setWelcomedStudentIds(new Set());
        if (isCameraOn || !videoRef.current) return;
        try {
            videoRef.current.srcObject = await navigator.mediaDevices.getUserMedia({ video: {} });
            setIsCameraOn(true);
        } catch (err) {
            console.error("Error accessing webcam:", err);
            setMessage("Camera permission denied.");
        }
    };
    
    const handleAttendanceDetection = useCallback(async () => {
        if (videoRef.current?.readyState !== 4 || !canvasRef.current || registrationCandidateId || !faceMatcher) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (recognizedInfo && Date.now() - recognizedInfo.timestamp < 5000) {
            setMessage(`Welcome, ${recognizedInfo.name}!`);
            return;
        } else if (recognizedInfo) {
            setRecognizedInfo(null);
            resetDetectionState();
        }

        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
        if (detections.length === 0) {
            if (detectionPhase !== 'IDLE') resetDetectionState();
            setMessage('Searching for faces...');
            return;
        }
        const bestDetection = detections.reduce((best, current) => current.detection.box.area > best.detection.box.area ? current : best);
        const resizedDetection = faceapi.resizeResults(bestDetection, displaySize);
        const { box } = resizedDetection.detection;
        
        switch (detectionPhase) {
            case 'IDLE':
                setDetectionPhase('DETECTED');
                setStabilizationInfo({ startTime: null, box: box });
                setMessage('Face detected. Please hold still.');
                context.strokeStyle = 'yellow';
                context.lineWidth = 2;
                context.strokeRect(box.x, box.y, box.width, box.height);
                break;
            case 'DETECTED':
            case 'STABILIZING':
                const moved = stabilizationInfo.box && getDistance(getBoxCenter(box), getBoxCenter(stabilizationInfo.box)) > 30;
                if (moved) {
                    resetDetectionState();
                    break;
                }
                const startTime = stabilizationInfo.startTime ?? Date.now();
                if (!stabilizationInfo.startTime) {
                    setStabilizationInfo({ startTime, box });
                    setDetectionPhase('STABILIZING');
                }
                const elapsed = Date.now() - startTime;
                const progress = elapsed / 3000;
                if (progress >= 1) {
                    const result = faceMatcher.findBestMatch(resizedDetection.descriptor);
                    if (result.label !== 'unknown') {
                        const student = studentRoster.find(s => s.id === result.label);
                        if (student && !welcomedStudentIds.has(student.id)) {
                             const now = new Date();
                             const recordId = `${student.id}_${now.toISOString().split('T')[0]}`;
                             const recordForToday = attendanceRecords.find(r => r.id === recordId);
                             if (recordForToday?.status === 'Absent') {
                                 handleSaveAttendanceRecord({ ...recordForToday, status: 'Present', inTime: now.toLocaleTimeString('en-US', { hour12: false }), lastSeen: now.toLocaleTimeString('en-US', { hour12: false }) });
                             }
                             showToast(`Welcome, ${student.name}!`, 'success');
                             speak(`Welcome, ${student.name}`);
                             setWelcomedStudentIds(prev => new Set(prev).add(student.id));
                             setRecognizedInfo({ studentId: student.id, name: student.name, timestamp: Date.now() });
                             setDetectionPhase('RECOGNIZED');
                        } else resetDetectionState();
                    } else {
                        setMessage('Unrecognized face.');
                        setDetectionPhase('UNKNOWN');
                        setTimeout(resetDetectionState, 2000);
                    }
                } else {
                    setMessage('Hold still...');
                    context.strokeStyle = 'yellow';
                    context.lineWidth = 2;
                    context.strokeRect(box.x, box.y, box.width, box.height);
                    context.beginPath();
                    context.strokeStyle = 'lime';
                    context.lineWidth = 5;
                    context.arc(box.x + box.width / 2, box.y + box.height / 2, box.width / 2 + 5, -Math.PI / 2, -Math.PI / 2 + progress * 2 * Math.PI);
                    context.stroke();
                }
                break;
            case 'UNKNOWN':
                context.strokeStyle = 'red';
                context.lineWidth = 4;
                context.strokeRect(box.x, box.y, box.width, box.height);
                break;
        }
    }, [faceMatcher, studentRoster, attendanceRecords, handleSaveAttendanceRecord, showToast, welcomedStudentIds, registrationCandidateId, detectionPhase, stabilizationInfo, recognizedInfo, speak]);

    const cancelRegistration = useCallback(() => {
        if (regIntervalRef.current) clearInterval(regIntervalRef.current);
        regIntervalRef.current = null;
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
            setScanMessage(nextStep === 'center' ? 'Look straight at the camera.' : `Slowly turn your head to the ${nextStep}.`);
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
                    setScanMessage(scanSteps[currentStepIndex] === 'center' ? 'Look straight at the camera.' : `Please look to the ${scanSteps[currentStepIndex]}.`);
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

    useEffect(() => {
        if (isCameraOn && videoRef.current) mainIntervalRef.current = window.setInterval(handleAttendanceDetection, 300);
        else if (mainIntervalRef.current) clearInterval(mainIntervalRef.current);
        return () => { if (mainIntervalRef.current) clearInterval(mainIntervalRef.current) };
    }, [isCameraOn, handleAttendanceDetection]);

    const handleRegisterClick = (studentId: string) => {
        if (!isCameraOn) {
            showToast("Please start the main camera before registering.", "error");
            return;
        }
        setScanProgress(0);
        setCurrentStepIndex(0);
        setTempDescriptors([]);
        setCapturedDescriptor(null);
        setScanMessage('Get ready to scan...');
        setRegistrationCandidateId(studentId);
        setRegistrationStatus('scanning');
    };
    
    const stats = useMemo(() => ({
        totalRegistered: studentRoster.filter(s => s.isRegistered).length,
        totalPresent: studentRoster.filter(s => s.status === 'Present').length,
        totalStudents: studentRoster.length
    }), [studentRoster]);

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
                        <div className="relative w-full max-w-xs aspect-square mx-auto my-4 rounded-full overflow-hidden border-4 border-gray-600">
                            <video ref={regVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]"></video>
                            <canvas ref={regCanvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
                            {registrationStatus !== 'scanning' && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><PlaceholderAvatar /></div>}
                        </div>
                        <div className="px-4"><div className="w-full bg-gray-600 rounded-full h-2.5 mb-2"><div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${scanProgress}%`, transition: 'width 0.5s ease-in-out' }}></div></div></div>
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
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="lg:w-96 xl:w-[420px] flex-shrink-0 w-full lg:sticky lg:top-8 space-y-8">
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Live Preview</h3>
                        <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-lg mb-4">
                            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]"></video>
                            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
                            {!isCameraOn && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><p className="text-white text-lg font-semibold">Camera is off</p></div>}
                        </div>
                        <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm text-center"><p className="text-gray-600 dark:text-gray-300 font-medium min-h-[24px]">{message}</p></div>
                        <div className="mt-4 flex gap-2">
                            <button onClick={startCamera} disabled={loadingStatus !== 'loaded'} className="flex-1 h-12 px-4 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 disabled:bg-gray-400">{loadingStatus === 'loaded' ? 'Start Camera' : loadingStatus === 'loading' ? 'Loading Models...' : 'Models Failed'}</button>
                            <button onClick={stopAllCameras} className="flex-1 h-12 px-4 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700">Stop Camera</button>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Today's Summary</h3>
                        <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-around items-center gap-6">
                            <DonutChart value={stats.totalPresent} total={stats.totalStudents} label="Present" colorClass="text-green-500" trackColorClass="text-red-500/30 dark:text-red-500/20" />
                            <div className="h-24 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
                            <DonutChart value={stats.totalRegistered} total={stats.totalStudents} label="Registered" colorClass="text-blue-500" />
                        </div>
                    </div>
                </div>
                <div className="flex-grow w-full flex flex-col" style={{ height: 'calc(100vh - 7rem)' }}>
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
            </div>
        </>
    );
};

export default AttendancePage;
