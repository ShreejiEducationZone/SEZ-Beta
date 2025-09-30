import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode, useMemo } from 'react';
import { getCollection, setDocument, deleteDocument, runBatch, getDocument } from '../firebase';
import { Student, SubjectData, ChapterProgress, WorkItem, Doubt, Test, FaceDescriptorData, AttendanceRecord, MistakeTypeDefinition, AreaDefinition } from '../types';
import { updateDoubtStatusFromWorkItems } from '../utils/workPoolService';
import { Toast } from '../components/Toast';
import { MISTAKE_TYPES, initialStudents } from '../constants';

// User type for authentication
export interface User {
    id: string;
    email: string;
    role: 'admin' | 'student';
    name: string;
    studentId?: string; // Link to student object if role is student
    avatarUrl?: string | null;
    // FIX: Add password property for authentication logic
    password?: string;
}

// Define context shape
interface DataContextType {
    students: Student[];
    allStudentSubjects: { [key: string]: { studentId: string; subjects: SubjectData[] } };
    chapterProgress: ChapterProgress[];
    workItems: WorkItem[];
    doubts: Doubt[];
    tests: Test[];
    customMistakeTypes: MistakeTypeDefinition[];
    subjectAreas: { [key: string]: AreaDefinition[] };
    faceDescriptors: FaceDescriptorData[];
    attendanceRecords: AttendanceRecord[];
    isLoading: boolean;
    darkMode: boolean;
    toasts: Toast[];
    currentUser: User | null;

    // Auth Handlers
    login: (identifier: string, pass: string) => Promise<void>;
    logout: () => void;
    
    // Data Handlers
    handleSaveStudent: (studentData: Student) => Promise<void>;
    handleSaveSubjects: (studentId: string, subjects: SubjectData[]) => Promise<void>;
    handleSaveChapterProgress: (progress: ChapterProgress) => Promise<void>;
    handleSaveWorkItem: (workItem: WorkItem) => Promise<void>;
    handleDeleteWorkItem: (workItemId: string) => Promise<void>;
    handleSaveDoubt: (doubt: Doubt) => Promise<void>;
    handleDeleteDoubt: (doubtId: string) => Promise<void>;
    handleSaveTest: (test: Test) => Promise<void>;
    handleDeleteTest: (testId: string) => Promise<void>;
    handleSaveFaceDescriptor: (descriptorData: FaceDescriptorData) => Promise<void>;
    handleSaveAttendanceRecord: (record: AttendanceRecord) => Promise<void>;
    handleSaveCustomMistakeTypes: (types: MistakeTypeDefinition[]) => Promise<void>;
    handleSaveSubjectAreas: (areas: { [key: string]: AreaDefinition[] }) => Promise<void>;
    handleArchiveStudent: (id: string) => Promise<void>;
    handleDeleteStudent: (id: string) => Promise<void>;
    
    setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
    showToast: (message: string, type?: Toast['type']) => void;
    removeToast: (id: number) => void;

