import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Student, StudentAttendance } from '../types';
import AttendanceStudentCard from './AttendanceStudentCard';
import AttendanceCalendarModal from './AttendanceCalendarModal';

declare var faceapi: any;

interface AttendancePageProps {
    students: Student[];
}

const AttendancePage: React.FC<AttendancePageProps> = ({ students }) => {
    const [studentAttendances, setStudentAttendances] = useState<StudentAttendance[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [detectionMessage, setDetectionMessage] = useState<string>('Initializing...');
    const [cameraSource, setCameraSource] = useState<'laptop' | 'ip'>('laptop');
    const [ipCameraUrl, setIpCameraUrl] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const recognitionIntervalRef = useRef<number | null>(null);

    // Initialize student attendance data
    useEffect(() => {
        const initialAttendances = students.map(student => ({
            studentId: student.id,
            status: 'Absent' as const,
            lastSeen: null,
            attendanceLog: {}, // Dummy log
        }));
        setStudentAttendances(initialAttendances);
    }, [students]);

    // Load face-api models
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
            } catch (error) {
                console.error('Failed to load models:', error);
                setDetectionMessage('Error loading models. Check console for details.');
            }
        };
        loadModels();
    }, []);

    // Start/stop camera stream based on source
    useEffect(() => {
        if (!modelsLoaded) return;

        const startCamera = async () => {
            try {
                if (cameraSource === 'laptop') {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } else if (cameraSource === 'ip' && ipCameraUrl) {
                    if (videoRef.current) {
                        videoRef.current.srcObject = null;
                        videoRef.current.src = ipCameraUrl;
                    }
                }
                setCameraError(null);
            } catch (err) {
                console.error('Camera access error:', err);
                setCameraError('Could not access the camera. Please check permissions and connection.');
                setDetectionMessage('Camera not available.');
            }
        };

        const stopCamera = () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        };

        stopCamera();
        startCamera();

        return () => {
            stopCamera();
        };
    }, [modelsLoaded, cameraSource, ipCameraUrl]);

    const handleVideoPlay = () => {
        if (recognitionIntervalRef.current) {
            clearInterval(recognitionIntervalRef.current);
        }

        recognitionIntervalRef.current = window.setInterval(async () => {
            if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) {
                return;
            }

            const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
            faceapi.matchDimensions(canvasRef.current, displaySize);

            const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
            
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            if(canvasRef.current){
                const context = canvasRef.current.getContext('2d');
                if(context){
                    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
                }
            }
            
            if (detections.length > 0) {
                setDetectionMessage(`${detections.length} face(s) detected.`);
                // Dummy recognition logic
                setStudentAttendances(prevAttendances => {
                    const absentStudents = prevAttendances.filter(s => s.status === 'Absent');
                    if (absentStudents.length > 0) {
                        const randomStudentIndex = Math.floor(Math.random() * absentStudents.length);
                        const studentToMark = absentStudents[randomStudentIndex];
                        
                        return prevAttendances.map(att => 
                            att.studentId === studentToMark.studentId
                                ? { ...att, status: 'Present' as const, lastSeen: new Date().toISOString() }
                                : att
                        );
                    }
                    return prevAttendances;
                });
            } else {
                setDetectionMessage('No faces detected. Looking for students...');
            }

        }, 200);
    };

    useEffect(() => {
        return () => {
            if (recognitionIntervalRef.current) {
                clearInterval(recognitionIntervalRef.current);
            }
        };
    }, []);

    const activeStudents = useMemo(() => students.filter(s => !s.isArchived), [students]);
    
    const handleCardClick = useCallback((student: Student) => {
        setSelectedStudent(student);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedStudent(null);
    }, []);

    const attendanceMap = useMemo(() => {
        return new Map(studentAttendances.map(att => [att.studentId, att]));
    }, [studentAttendances]);

    return (
        <div className="space-y-8">
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-sm">
                <h3 className="text-xl font-bold mb-4">Live Attendance Feed</h3>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex items-center gap-4">
                        <label className="font-semibold">Source:</label>
                        <select
                            value={cameraSource}
                            onChange={(e) => setCameraSource(e.target.value as 'laptop' | 'ip')}
                            className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-brand-blue"
                        >
                            <option value="laptop">Laptop/Webcam</option>
                            <option value="ip">IP/HTTP Camera</option>
                        </select>
                    </div>
                    {cameraSource === 'ip' && (
                        <input
                            type="text"
                            value={ipCameraUrl}
                            onChange={(e) => setIpCameraUrl(e.target.value)}
                            placeholder="Enter IP Camera Stream URL (e.g., http://.../video)"
                            className="flex-grow h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-brand-blue"
                        />
                    )}
                </div>

                <div className="relative aspect-video max-w-2xl mx-auto bg-gray-900 rounded-lg overflow-hidden">
                    <video ref={videoRef} autoPlay muted playsInline onPlay={handleVideoPlay} className="w-full h-full object-cover" crossOrigin="anonymous" />
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-center text-sm font-semibold">
                        {modelsLoaded ? detectionMessage : 'Loading recognition models...'}
                    </div>
                     {cameraError && <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-red-400 p-4">{cameraError}</div>}
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold mb-4">Student Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {activeStudents.map(student => (
                        <AttendanceStudentCard 
                            key={student.id}
                            student={student}
                            attendance={attendanceMap.get(student.id)}
                            onClick={handleCardClick}
                        />
                    ))}
                </div>
            </div>

            {selectedStudent && (
                <AttendanceCalendarModal
                    student={selectedStudent}
                    attendanceLog={attendanceMap.get(selectedStudent.id)?.attendanceLog || {}}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default AttendancePage;
