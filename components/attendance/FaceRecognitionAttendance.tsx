
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Student, FaceDescriptorData, AttendanceRecord } from '../../types';
import { speak } from '../../utils/voiceService';
import { useData } from '../../context/DataContext';
import { FaCamera, FaStopCircle } from 'react-icons/fa';

declare const faceapi: any;

type DetectionPhase = 'IDLE' | 'DETECTED' | 'STABILIZING' | 'RECOGNIZED' | 'UNKNOWN';
const getBoxCenter = (box: any) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
const getDistance = (point1: {x: number, y: number}, point2: {x: number, y: number}) => Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));

// NEW: Constants for the new logic
const STABILIZATION_TIME_MS = 2500; // Max time to try and recognize
const VOTE_THRESHOLD = 5;           // How many confident matches are needed for recognition
const DISTANCE_THRESHOLD = 0.55;    // Stricter matching threshold (lower is stricter)

export const FaceRecognitionAttendance: React.FC = () => {
    const { students, faceDescriptors, attendanceRecords, handleSaveAttendanceRecord, showToast } = useData();
    
    const [loadingStatus, setLoadingStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [faceMatcher, setFaceMatcher] = useState<any>(null);
    const [message, setMessage] = useState<string>('Turn on the scanner to begin.');
    const [detectionPhase, setDetectionPhase] = useState<DetectionPhase>('IDLE');
    const [stabilizationInfo, setStabilizationInfo] = useState<{ startTime: number | null; box: any | null }>({ startTime: null, box: null });
    const [recognizedInfo, setRecognizedInfo] = useState<{ studentId: string; name: string; timestamp: number } | null>(null);
    const [welcomedStudentIds, setWelcomedStudentIds] = useState<Set<string>>(new Set());
    const [stabilizationVotes, setStabilizationVotes] = useState<Map<string, number>>(new Map());

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mainIntervalRef = useRef<number | null>(null);

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
                showToast("Error loading AI models. The scanner may not work.", 'error');
            }
        };
        loadModels();
    }, [showToast]);
    
    useEffect(() => {
        const registeredStudents = faceDescriptors
            .map(fd => {
                const student = students.find(s => s.id === fd.id && !s.isArchived);
                return student ? { ...student, descriptor: new Float32Array(fd.descriptor) } : null;
            })
            .filter(Boolean);

        if (registeredStudents.length > 0) {
            const labeledFaceDescriptors = registeredStudents.map(s => new faceapi.LabeledFaceDescriptors(s!.id, [s!.descriptor]));
            setFaceMatcher(new faceapi.FaceMatcher(labeledFaceDescriptors, DISTANCE_THRESHOLD));
        } else {
            setFaceMatcher(null);
        }
    }, [faceDescriptors, students]);

    const stopAllCameras = useCallback(() => {
        if (mainIntervalRef.current) clearInterval(mainIntervalRef.current);
        mainIntervalRef.current = null;
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOn(false);
        setMessage('Scanner is offline.');
    }, []);

    useEffect(() => () => stopAllCameras(), [stopAllCameras]);
    
    const resetDetectionState = () => {
        setDetectionPhase('IDLE');
        setStabilizationInfo({ startTime: null, box: null });
        setStabilizationVotes(new Map());
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
            showToast("Camera permission is required. Please enable it in your browser settings.", 'error');
        }
    };
    
    const handleAttendanceDetection = useCallback(async () => {
        if (videoRef.current?.readyState !== 4 || !canvasRef.current || !faceMatcher) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;
        
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
        context.clearRect(0, 0, canvas.width, canvas.height);

        if (recognizedInfo && Date.now() - recognizedInfo.timestamp < 4000) {
            setMessage(`Welcome, ${recognizedInfo.name}!`);
            return;
        } else if (recognizedInfo) {
            setRecognizedInfo(null);
            resetDetectionState();
        }

        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })).withFaceLandmarks().withFaceDescriptor();

        if (!detection) {
            if (detectionPhase !== 'IDLE') resetDetectionState();
            setMessage('Searching...');
            return;
        }
        
        const resizedDetection = faceapi.resizeResults(detection, displaySize);
        const { box } = resizedDetection.detection;
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        const radius = box.width / 2;
        
        switch (detectionPhase) {
            case 'IDLE':
                setDetectionPhase('STABILIZING');
                setStabilizationInfo({ startTime: Date.now(), box });
                setStabilizationVotes(new Map());
                setMessage('Face detected. Hold still.');
                context.strokeStyle = 'rgba(255, 255, 0, 0.7)';
                context.lineWidth = 3;
                context.beginPath(); context.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI); context.stroke();
                break;

            case 'STABILIZING':
                const moved = stabilizationInfo.box && getDistance(getBoxCenter(box), getBoxCenter(stabilizationInfo.box)) > 20;
                if (moved) { resetDetectionState(); break; }

                const startTime = stabilizationInfo.startTime!;
                const elapsed = Date.now() - startTime;
                
                const result = faceMatcher.findBestMatch(resizedDetection.descriptor);
                let maxVotes = 0;
                let bestMatchLabel = 'unknown';

                if (result.label !== 'unknown' && result.distance < DISTANCE_THRESHOLD) {
                    const currentVotes = (stabilizationVotes.get(result.label) || 0) + 1;
                    setStabilizationVotes(prev => new Map(prev).set(result.label, currentVotes));
                }
                
                if (stabilizationVotes.size > 0) {
                    for (const [label, votes] of stabilizationVotes.entries()) {
                        if (votes > maxVotes) {
                            maxVotes = votes;
                            bestMatchLabel = label;
                        }
                    }
                }
                
                const progress = Math.min(maxVotes / VOTE_THRESHOLD, 1);

                if (maxVotes >= VOTE_THRESHOLD) {
                    const student = students.find(s => s.id === bestMatchLabel);
                    if (student && !welcomedStudentIds.has(student.id)) {
                         const now = new Date();
                         const recordId = `${student.id}_${now.toISOString().split('T')[0]}`;
                         const recordForToday = attendanceRecords.find(r => r.id === recordId);
                         if (recordForToday?.status !== 'Present') {
                             handleSaveAttendanceRecord({ ...(recordForToday || {}), id: recordId, studentId: student.id, date: now.toISOString().split('T')[0], status: 'Present', inTime: now.toLocaleTimeString('en-US', { hour12: false }), lastSeen: now.toLocaleTimeString('en-US', { hour12: false }) });
                         }
                         showToast(`Welcome, ${student.name}!`, 'success');
                         speak(`Welcome, ${student.name}`);
                         setWelcomedStudentIds(prev => new Set(prev).add(student.id));
                         setRecognizedInfo({ studentId: student.id, name: student.name, timestamp: Date.now() });
                         setDetectionPhase('RECOGNIZED');
                    } else resetDetectionState();
                } else if (elapsed > STABILIZATION_TIME_MS) {
                    setMessage('Unrecognized face.');
                    setDetectionPhase('UNKNOWN');
                    setTimeout(resetDetectionState, 2000);
                } else {
                    setMessage('Verifying...');
                    context.strokeStyle = 'rgba(255, 255, 0, 0.7)'; context.lineWidth = 3;
                    context.beginPath(); context.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI); context.stroke();
                    context.beginPath(); context.strokeStyle = 'lime'; context.lineWidth = 5;
                    context.arc(centerX, centerY, radius + 8, -Math.PI / 2, -Math.PI / 2 + progress * 2 * Math.PI); context.stroke();
                }
                break;

            case 'UNKNOWN':
                context.strokeStyle = 'rgba(255, 0, 0, 0.8)'; context.lineWidth = 4;
                context.beginPath(); context.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI); context.stroke();
                break;
            
            case 'RECOGNIZED':
                context.strokeStyle = 'rgba(0, 255, 0, 0.8)'; context.lineWidth = 4;
                context.beginPath(); context.arc(centerX, centerY, radius + 5, 0, 2 * Math.PI); context.stroke();
                break;
        }
    }, [faceMatcher, students, attendanceRecords, handleSaveAttendanceRecord, showToast, welcomedStudentIds, detectionPhase, stabilizationInfo, recognizedInfo, speak, stabilizationVotes]);

    useEffect(() => {
        if (isCameraOn && videoRef.current) {
            mainIntervalRef.current = window.setInterval(handleAttendanceDetection, 100);
        } else if (mainIntervalRef.current) {
            clearInterval(mainIntervalRef.current);
        }
        return () => { if (mainIntervalRef.current) clearInterval(mainIntervalRef.current) };
    }, [isCameraOn, handleAttendanceDetection]);

    return (
        <div>
            <div className="relative w-full max-w-4xl mx-auto aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl mb-4 group">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]"></video>
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
                {!isCameraOn && <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm"><p className="text-white text-2xl font-semibold tracking-wider">SCANNER OFFLINE</p></div>}
                <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-md p-3 rounded-xl text-center text-white font-semibold text-lg tracking-widest transition-opacity opacity-0 group-hover:opacity-100">
                    {message}
                </div>
            </div>
            <div className="flex gap-4 max-w-4xl mx-auto">
                <button onClick={startCamera} disabled={loadingStatus !== 'loaded'} className="w-full flex items-center justify-center gap-3 h-14 px-4 rounded-xl bg-green-600 text-white font-bold text-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors">
                    <FaCamera />
                    <span>{loadingStatus === 'loaded' ? 'START SCANNER' : loadingStatus === 'loading' ? 'LOADING...' : 'ERROR'}</span>
                </button>
                <button onClick={stopAllCameras} className="w-full flex items-center justify-center gap-3 h-14 px-4 rounded-xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 transition-colors">
                    <FaStopCircle />
                    <span>STOP SCANNER</span>
                </button>
            </div>
        </div>
    );
};