    // derived state
    allMistakeTypes: MistakeTypeDefinition[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [allStudentSubjects, setAllStudentSubjects] = useState<{ [key: string]: { studentId: string; subjects: SubjectData[] } }>({});
    const [chapterProgress, setChapterProgress] = useState<ChapterProgress[]>([]);
    const [workItems, setWorkItems] = useState<WorkItem[]>([]);
    const [doubts, setDoubts] = useState<Doubt[]>([]);
    const [tests, setTests] = useState<Test[]>([]);
    const [customMistakeTypes, setCustomMistakeTypes] = useState<MistakeTypeDefinition[]>([]);
    const [subjectAreas, setSubjectAreas] = useState<{ [key: string]: AreaDefinition[] }>({});
    const [faceDescriptors, setFaceDescriptors] = useState<FaceDescriptorData[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    
    // Auth state
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const item = window.localStorage.getItem('sez-currentUser');
            return item ? JSON.parse(item) : null;
        } catch (error) {
            return null;
        }
    });

    const login = useCallback(async (identifier: string, pass: string) => {
        const adminUser: User & { password?: string } = {
            id: 'admin01',
            email: 'sez@admin.com',
            password: 'pass12345',
            role: 'admin',
            name: 'Administrator',
            avatarUrl: 'https://i.pravatar.cc/150?u=admin'
        };

        // 1. Check for Admin by email
        if (identifier.toLowerCase() === adminUser.email.toLowerCase()) {
            if (adminUser.password === pass) {
                const { password, ...userSessionData } = adminUser;
                setCurrentUser(userSessionData);
                window.localStorage.setItem('sez-currentUser', JSON.stringify(userSessionData));
                return; // Login successful
            } else {
                throw new Error('Invalid password for administrator.');
            }
        }

        // 2. Check for Student by name (case-insensitive)
        const studentToLogin = students.find(s => s.name.toLowerCase() === identifier.toLowerCase());

        if (studentToLogin) {
            if (studentToLogin.password === pass) {
                const userSessionData: User = {
                    id: `user-${studentToLogin.id}`,
                    email: studentToLogin.email || '',
                    role: 'student',
                    name: studentToLogin.name,
                    studentId: studentToLogin.id,
                    avatarUrl: studentToLogin.avatarUrl
                };
                setCurrentUser(userSessionData);
                window.localStorage.setItem('sez-currentUser', JSON.stringify(userSessionData));
                return; // Login successful
            } else {
                throw new Error('Invalid password for this student.');
            }
        }
        
        // 3. If no match found
        throw new Error('User not found. Please check the name or email.');

    }, [students]);
    
    const logout = useCallback(() => {
        setCurrentUser(null);
        window.localStorage.removeItem('sez-currentUser');
    }, []);

    const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        const newToast: Toast = { id: Date.now(), message, type };
        setToasts(prev => [...prev, newToast]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [
                    studentsData, subjectsData, chaptersData, workData, doubtsData, testsData,
                    mistakeTypesDoc, subjectAreasDoc, descriptorsData, attendanceData,
                ] = await Promise.all([
                    getCollection("students"), getCollection("studentSubjects"), getCollection("chapterProgress"),
                    getCollection("workItems"), getCollection("doubts"), getCollection("tests"),
                    getDocument("configuration", "mistakeTypes"), getDocument("configuration", "subjectAreas"),
                    getCollection("faceDescriptors"), getCollection("attendance"),
                ]);

                setStudents(studentsData as Student[]);
                const subjectsMap = (subjectsData as any[]).reduce((acc, doc) => {
                    acc[doc.id] = { studentId: doc.id, subjects: doc.subjects || [] };
                    return acc;
                }, {});
                setAllStudentSubjects(subjectsMap);
                setChapterProgress(chaptersData as ChapterProgress[]);
                setWorkItems(workData as WorkItem[]);
                setDoubts(doubtsData as Doubt[]);
                setTests(testsData as Test[]);
                setFaceDescriptors(descriptorsData as FaceDescriptorData[]);
                setAttendanceRecords(attendanceData as AttendanceRecord[]);
                if (mistakeTypesDoc && Array.isArray((mistakeTypesDoc as any).types)) {
                    const fetchedTypes = (mistakeTypesDoc as any).types;
                    const migratedTypes = fetchedTypes.map((type: any) => {
                        if (typeof type === 'string') return { title: type, description: 'Custom mistake type (migrated).' };
                        if (typeof type === 'object' && type !== null && typeof type.title === 'string') return { title: type.title, description: type.description || '' };
                        return null;
                    }).filter((type: MistakeTypeDefinition | null): type is MistakeTypeDefinition => type !== null);
                    setCustomMistakeTypes(migratedTypes);
                } else setCustomMistakeTypes([]);
                if (subjectAreasDoc && (subjectAreasDoc as any).areasBySubject) {
                    const areasBySubject = (subjectAreasDoc as any).areasBySubject;
                    const migratedAreas: { [key: string]: AreaDefinition[] } = {};
                    for (const subject in areasBySubject) {
                        if (Array.isArray(areasBySubject[subject])) {
                            migratedAreas[subject] = areasBySubject[subject].map((area: any) => {
                                if (typeof area === 'string') return { title: area, description: '' };
                                if (typeof area === 'object' && area !== null && typeof area.title === 'string') return { title: area.title, description: area.description || '' };
                                return null;
                            }).filter((area: AreaDefinition | null): area is AreaDefinition => area !== null);
                        }
                    }
                    setSubjectAreas(migratedAreas);
                } else setSubjectAreas({});
            } catch (error) {
                console.error("Failed to fetch initial data from Firestore:", error);
                showToast("Could not load data. Please check your connection.", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, [showToast]);

    useEffect(() => {
        const createDefaultAttendanceRecords = async () => {
            if (students.length === 0) return;
            const todayStr = new Date().toISOString().split('T')[0];
            const activeStudents = students.filter(s => !s.isArchived);
            const recordsForToday = new Set(attendanceRecords.filter(r => r.date === todayStr).map(r => r.studentId));
            const studentsWithoutRecords = activeStudents.filter(s => !recordsForToday.has(s.id));

            if (studentsWithoutRecords.length > 0) {
                const writes = studentsWithoutRecords.map(student => {
                    const recordId = `${student.id}_${todayStr}`;
                    const newRecord: AttendanceRecord = { id: recordId, studentId: student.id, date: todayStr, status: 'Absent' };
                    return { type: 'set' as const, path: `attendance/${recordId}`, data: newRecord };
                });
                try {
                    await runBatch(writes);
                    setAttendanceRecords(prev => [...prev, ...writes.map(w => w.data)]);
                } catch (error) {
                    console.error("Failed to create default attendance records:", error);
                    showToast("Error setting up today's attendance.", 'error');
                }
            }
        };
        createDefaultAttendanceRecords();
    }, [students, attendanceRecords, showToast]);

    useEffect(() => {
        const updateDoubtsInFirestore = async (doubtsToUpdate: Doubt[]) => {
            if (doubtsToUpdate.length === 0) return;
            try {
                const writes = doubtsToUpdate.map(doubt => ({ type: 'set' as const, path: `doubts/${doubt.id}`, data: doubt }));
                await runBatch(writes);
            } catch (error) {
                console.error("Failed to auto-update doubt status in Firestore:", error);
            }
        };
        if (doubts.length > 0 && workItems.length > 0) {
            const changedDoubts: Doubt[] = [];
            const newLocalDoubts = doubts.map(doubt => {
                const updatedDoubt = updateDoubtStatusFromWorkItems(doubt, workItems);
                if (updatedDoubt.status !== doubt.status) changedDoubts.push(updatedDoubt);
                return updatedDoubt;
            });
            if (changedDoubts.length > 0) {
                updateDoubtsInFirestore(changedDoubts);
                setDoubts(newLocalDoubts);
            }
        }
    }, [workItems, doubts]);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    const handleSaveStudent = useCallback(async (studentData: Student): Promise<void> => {
        try {
            await setDocument("students", studentData.id, studentData);
            setStudents(prev => {
                const exists = prev.some(s => s.id === studentData.id);
                if (exists) return prev.map(s => s.id === studentData.id ? studentData : s);
                return [...prev, studentData];
            });
            showToast(`Student "${studentData.name}" saved successfully!`, 'success');
        } catch (error: any) {
            console.error("Error saving student:", error);
            showToast(`Failed to save student: ${error.message}`, 'error');
            throw error;
        }
    }, [showToast]);
    
    const handleSaveSubjects = useCallback(async (studentId: string, subjects: SubjectData[]) => {
        try {
            await setDocument("studentSubjects", studentId, { studentId, subjects });
            setAllStudentSubjects(prev => ({ ...prev, [studentId]: { studentId, subjects } }));
            showToast('Subjects saved successfully!', 'success');
        } catch (error: any) {
            console.error("Error saving subjects:", error);
            showToast(`Failed to save subjects: ${error.message}`, 'error');
        }
    }, [showToast]);

    const handleSaveChapterProgress = useCallback(async (progress: ChapterProgress) => {
        try {
            const writes: { type: 'set' | 'delete', path: string, data?: any }[] = [];
            const oldProgress = chapterProgress.find(p => p.id === progress.id);
            if (progress.entries.length === 0) {
                writes.push({ type: 'delete', path: `chapterProgress/${progress.id}` });
                setChapterProgress(prev => prev.filter(p => p.id !== progress.id));
            } else {
                writes.push({ type: 'set', path: `chapterProgress/${progress.id}`, data: progress });
                setChapterProgress(prev => {
                    const exists = prev.some(p => p.id === progress.id);
                    if (exists) return prev.map(p => p.id === progress.id ? progress : p);
                    return [...prev, progress];
                });
            }
            if (writes.length > 0) await runBatch(writes);
            showToast('Syllabus progress saved!', 'success');
        } catch (error: any) {
            console.error("Error saving chapter progress:", error);
            showToast(`Failed to save progress: ${error.message}`, 'error');
        }
    }, [chapterProgress, showToast]);

    const handleSaveWorkItem = useCallback(async (workItem: WorkItem) => {
        try {
            await setDocument("workItems", workItem.id, workItem);
            setWorkItems(prev => {
                const exists = prev.some(w => w.id === workItem.id);
                if (exists) return prev.map(w => w.id === workItem.id ? workItem : w);
                return [...prev, workItem];
            });
            showToast('Work item saved successfully!', 'success');
        } catch (error: any) {
            console.error("Error saving work item:", error);
            showToast(`Failed to save work item: ${error.message}`, 'error');
        }
    }, [showToast]);

    const handleDeleteWorkItem = useCallback(async (workItemId: string) => {
        try {
            await deleteDocument("workItems", workItemId);
            setWorkItems(prev => prev.filter(w => w.id !== workItemId));
            showToast('Work item deleted.', 'success');
        } catch (error: any) {
            console.error("Error deleting work item:", error);
            showToast(`Failed to delete work item: ${error.message}`, 'error');
        }
    }, [showToast]);

    const handleSaveDoubt = useCallback(async (doubt: Doubt) => {
        try {
            await setDocument("doubts", doubt.id, doubt);
            setDoubts(prev => {
                const exists = prev.some(d => d.id === doubt.id);
                if (exists) return prev.map(d => d.id === doubt.id ? doubt : d);
                return [...prev, doubt];
            });
            showToast('Doubt saved successfully!', 'success');
        } catch (error: any) {
            console.error("Error saving doubt:", error);
            showToast(`Failed to save doubt: ${error.message}`, 'error');
        }
    }, [showToast]);

    const handleDeleteDoubt = useCallback(async (doubtId: string) => {
        try {
            const writes: { type: 'delete', path: string }[] = [];
            const linkedWorkItem = workItems.find(item => item.linkedDoubtId === doubtId && item.source === 'doubt');
            if (linkedWorkItem) writes.push({ type: 'delete', path: `workItems/${linkedWorkItem.id}` });
            writes.push({ type: 'delete', path: `doubts/${doubtId}` });
            await runBatch(writes);
            setDoubts(prev => prev.filter(d => d.id !== doubtId));
            if (linkedWorkItem) setWorkItems(prev => prev.filter(w => w.id !== linkedWorkItem.id));
            showToast('Doubt deleted successfully.', 'success');
        } catch (error: any) {
            console.error("Error deleting doubt:", error);
            showToast(`Failed to delete doubt: ${error.message}`, 'error');
        }
    }, [workItems, showToast]);

    const handleSaveTest = useCallback(async (test: Test) => {
        try {
            await setDocument("tests", test.id, test);
            setTests(prev => {
                const exists = prev.some(t => t.id === test.id);
                if (exists) return prev.map(t => t.id === test.id ? test : t);
                return [...prev, test];
            });
            showToast('Test record saved.', 'success');
        } catch (error: any) {
            console.error("Error saving test:", error);
            showToast(`Failed to save test: ${error.message}`, 'error');
        }
    }, [showToast]);

    const handleDeleteTest = useCallback(async (testId: string) => {
        try {
            await deleteDocument("tests", testId);
            setTests(prev => prev.filter(t => t.id !== testId));
            showToast('Test record deleted.', 'success');
        } catch (error: any) {
            console.error("Error deleting test:", error);
            showToast(`Failed to delete test: ${error.message}`, 'error');
        }
    }, [showToast]);

    const handleSaveFaceDescriptor = useCallback(async (descriptorData: FaceDescriptorData) => {
        try {
            await setDocument("faceDescriptors", descriptorData.id, descriptorData);
            setFaceDescriptors(prev => {
                const exists = prev.some(d => d.id === descriptorData.id);
                if (exists) return prev.map(d => d.id === descriptorData.id ? descriptorData : d);
                return [...prev, descriptorData];
            });
        } catch (error: any) {
            console.error("Error saving face descriptor:", error);
            showToast(`Failed to save registration: ${error.message}`, 'error');
            throw error;
        }
    }, [showToast]);

    const handleSaveAttendanceRecord = useCallback(async (record: AttendanceRecord) => {
        try {
            await setDocument("attendance", record.id, record);
            setAttendanceRecords(prev => {
                const exists = prev.some(r => r.id === record.id);
                if (exists) return prev.map(r => r.id === record.id ? record : r);
                return [...prev, record];
            });
        } catch (error: any) {
            console.error("Error saving attendance record:", error);
            showToast(`Failed to save attendance: ${error.message}`, 'error');
        }
    }, [showToast]);

    const handleSaveCustomMistakeTypes = useCallback(async (types: MistakeTypeDefinition[]) => {
        try {
            const uniqueTypes = types.filter((type, index, self) => index === self.findIndex((t) => t.title.trim().toLowerCase() === type.title.trim().toLowerCase()));
            await setDocument("configuration", "mistakeTypes", { types: uniqueTypes });
            setCustomMistakeTypes(uniqueTypes);
            showToast('Custom mistake types saved.', 'success');
        } catch (error: any) {
            console.error("Error saving custom mistake types:", error);
            showToast(`Failed to save mistake types: ${error.message}`, 'error');
        }
    }, [showToast]);
    
    const handleSaveSubjectAreas = useCallback(async (areas: { [key: string]: AreaDefinition[] }) => {
        try {
            await setDocument("configuration", "subjectAreas", { areasBySubject: areas });
            setSubjectAreas(areas);
            showToast('Subject areas saved.', 'success');
        } catch (error: any) {
            console.error("Error saving subject areas:", error);
            showToast(`Failed to save subject areas: ${error.message}`, 'error');
        }
    }, [showToast]);
    
    const handleArchiveStudent = useCallback(async (id: string) => {
        try {
            const student = students.find(s => s.id === id);
            if (student) {
                const updatedStudent = { ...student, isArchived: !student.isArchived };
                await setDocument("students", id, updatedStudent);
                setStudents(prev => prev.map(s => s.id === id ? updatedStudent : s));
                showToast(`Student "${student.name}" has been ${updatedStudent.isArchived ? 'archived' : 'unarchived'}.`, 'success');
            }
        } catch (error: any) {
            console.error("Error archiving student:", error);
            showToast(`Failed to update student status: ${error.message}`, 'error');
        }
    }, [students, showToast]);

    const handleDeleteStudent = useCallback(async (id: string) => {
        try {
            await deleteDocument("students", id);
            setStudents(prev => prev.filter(s => s.id !== id));
            showToast(`Successfully deleted student.`, 'success');
        } catch (error: any) {
            console.error("Error deleting student:", error);
            showToast(`Failed to delete student: ${error.message}`, 'error');
        }
    }, [showToast]);

    const allMistakeTypes = useMemo(() => {
        const combined = new Map<string, MistakeTypeDefinition>();
        MISTAKE_TYPES.forEach(type => combined.set(type.title.toLowerCase(), type));
        customMistakeTypes.forEach(type => combined.set(type.title.toLowerCase(), type));
        return Array.from(combined.values());
    }, [customMistakeTypes]);

    const value = {
        students, allStudentSubjects, chapterProgress, workItems, doubts, tests, customMistakeTypes,
        subjectAreas, faceDescriptors, attendanceRecords, isLoading, darkMode, toasts, allMistakeTypes,
        currentUser, login, logout,
        handleSaveStudent, handleSaveSubjects, handleSaveChapterProgress, handleSaveWorkItem,
        handleDeleteWorkItem, handleSaveDoubt, handleDeleteDoubt, handleSaveTest, handleDeleteTest,
        handleSaveFaceDescriptor, handleSaveAttendanceRecord, handleSaveCustomMistakeTypes,
        handleSaveSubjectAreas, handleArchiveStudent, handleDeleteStudent,
        setDarkMode, showToast, removeToast
    };

    return <DataContext.Provider value={value as DataContextType}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};