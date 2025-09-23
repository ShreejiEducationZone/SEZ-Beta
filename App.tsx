import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getCollection, setDocument, deleteDocument, runBatch, getDocument } from './firebase';
import { Student, SubjectData, ChapterProgress, WorkItem, Doubt, Test, FaceDescriptorData, AttendanceRecord } from './types';
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
import Sidebar from './components/layout/Sidebar';
import { updateDoubtStatusFromWorkItems } from './utils/workPoolService';
import { MISTAKE_TYPES } from './constants';

type Page = 'students' | 'subjects' | 'syllabus' | 'work-pool' | 'doubts' | 'reports' | 'attendance';

const App: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [allStudentSubjects, setAllStudentSubjects] = useState<{ [key: string]: { studentId: string; subjects: SubjectData[] } }>({});
    const [chapterProgress, setChapterProgress] = useState<ChapterProgress[]>([]);
    const [workItems, setWorkItems] = useState<WorkItem[]>([]);
    const [doubts, setDoubts] = useState<Doubt[]>([]);
    const [tests, setTests] = useState<Test[]>([]);
    const [customMistakeTypes, setCustomMistakeTypes] = useState<string[]>([]);
    const [faceDescriptors, setFaceDescriptors] = useState<FaceDescriptorData[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);


    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
    const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
    const [showArchived, setShowArchived] = useState<boolean>(false);
    const [filters, setFilters] = useState({ board: '', grade: '', batch: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState<Page>('students');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    const toggleSidebar = () => setIsSidebarExpanded(prev => !prev);

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
                if (mistakeTypesDoc && (mistakeTypesDoc as any).types) {
                    setCustomMistakeTypes((mistakeTypesDoc as any).types);
                }

            } catch (error) {
                console.error("Failed to fetch initial data from Firestore:", error);
                alert("Could not load data. Please check your internet connection and refresh the page.");
            }
        };
        fetchAllData();
    }, []);

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


    const handleSaveStudent = useCallback(async (studentData: Student) => {
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
        } catch (error: any) {
            console.error("Error saving student:", error);
            alert(`Failed to save student data. Please check your internet connection. Error: ${error.message}`);
        }
    }, [students]);
    
    const handleSaveSubjects = useCallback(async (studentId: string, subjects: SubjectData[]) => {
        try {
            await setDocument("studentSubjects", studentId, { studentId, subjects });
            setAllStudentSubjects(prev => ({ ...prev, [studentId]: { studentId, subjects } }));
        } catch (error: any) {
            console.error("Error saving subjects:", error);
            alert(`Failed to save subjects. Please check your internet connection. Error: ${error.message}`);
        }
    }, []);

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
        } catch (error: any) {
            console.error("Error saving chapter progress:", error);
            alert(`Failed to save chapter progress. Please check your internet connection. Error: ${error.message}`);
        }
    }, [chapterProgress, workItems]);

    const handleSaveWorkItem = useCallback(async (workItem: WorkItem) => {
        try {
            await setDocument("workItems", workItem.id, workItem);
            setWorkItems(prev => {
                const exists = prev.some(w => w.id === workItem.id);
                if (exists) return prev.map(w => w.id === workItem.id ? workItem : w);
                return [...prev, workItem];
            });
        } catch (error: any) {
            console.error("Error saving work item:", error);
            alert(`Failed to save work item. Please check your internet connection. Error: ${error.message}`);
        }
    }, []);

    const handleDeleteWorkItem = useCallback(async (workItemId: string) => {
        try {
            await deleteDocument("workItems", workItemId);
            setWorkItems(prev => prev.filter(w => w.id !== workItemId));
        } catch (error: any) {
            console.error("Error deleting work item:", error);
            alert(`Failed to delete work item. Please check your internet connection. Error: ${error.message}`);
        }
    }, []);

    const handleSaveDoubt = useCallback(async (doubt: Doubt) => {
        try {
            await setDocument("doubts", doubt.id, doubt);
            setDoubts(prev => {
                const exists = prev.some(d => d.id === doubt.id);
                if (exists) return prev.map(d => d.id === doubt.id ? doubt : d);
                return [...prev, doubt];
            });
        } catch (error: any) {
            console.error("Error saving doubt:", error);
            alert(`Failed to save doubt. Please check your internet connection. Error: ${error.message}`);
        }
    }, []);

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

        } catch (error: any) {
            console.error("Error deleting doubt:", error);
            alert(`Failed to delete doubt. Please check your internet connection. Error: ${error.message}`);
        }
    }, [workItems]);

    const handleSaveTest = useCallback(async (test: Test) => {
        try {
            // New logic for custom mistake types
            if (test.mistakeTypes && test.mistakeTypes.length > 0) {
                const allKnownMistakeTypes = new Set([...MISTAKE_TYPES, ...customMistakeTypes]);
                const newMistakes = test.mistakeTypes.filter(m => !allKnownMistakeTypes.has(m));
                
                if (newMistakes.length > 0) {
                    const updatedCustomTypes = [...customMistakeTypes, ...newMistakes];
                    setCustomMistakeTypes(updatedCustomTypes);
                    await setDocument("configuration", "mistakeTypes", { types: updatedCustomTypes });
                }
            }

            await setDocument("tests", test.id, test);
            setTests(prev => {
                const exists = prev.some(t => t.id === test.id);
                if (exists) return prev.map(t => t.id === test.id ? test : t);
                return [...prev, test];
            });
        } catch (error: any) {
            console.error("Error saving test:", error);
            alert(`Failed to save test. Please check your internet connection. Error: ${error.message}`);
        }
    }, [customMistakeTypes]);

    const handleDeleteTest = useCallback(async (testId: string) => {
        try {
            await deleteDocument("tests", testId);
            setTests(prev => prev.filter(t => t.id !== testId));
        } catch (error: any) {
            console.error("Error deleting test:", error);
            alert(`Failed to delete test. Please check your internet connection. Error: ${error.message}`);
        }
    }, []);

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
            alert(`Failed to save face registration data. Please check your internet connection. Error: ${error.message}`);
        }
    }, []);

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
            alert(`Failed to save attendance. Please check your internet connection. Error: ${error.message}`);
        }
    }, []);

    const handleArchive = useCallback(async (id: string) => {
        try {
            const student = students.find(s => s.id === id);
            if (student) {
                const updatedStudent = { ...student, isArchived: !student.isArchived };
                await setDocument("students", id, updatedStudent);
                setStudents(prev => prev.map(s => s.id === id ? updatedStudent : s));
            }
            setViewingStudent(null);
        } catch (error: any) {
            console.error("Error archiving student:", error);
            alert(`Failed to archive student. Please check your internet connection. Error: ${error.message}`);
        }
    }, [students]);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteDocument("students", id);
            setStudents(prev => prev.filter(s => s.id !== id));
            setViewingStudent(null);
        } catch (error: any) {
            console.error("Error deleting student:", error);
            alert(`Failed to delete student. Please check your internet connection. Error: ${error.message}`);
        }
    }, []);

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
        // Use a Set to handle potential duplicates, then convert back to array
        const combined = new Set([...MISTAKE_TYPES, ...customMistakeTypes]);
        return Array.from(combined);
    }, [customMistakeTypes]);


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
                    />
                );
            case 'attendance':
                return <AttendancePage 
                            students={students} 
                            faceDescriptors={faceDescriptors} 
                            onSaveFaceDescriptor={handleSaveFaceDescriptor}
                            attendanceRecords={attendanceRecords}
                            onSaveAttendanceRecord={handleSaveAttendanceRecord}
                        />;
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredStudents.map(student => (
                                    <StudentCard key={student.id} student={student} onClick={handleCardClick} />
                                ))}
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
            case 'students':
            default: return 'Student Directory';
        }
    }


    return (
        <div className="relative min-h-screen">
            <Sidebar
                isExpanded={isSidebarExpanded}
                onToggle={toggleSidebar}
                currentPage={currentPage}
                onNavigate={setCurrentPage}
            />
             <div 
                className="flex-grow transition-all duration-300"
                style={{ marginLeft: isSidebarExpanded ? '220px' : '60px' }}
            >
                <header className="flex justify-between items-center h-20 px-8">
                    <h1 className="text-2xl font-bold">
                        {getPageTitle()}
                    </h1>
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
                <main className="p-8 pt-0">
                    {renderPageContent()}
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