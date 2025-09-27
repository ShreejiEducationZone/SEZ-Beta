
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getCollection, setDocument, deleteDocument, runBatch, getDocument } from './firebase';
import { Student, SubjectData, ChapterProgress, WorkItem, Doubt, Test, FaceDescriptorData, AttendanceRecord, MistakeTypeDefinition, AreaDefinition } from './types';
import StudentCard from './components/StudentCard';
import StudentDrawer from './components/StudentDrawer';
import StudentForm from './components/StudentForm';
import FilterBar from './components/FilterBar';
import SubjectManagerPage from './components/SubjectManagerPage';
import SyllabusProgressPage from './components/SyllabusProgressPage';
import WorkPoolPage from './components/WorkPoolPage';
import DoubtBoxPage from './components/DoubtBoxPage';
import ReportsPage from './components/ReportsPage';
import AttendancePage from './components/AttendancePage';
import SettingsPage from './components/SettingsPage';
import Sidebar from './components/layout/Sidebar';
import { updateDoubtStatusFromWorkItems } from './utils/workPoolService';
import { MISTAKE_TYPES } from './constants';
import { Toast, ToastContainer } from './components/Toast';
import AiAssistantPage from './components/AiAssistantPage';
import { FaBars } from 'react-icons/fa';
import SkeletonCard from './components/loading/SkeletonCard';
import SkeletonFilterBar from './components/loading/SkeletonFilterBar';

type Page = 'students' | 'subjects' | 'syllabus' | 'work-pool' | 'doubts' | 'reports' | 'attendance' | 'settings' | 'ai-assistant';

