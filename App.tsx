
import React, { useState, useEffect, useMemo, useCallback } from 'react';
// Firebase imports
import { initializeDb } from './firebase/firebaseConfig';
import { ref, onValue, set, remove, update, Database } from 'firebase/database';
import { Student, SubjectData, ChapterProgress, WorkItem, Doubt } from './types';
import { initialStudents, initialSubjects } from './constants';
import StudentCard from './components/StudentCard';
import StudentDrawer from './components/StudentDrawer';
import StudentForm from './components/StudentForm';
import FilterBar from './components/FilterBar';
import SubjectManagerPage from './components/SubjectManagerPage';
import SyllabusProgressPage from './components/SyllabusProgressPage';
import WorkPoolPage from './components/WorkPoolPage';
import DoubtBoxPage from './components/DoubtBoxPage';
import Sidebar from './components/layout/Sidebar';
import { updateDoubtStatusFromWorkItems } from './utils/workPoolService';

type Page = 'students' | 'subjects' | 'syllabus' | 'work-pool' | 'doubts';

const App: React.FC = () => {
    const [db, setDb] = useState<Database | null>(null);
    const [dbError, setDbError] = useState<string | null>(null);
    const [students, setStudents] = useState<Student[]>([]);
    const [allStudentSubjects, setAllStudentSubjects] = useState<{ [key: string]: { studentId: string; subjects: SubjectData[] } }>({});
    const [chapterProgress, setChapterProgress] = useState<ChapterProgress[]>([]);
    const [workItems, setWorkItems] = useState<WorkItem[]>([]);
    const [doubts, setDoubts] = useState<Doubt[]>([]);

    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
    const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
    const [showArchived, setShowArchived] = useState<boolean>(false);
    const [filters, setFilters] = useState({ board: '', grade: '', batch: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState<Page>('students');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    // --- DATABASE INITIALIZATION ---
    useEffect(() => {
        const { db: database, error } = initializeDb();
        if (database) {
            setDb(database);
        } else {
            setDbError(error || "Failed to initialize Firebase. Check console for details.");
        }
    }, []);

    // --- FIREBASE DATA SYNC ---
    useEffect(() => {
        if (!db) return;
        const studentsRef = ref(db, 'students');
        const unsubscribe = onValue(studentsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setStudents(Object.values(data));
            } else if (!dbError) {
                // Seed initial data if the node is empty and there's no connection error
                const initialDataUpdates: { [key: string]: any } = {};
                initialStudents.forEach(student => {
                    initialDataUpdates[`students/${student.id}`] = student;
                });
                update(ref(db), initialDataUpdates)
                    .catch(e => console.error("Error seeding students:", e));
            }
        });
        return () => unsubscribe();
    }, [db, dbError]);

    useEffect(() => {
        if (!db) return;
        const subjectsRef = ref(db, 'subjects');
        const unsubscribe = onValue(subjectsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setAllStudentSubjects(data);
            } else if (!dbError) {
                // Seed initial data
                update(ref(db, 'subjects'), initialSubjects)
                    .catch(e => console.error("Error seeding subjects:", e));
            }
        });
        return () => unsubscribe();
    }, [db, dbError]);

    useEffect(() => {
        if (!db) return;
        const chaptersRef = ref(db, 'chapters');
        const unsubscribe = onValue(chaptersRef, (snapshot) => {
            const data = snapshot.val();
            setChapterProgress(data ? Object.values(data) : []);
        });
        return () => unsubscribe();
    }, [db]);

    useEffect(() => {
        if (!db) return;
        const workRef = ref(db, 'work');
        const unsubscribe = onValue(workRef, (snapshot) => {
            const data = snapshot.val();
            setWorkItems(data ? Object.values(data) : []);
        });
        return () => unsubscribe();
    }, [db]);

    useEffect(() => {
        if (!db) return;
        const doubtsRef = ref(db, 'doubts');
        const unsubscribe = onValue(doubtsRef, (snapshot) => {
            const data = snapshot.val();
            setDoubts(data ? Object.values(data) : []);
        });
        return () => unsubscribe();
    }, [db]);

    useEffect(() => {
        if (doubts.length === 0) return;
        let hasChanges = false;
        const newDoubts = doubts.map(doubt => {
            const updatedDoubt = updateDoubtStatusFromWorkItems(doubt, workItems);
            if (updatedDoubt.status !== doubt.status) {
                hasChanges = true;
            }
            return updatedDoubt;
        });
        if (hasChanges) {
            setDoubts(newDoubts);
        }
    }, [workItems, doubts]);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const handleSaveStudent = useCallback((studentData: Student) => {
        if (!db) { setDbError("Cannot save: Database not connected."); return; }
        set(ref(db, `students/${studentData.id}`), studentData)
            .then(() => {
                setEditingStudent(null);
                setViewingStudent(studentData);
            })
            .catch(error => console.error("Firebase student save error:", error));
    }, [db]);
    
    const handleSaveSubjects = useCallback((studentId: string, subjects: SubjectData[]) => {
        if (!db) { setDbError("Cannot save: Database not connected."); return; }
        const data = { studentId, subjects };
        update(ref(db), { [`subjects/${studentId}`]: data })
            .catch(error => console.error("Firebase subjects save error:", error));
    }, [db]);

    const handleSaveChapterProgress = useCallback((progress: ChapterProgress) => {
        if (!db) { setDbError("Cannot save: Database not connected."); return; }
        const oldProgress = chapterProgress.find(p => p.id === progress.id);
        const oldEntries = oldProgress?.entries ?? [];
        const oldEntryIds = new Set(oldEntries.map(e => e.id));
        
        const newEntries = progress.entries;
        const newEntryIds = new Set(newEntries.map(e => e.id));
    
        const updates: { [key: string]: any } = {};

        // --- LOGIC FOR ADDING A WORK ITEM ---
        const addedEntries = newEntries.filter(e => !oldEntryIds.has(e.id));
        const newStartEntry = addedEntries.find(e => e.type === 'start');
    
        if (newStartEntry) {
            const workAlreadyExists = workItems.some(item => 
                item.source === 'syllabus' &&
                item.studentId === progress.studentId &&
                item.subject === progress.subject &&
                item.chapterNo === progress.chapterNo
            );
    
            if (!workAlreadyExists) {
                const dueDate = new Date(newStartEntry.date);
                dueDate.setDate(dueDate.getDate() + 7);
    
                const newWorkItem: WorkItem = {
                    id: `w_${Date.now()}`,
                    studentId: progress.studentId,
                    title: `Start reading & note making for ${progress.chapterName}`,
                    subject: progress.subject,
                    chapterNo: progress.chapterNo,
                    chapterName: progress.chapterName,
                    topic: '',
                    description: 'Begin reading and making notes as the chapter has started in school.',
                    dueDate: dueDate.toISOString().split('T')[0],
                    status: 'Assign',
                    priority: 'Low',
                    links: [],
                    files: [],
                    mentorNote: '',
                    dateCreated: new Date().toISOString().split('T')[0],
                    source: 'syllabus',
                };
                updates[`work/${newWorkItem.id}`] = newWorkItem;
            }
        }
    
        // --- LOGIC FOR REMOVING A WORK ITEM ---
        const removedEntries = oldEntries.filter(e => !newEntryIds.has(e.id));
        const removedStartEntry = removedEntries.find(e => e.type === 'start');
        
        if (removedStartEntry) {
            const workItemToRemove = workItems.find(item => 
                item.source === 'syllabus' &&
                item.studentId === progress.studentId &&
                item.subject === progress.subject &&
                item.chapterNo === progress.chapterNo
            );
            if (workItemToRemove) {
                updates[`work/${workItemToRemove.id}`] = null; // Use null to delete in a multi-path update
            }
        }
        
        if (progress.entries.length === 0) {
            updates[`chapters/${progress.id}`] = null;
        } else {
            updates[`chapters/${progress.id}`] = progress;
        }

        if (Object.keys(updates).length > 0) {
            update(ref(db), updates).catch(e => console.error("Error saving chapter/work updates:", e));
        }

    }, [chapterProgress, workItems, db]);

    const handleSaveWorkItem = useCallback((workItem: WorkItem) => {
        if (!db) { setDbError("Cannot save: Database not connected."); return; }
        update(ref(db), { [`work/${workItem.id}`]: workItem })
            .catch(e => console.error("Error saving work item:", e));
    }, [db]);

    const handleDeleteWorkItem = useCallback((workItemId: string) => {
        if (!db) { setDbError("Cannot delete: Database not connected."); return; }
        remove(ref(db, `work/${workItemId}`))
            .catch(e => console.error("Error deleting work item:", e));
    }, [db]);

    const handleSaveDoubt = useCallback((doubt: Doubt) => {
        if (!db) { setDbError("Cannot save: Database not connected."); return; }
        update(ref(db), { [`doubts/${doubt.id}`]: doubt })
            .catch(e => console.error("Error saving doubt:", e));
    }, [db]);

    const handleDeleteDoubt = useCallback((doubtId: string) => {
        if (!db) { setDbError("Cannot delete: Database not connected."); return; }
        const updates: { [key: string]: any } = {};
        const linkedWorkItem = workItems.find(item => item.linkedDoubtId === doubtId && item.source === 'doubt');
        
        if (linkedWorkItem) {
            updates[`work/${linkedWorkItem.id}`] = null;
        }
        
        updates[`doubts/${doubtId}`] = null;
        
        update(ref(db), updates).catch(e => console.error("Error deleting doubt/work updates:", e));
    }, [workItems, db]);

    const handleArchive = useCallback((id: string) => {
        if (!db) { setDbError("Cannot archive: Database not connected."); return; }
        const studentToUpdate = students.find(s => s.id === id);
        if (studentToUpdate) {
            update(ref(db, `students/${id}`), { isArchived: !studentToUpdate.isArchived })
                .then(() => setViewingStudent(null))
                .catch(e => console.error("Error archiving student:", e));
        }
    }, [students, db]);

    const handleDelete = useCallback((id: string) => {
        if (!db) { setDbError("Cannot delete: Database not connected."); return; }
        if (!window.confirm("Are you sure you want to permanently delete this student and all their associated data? This action cannot be undone.")) {
            return;
        }

        const updates: { [key: string]: any } = {};
        updates[`/students/${id}`] = null;
        updates[`/subjects/${id}`] = null;

        chapterProgress.filter(p => p.studentId === id).forEach(p => {
            updates[`/chapters/${p.id}`] = null;
        });
        workItems.filter(w => w.studentId === id).forEach(w => {
            updates[`/work/${w.id}`] = null;
        });
        doubts.filter(d => d.studentId === id).forEach(d => {
            updates[`/doubts/${d.id}`] = null;
        });

        update(ref(db), updates)
            .then(() => {
                setViewingStudent(null);
                console.log(`Successfully deleted student ${id} and all related data.`);
            })
            .catch(error => {
                console.error("Firebase multi-path delete error:", error);
                alert("Failed to delete student data. Please try again.");
            });
    }, [chapterProgress, workItems, doubts, db]);

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
            case 'students':
            default: return 'Student Directory';
        }
    }


    return (
        <div className="relative min-h-screen">
            {dbError && (
                <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-3 text-center z-[100] shadow-lg text-sm font-semibold">
                    <strong>Database Connection Error:</strong> {dbError}
                </div>
            )}
            <Sidebar
                isExpanded={isSidebarExpanded}
                onHover={setIsSidebarExpanded}
                currentPage={currentPage}
                onNavigate={setCurrentPage}
            />
             <div 
                className="flex-grow transition-all duration-300"
                style={{ marginLeft: isSidebarExpanded ? '220px' : '60px', paddingTop: dbError ? '48px' : '0' }}
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