const App: React.FC = () => {
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
    const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
    const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
    const [showArchived, setShowArchived] = useState<boolean>(false);
    const [filters, setFilters] = useState({ board: '', grade: '', batch: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState<Page>('students');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toggleSidebar = () => setIsSidebarExpanded(prev => !prev);
    
    const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        const newToast: Toast = {
            id: Date.now(),
            message,
            type,
        };
        setToasts(prev => [...prev, newToast]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Fetch all data from Firestore REST API on initial load
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const [
                    studentsData,
                    subjectsData,
                    chaptersData,
                    workData,
                    doubtsData,
                    testsData,
                    mistakeTypesDoc,
                    subjectAreasDoc,
                    descriptorsData,
                    attendanceData,
                ] = await Promise.all([
                    getCollection("students"),
                    getCollection("studentSubjects"),
                    getCollection("chapterProgress"),
                    getCollection("workItems"),
                    getCollection("doubts"),
                    getCollection("tests"),
                    getDocument("configuration", "mistakeTypes"),
                    getDocument("configuration", "subjectAreas"),
                    getCollection("faceDescriptors"),
                    getCollection("attendance"),
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
                    // Data migration: handle old string-based types and new object-based types to prevent crashes
                    const migratedTypes = fetchedTypes.map((type: any) => {
                        if (typeof type === 'string') {
                            // If it's an old string type, convert it to the new object format
                            return { title: type, description: 'Custom mistake type (migrated).' };
                        }
                        // If it's an object, ensure it has the required properties
                        if (typeof type === 'object' && type !== null && typeof type.title === 'string') {
                            return { title: type.title, description: type.description || '' };
                        }
                        return null; // Ignore malformed/invalid entries
                    }).filter((type: MistakeTypeDefinition | null): type is MistakeTypeDefinition => type !== null);

                    setCustomMistakeTypes(migratedTypes);
                } else {
                    setCustomMistakeTypes([]);
                }
                
                if (subjectAreasDoc && (subjectAreasDoc as any).areasBySubject) {
                    const areasBySubject = (subjectAreasDoc as any).areasBySubject;
                    const migratedAreas: { [key: string]: AreaDefinition[] } = {};
            
                    for (const subject in areasBySubject) {
                        if (Array.isArray(areasBySubject[subject])) {
                            migratedAreas[subject] = areasBySubject[subject].map((area: any) => {
                                if (typeof area === 'string') {
                                    return { title: area, description: '' }; // Migrate old string to new object
                                }
                                if (typeof area === 'object' && area !== null && typeof area.title === 'string') {
                                    return { title: area.title, description: area.description || '' };
                                }
                                return null;
                            }).filter((area: AreaDefinition | null): area is AreaDefinition => area !== null);
                        }
                    }
                    setSubjectAreas(migratedAreas);
                } else {
                    setSubjectAreas({});
                }


            } catch (error) {
                console.error("Failed to fetch initial data from Firestore:", error);
                showToast("Could not load data. Please check your connection.", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, [showToast]);

    // Effect to create default 'Absent' records for today
    useEffect(() => {
        const createDefaultAttendanceRecords = async () => {
            if (students.length === 0) return;

            const todayStr = new Date().toISOString().split('T')[0];
            const activeStudents = students.filter(s => !s.isArchived);
            const recordsForToday = new Set(
                attendanceRecords
                    .filter(r => r.date === todayStr)
                    .map(r => r.studentId)
            );

            const studentsWithoutRecords = activeStudents.filter(s => !recordsForToday.has(s.id));

            if (studentsWithoutRecords.length > 0) {
                const writes: { type: 'set', path: string, data: AttendanceRecord }[] = studentsWithoutRecords.map(student => {
                    const recordId = `${student.id}_${todayStr}`;
                    const newRecord: AttendanceRecord = {
                        id: recordId,
                        studentId: student.id,
                        date: todayStr,
                        status: 'Absent',
                    };
                    return { type: 'set', path: `attendance/${recordId}`, data: newRecord };
                });

                try {
                    await runBatch(writes);
                    const newRecords = writes.map(w => w.data);
                    setAttendanceRecords(prev => [...prev, ...newRecords]);
                } catch (error) {
                    console.error("Failed to create default attendance records:", error);
                    showToast("Error setting up today's attendance.", 'error');
                }
            }
        };

        createDefaultAttendanceRecords();
    }, [students, attendanceRecords, showToast]);


    // Effect to auto-update doubt status if a linked task is completed
    useEffect(() => {
        const updateDoubtsInFirestore = async (doubtsToUpdate: Doubt[]) => {
            if (doubtsToUpdate.length === 0) return;
            try {
                const writes = doubtsToUpdate.map(doubt => {
                    const cleanDoubt: Doubt = {
                        id: doubt.id, studentId: doubt.studentId, subject: doubt.subject,
                        chapterNo: doubt.chapterNo, chapterName: doubt.chapterName, testId: doubt.testId,
                        text: doubt.text, priority: doubt.priority, origin: doubt.origin,
                        createdAt: doubt.createdAt, status: doubt.status, resolvedAt: doubt.resolvedAt,
                        attachment: doubt.attachment, voiceNote: doubt.voiceNote
                    };
                    return { type: 'set' as const, path: `doubts/${doubt.id}`, data: cleanDoubt };
                });
                await runBatch(writes);
            } catch (error) {
                console.error("Failed to auto-update doubt status in Firestore:", error);
            }
        };

        if (doubts.length > 0 && workItems.length > 0) {
            const changedDoubts: Doubt[] = [];
            let stateNeedsUpdate = false;

            const newLocalDoubts = doubts.map(doubt => {
                const updatedDoubt = updateDoubtStatusFromWorkItems(doubt, workItems);
                if (updatedDoubt.status !== doubt.status) {
                    changedDoubts.push(updatedDoubt);
                    stateNeedsUpdate = true;
                }
                return updatedDoubt;
            });

            if (changedDoubts.length > 0) {
                updateDoubtsInFirestore(changedDoubts);
                if (stateNeedsUpdate) {
                    setDoubts(newLocalDoubts);
                }
            }
        }
    }, [workItems, doubts]);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);


    const handleSaveStudent = useCallback(async (studentData: Student): Promise<void> => {
        const isNewStudent = !students.some(s => s.id === studentData.id);
        try {
            await setDocument("students", studentData.id, studentData);
            setEditingStudent(null);
            
            setStudents(prev => {
                const exists = prev.some(s => s.id === studentData.id);
                if (exists) return prev.map(s => s.id === studentData.id ? studentData : s);
                return [...prev, studentData];
            });
            
            if (!isNewStudent) {
                setViewingStudent(studentData);
            }
            showToast(`Student "${studentData.name}" saved successfully!`, 'success');
        } catch (error: any) {
            console.error("Error saving student:", error);
            showToast(`Failed to save student: ${error.message}`, 'error');
            throw error; // Re-throw to allow form to handle UI state
        }
    }, [students, showToast]);
    
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
            const oldEntries = oldProgress?.entries ?? [];
            const oldEntryIds = new Set(oldEntries.map(e => e.id));
            const newEntries = progress.entries;
            const newEntryIds = new Set(newEntries.map(e => e.id));
        
            const addedEntries = newEntries.filter(e => !oldEntryIds.has(e.id));
            const newStartEntry = addedEntries.find(e => e.type === 'start');
        
            if (newStartEntry) {
                const dueDate = new Date(newStartEntry.date);
                dueDate.setDate(dueDate.getDate() + 7);
                const newWorkItem: WorkItem = {
                    id: `w_${Date.now()}`, studentId: progress.studentId, title: `Start reading & note making for ${progress.chapterName}`,
                    subject: progress.subject, chapterNo: progress.chapterNo, chapterName: progress.chapterName, topic: '',
                    description: 'Begin reading and making notes as the chapter has started in school.',
                    dueDate: dueDate.toISOString().split('T')[0], status: 'Assign', priority: 'Low', links: [], files: [],
                    mentorNote: '', dateCreated: new Date().toISOString().split('T')[0], source: 'syllabus',
                };
                writes.push({ type: 'set', path: `workItems/${newWorkItem.id}`, data: newWorkItem });
                setWorkItems(prev => [...prev, newWorkItem]);
            }
        
            const removedEntries = oldEntries.filter(e => !newEntryIds.has(e.id));
            const removedStartEntry = removedEntries.find(e => e.type === 'start');
            
            if (removedStartEntry) {
                const workItemToDelete = workItems.find(item =>
                    item.source === "syllabus" &&
                    item.studentId === progress.studentId &&
                    item.subject === progress.subject &&
                    String(item.chapterNo) === String(progress.chapterNo) &&
                    item.title === `Start reading & note making for ${progress.chapterName}`
                );
                if (workItemToDelete) {
                    writes.push({ type: 'delete', path: `workItems/${workItemToDelete.id}` });
                    setWorkItems(prev => prev.filter(w => w.id !== workItemToDelete.id));
                }
            }

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
    }, [chapterProgress, workItems, showToast]);

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
            if (linkedWorkItem) {
                writes.push({ type: 'delete', path: `workItems/${linkedWorkItem.id}` });
            }
            writes.push({ type: 'delete', path: `doubts/${doubtId}` });
            await runBatch(writes);
            
            setDoubts(prev => prev.filter(d => d.id !== doubtId));
            if(linkedWorkItem) setWorkItems(prev => prev.filter(w => w.id !== linkedWorkItem.id));
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
            const uniqueTypes = types.filter((type, index, self) => 
                index === self.findIndex((t) => t.title.trim().toLowerCase() === type.title.trim().toLowerCase())
            );
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

    const handleArchive = useCallback(async (id: string) => {
        try {
            const student = students.find(s => s.id === id);
            if (student) {
                const updatedStudent = { ...student, isArchived: !student.isArchived };
                await setDocument("students", id, updatedStudent);
                setStudents(prev => prev.map(s => s.id === id ? updatedStudent : s));
                showToast(`Student "${student.name}" has been ${updatedStudent.isArchived ? 'archived' : 'unarchived'}.`, 'success');
            }
            setViewingStudent(null);
        } catch (error: any) {
            console.error("Error archiving student:", error);
            showToast(`Failed to update student status: ${error.message}`, 'error');
        }
    }, [students, showToast]);

    const handleDelete = useCallback(async (id: string) => {
        const studentName = students.find(s => s.id === id)?.name || 'the student';
        if (!window.confirm(`Are you sure you want to permanently delete ${studentName}? This action cannot be undone.`)) {
            return;
        }
        try {
            await deleteDocument("students", id);
            setStudents(prev => prev.filter(s => s.id !== id));
            setViewingStudent(null);
            showToast(`Successfully deleted ${studentName}.`, 'success');
        } catch (error: any) {
            console.error("Error deleting student:", error);
            showToast(`Failed to delete student: ${error.message}`, 'error');
        }
    }, [students, showToast]);

    const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({ board: '', grade: '', batch: '' });
        setSearchQuery('');
    }, []);

    const handleCardClick = (student: Student) => {
        setViewingStudent(student);
    };

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            if (student.isArchived !== showArchived) return false;
            if (filters.board && student.board !== filters.board) return false;
            if (filters.grade && student.grade.toString() !== filters.grade) return false;
            if (filters.batch && student.batch !== filters.batch) return false;
            if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [students, showArchived, filters, searchQuery]);
    
    const allMistakeTypes = useMemo(() => {
        const combined = new Map<string, MistakeTypeDefinition>();
        // Add defaults first
        MISTAKE_TYPES.forEach(type => combined.set(type.title.toLowerCase(), type));
        // Override with custom types if titles match
        customMistakeTypes.forEach(type => combined.set(type.title.toLowerCase(), type));
        return Array.from(combined.values());
    }, [customMistakeTypes]);

    const todaysAttendanceMap = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const map = new Map<string, 'Present' | 'Absent'>();
        attendanceRecords.forEach(record => {
            if (record.date === todayStr) {
                map.set(record.studentId, record.status);
            }
        });
        return map;
    }, [attendanceRecords]);


    const handleNavigate = (page: Page) => {
        setCurrentPage(page);
        // On smaller screens, close the sidebar after navigating to a new page.
        if (window.innerWidth < 768) {
            setIsSidebarExpanded(false);
        }
    };

    const LoadingSkeleton = () => (
        <>
            <SkeletonFilterBar />
            <div className="flex items-center mb-4 mt-6">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="ml-2 h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {Array.from({ length: 12 }).map((_, index) => (
                    <SkeletonCard key={index} />
                ))}
            </div>
        </>
    );

    const renderPageContent = () => {
        switch (currentPage) {
            case 'subjects':
                return (
                    <SubjectManagerPage 
                        students={students}
                        allStudentSubjects={allStudentSubjects}
                        onSaveSubjects={handleSaveSubjects}
                    />
                );
            case 'syllabus':
                 return (
                    <SyllabusProgressPage 
                        students={students}
                        allStudentSubjects={allStudentSubjects}
                        chapterProgress={chapterProgress}
                        onSaveChapterProgress={handleSaveChapterProgress}
                    />
                );
            case 'work-pool':
                return (
                    <WorkPoolPage
                        students={students}
                        allStudentSubjects={allStudentSubjects}
                        workItems={workItems}
                        onSaveWorkItem={handleSaveWorkItem}
                        onDeleteWorkItem={handleDeleteWorkItem}
                    />
                );
            case 'doubts':
                return (
                    <DoubtBoxPage
                        students={students}
                        allStudentSubjects={allStudentSubjects}
                        workItems={workItems}
                        doubts={doubts}
                        onSaveDoubt={handleSaveDoubt}
                        onDeleteDoubt={handleDeleteDoubt}
                        onSaveWorkItem={handleSaveWorkItem}
                    />
                );
            case 'reports':
                return (
                    <ReportsPage
                        students={students}
                        allStudentSubjects={allStudentSubjects}
                        tests={tests}
                        onSaveTest={handleSaveTest}
                        onDeleteTest={handleDeleteTest}
                        allMistakeTypes={allMistakeTypes}
                        subjectAreas={subjectAreas}
                    />
                );
            case 'attendance':
                return <AttendancePage 
                            students={students} 
                            faceDescriptors={faceDescriptors} 
                            onSaveFaceDescriptor={handleSaveFaceDescriptor}
                            attendanceRecords={attendanceRecords}
                            onSaveAttendanceRecord={handleSaveAttendanceRecord}
                            showToast={showToast}
                        />;
             case 'settings':
                return (
                    <SettingsPage
                        darkMode={darkMode}
                        onToggleDarkMode={() => setDarkMode(prev => !prev)}
                        customMistakeTypes={customMistakeTypes}
                        onSaveMistakeTypes={handleSaveCustomMistakeTypes}
                        students={students.filter(s => !s.isArchived)}
                        onSaveStudent={handleSaveStudent}
                        subjectAreas={subjectAreas}
                        onSaveSubjectAreas={handleSaveSubjectAreas}
                        allStudentSubjects={allStudentSubjects}
                    />
                );
            case 'ai-assistant':
                return (
                    <AiAssistantPage
                        students={students}
                        allStudentSubjects={allStudentSubjects}
                        chapterProgress={chapterProgress}
                        workItems={workItems}
                        doubts={doubts}
                        tests={tests}
                        attendanceRecords={attendanceRecords}
                    />
                );
            case 'students':
            default:
                return (
                    <>
                        <FilterBar 
                            filters={filters} 
                            onFilterChange={handleFilterChange} 
                            onClearFilters={clearFilters}
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange} 
                        />
                        <div className="flex items-center mb-4 mt-6">
                            <input
                                type="checkbox"
                                id="showArchived"
                                checked={showArchived}
                                onChange={() => setShowArchived(!showArchived)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="showArchived" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                Show Archived Students
                            </label>
                        </div>
                        {filteredStudents.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {filteredStudents.map(student => {
                                    const attendanceStatus = todaysAttendanceMap.get(student.id) || 'Absent';
                                    return (
                                        <StudentCard
                                            key={student.id}
                                            student={student}
                                            onClick={handleCardClick}
                                            attendanceStatus={attendanceStatus}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                                <h3 className="text-xl font-semibold">No {showArchived ? 'archived' : 'active'} students found.</h3>
                                <p>Try adjusting your search or filters.</p>
                            </div>
                        )}
                    </>
                );
        }
    }

    const getPageTitle = () => {
        switch (currentPage) {
            case 'subjects': return 'Subject Manager';
            case 'syllabus': return 'Syllabus Progress';
            case 'work-pool': return 'Work Pool';
            case 'doubts': return 'Doubt Box';
            case 'reports': return 'Test Tracker';
            case 'attendance': return 'Attendance';
            case 'settings': return 'Settings';
            case 'ai-assistant': return 'AI Assistant';
            case 'students':
            default: return 'Student Directory';
        }
    }


    return (
        <div className="relative min-h-screen">
            <ToastContainer toasts={toasts} onClose={removeToast} />
             {/* Mobile-only overlay */}
            {isSidebarExpanded && (
                <div 
                    onClick={() => setIsSidebarExpanded(false)}
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    aria-hidden="true"
                />
            )}

            <Sidebar
                isExpanded={isSidebarExpanded}
                onToggle={toggleSidebar}
                currentPage={currentPage}
                onNavigate={handleNavigate}
            />
             <div 
                className={`flex-grow transition-all duration-300 ${isSidebarExpanded ? 'md:ml-[220px]' : 'md:ml-[60px]'}`}
            >
                <header className="flex justify-between items-center h-20 px-4 sm:px-8">
                     <div className="flex items-center gap-4">
                        <button
                            onClick={toggleSidebar}
                            className="p-2 rounded-full text-gray-600 dark:text-gray-300 md:hidden hover:bg-gray-200 dark:hover:bg-gray-700"
                            aria-label="Toggle Menu"
                        >
                            <FaBars className="h-5 w-5" />
                        </button>
                        <h1 className="text-2xl font-bold">
                            {getPageTitle()}
                        </h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        {currentPage === 'students' && (
                             <button
                                onClick={() => setEditingStudent({})}
                                className="bg-brand-blue text-white h-10 px-4 rounded-md hover:bg-blue-600 transition-colors text-sm font-semibold"
                            >
                                + Add Student
                            </button>
                        )}
                        <button 
                            onClick={() => setDarkMode(!darkMode)} 
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-lg"
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                    </div>
                </header>
                <main className="p-4 sm:p-8 pt-0">
                    {isLoading && currentPage === 'students' ? <LoadingSkeleton /> : renderPageContent()}
                </main>
            </div>


            {editingStudent && (
                <StudentForm 
                    student={editingStudent}
                    onSave={handleSaveStudent}
                    onCancel={() => setEditingStudent(null)}
                />
            )}

            {viewingStudent && (
                <StudentDrawer
                    student={viewingStudent}
                    onClose={() => setViewingStudent(null)}
                    onEdit={(student) => {
                        setViewingStudent(null);
                        setEditingStudent(student);
                    }}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
};

export default App;
