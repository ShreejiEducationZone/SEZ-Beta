import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useData } from './context/DataContext';
import { useStudent } from './context/StudentContext';
import { useAttendance } from './context/AttendanceContext';
import { Student, AttendanceStatus, WorkItem, Doubt } from './types';
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
import { ToastContainer } from './components/Toast';
import AiAssistantPage from './components/AiAssistantPage';
import { FaBars, FaPlus, FaBell } from 'react-icons/fa';
import ProfileDropdown from './components/layout/ProfileDropdown';
import VideoLibraryPage from './components/VideoLibraryPage';
import StudentSheetPage from './components/StudentSheetPage';
import SimpleStudentCard from './components/SimpleStudentCard';
import SkeletonCard from './components/loading/SkeletonCard';
import SkeletonFilterBar from './components/loading/SkeletonFilterBar';
import AnalyticsPage from './components/AnalyticsPage';
import { useWorkPool } from './context/WorkPoolContext';
import { useSyllabus } from './context/SyllabusContext';
import { useSheet } from './context/SheetContext';
import NotificationDrawer from './components/NotificationDrawer';

type Page = 'students' | 'subjects' | 'syllabus' | 'work-pool' | 'doubts' | 'reports' | 'sheets' | 'attendance' | 'ai-assistant' | 'settings' | 'video-library' | 'analytics';

const FloatingActionButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button
        onClick={onClick}
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-soft-xl flex items-center justify-center transition-transform duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 z-40"
        aria-label="Add new student"
    >
        <FaPlus className="h-7 w-7" />
    </button>
);

const STUDENTS_PER_PAGE = 12;

const App: React.FC = () => {
    const { 
        students,
        isLoadingStudents, 
        handleSaveStudent,
        handleArchiveStudent,
        handleDeleteStudent: rawDeleteHandler,
    } = useStudent();
    
    const { toasts, removeToast, branches } = useData();
    const { attendanceRecords, faceDescriptors } = useAttendance();
    const { workItems, doubts, tests } = useWorkPool();
    const { syllabusProgress, allStudentSubjects } = useSyllabus();
    const { sheetProgress } = useSheet();
    
    const [currentPage, setCurrentPage] = useState<Page>(() => {
        try {
            const savedPage = window.localStorage.getItem('sez-currentPage');
            const validPages: Page[] = ['students', 'subjects', 'syllabus', 'work-pool', 'doubts', 'reports', 'sheets', 'attendance', 'ai-assistant', 'settings', 'video-library', 'analytics'];
            if (savedPage && validPages.includes(savedPage as Page)) {
                return savedPage as Page;
            }
        } catch (error) {
            console.error("Error reading currentPage from localStorage", error);
        }
        return 'students';
    });
    const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
    const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
    const [viewingSheetForStudent, setViewingSheetForStudent] = useState<Student | null>(null);
    const [showArchived, setShowArchived] = useState<boolean>(false);
    const [filters, setFilters] = useState({ board: '', grade: '', batch: '', branch: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarExpanded, setSidebarExpanded] = useState(() => window.innerWidth >= 768);
    const [isNotificationDrawerOpen, setNotificationDrawerOpen] = useState(false);

    const [numVisibleStudents, setNumVisibleStudents] = useState(STUDENTS_PER_PAGE);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loaderRef = useRef(null);

    useEffect(() => {
        try {
            window.localStorage.setItem('sez-currentPage', currentPage);
        } catch (error) {
            console.error("Error saving currentPage to localStorage", error);
        }
    }, [currentPage]);
    
    // --- Notification Logic ---
    const [dismissedNotificationIds, setDismissedNotificationIds] = useState(() => {
        try {
            const item = window.localStorage.getItem('sez-dismissed-notifications');
            return item ? new Set(JSON.parse(item)) : new Set<string>();
        } catch (error) {
            console.error("Error reading dismissed notifications from localStorage", error);
            return new Set<string>();
        }
    });

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

    const allNotifications = useMemo(() => {
        const overdueTasks = workItems
            .filter(item => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return new Date(item.dueDate) < today && item.status !== 'Completed' && !dismissedNotificationIds.has(item.id);
            })
            .map(item => ({
                id: item.id,
                type: 'work-pool' as Page,
                item,
                student: studentMap.get(item.studentId),
                date: new Date(item.dateCreated),
                text: 'has an overdue task:'
            }));

        const openDoubts = doubts
            .filter(item => item.status === 'Open' && !dismissedNotificationIds.has(item.id))
            .map(item => ({
                id: item.id,
                type: 'doubts' as Page,
                item,
                student: studentMap.get(item.studentId),
                date: new Date(item.createdAt),
                text: 'has a new doubt:'
            }));
        
        return [...overdueTasks, ...openDoubts]
            .filter(n => n.student) // Ensure student exists and is not archived
            .sort((a, b) => b.date.getTime() - a.date.getTime());

    }, [workItems, doubts, studentMap, dismissedNotificationIds]);

    const notificationCount = allNotifications.length;

    const handleNavigateFromNotification = (page: Page, student: Student) => {
        setCurrentPage(page);
        setSearchQuery(student.name);
        setFilters({ board: '', grade: '', batch: '', branch: '' }); // Clear other filters
        setNotificationDrawerOpen(false);
    };
    
    const handleDismissNotification = (id: string) => {
        setDismissedNotificationIds(prev => {
            const newSet = new Set(prev).add(id);
            try {
                window.localStorage.setItem('sez-dismissed-notifications', JSON.stringify(Array.from(newSet)));
            } catch (error) {
                console.error("Error saving dismissed notifications to localStorage", error);
            }
            return newSet;
        });
    };
    
    const handleDismissAllNotifications = () => {
        if (allNotifications.length === 0) return;
        
        const allCurrentIds = allNotifications.map(n => n.id);
        const newSet = new Set([...dismissedNotificationIds, ...allCurrentIds]);
        
        setDismissedNotificationIds(newSet);
        try {
            window.localStorage.setItem('sez-dismissed-notifications', JSON.stringify(Array.from(newSet)));
        } catch (error) {
            console.error("Error saving dismissed notifications to localStorage", error);
        }
    };


    const handleDeleteStudent = (id: string) => {
        const student = students.find(s => s.id === id);
        if (!student) return;

        const relatedData = {
            workItems: workItems.filter((i: any) => i.studentId === id),
            doubts: doubts.filter((i: any) => i.studentId === id),
            tests: tests.filter((i: any) => i.studentId === id),
            syllabusProgress: syllabusProgress.filter((i: any) => i.studentId === id),
            sheetProgress: sheetProgress.filter((i: any) => i.studentId === id),
            attendance: attendanceRecords.filter((i: any) => i.studentId === id),
            faceDescriptors: faceDescriptors.filter((i: any) => i.id === id),
            studentSubjects: allStudentSubjects[id] ? [{ id }] : [],
        };
        rawDeleteHandler(student, relatedData);
    };
    
    const resetVisibleStudents = useCallback(() => {
        setNumVisibleStudents(STUDENTS_PER_PAGE);
    }, []);
    
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            if (student.isArchived !== showArchived) return false;
            if (filters.board && student.board !== filters.board) return false;
            if (filters.grade && student.grade.toString() !== filters.grade) return false;
            if (filters.batch && student.batch !== filters.batch) return false;
            if (filters.branch && student.branch !== filters.branch) return false;
            if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [students, showArchived, filters, searchQuery]);

    const studentsToDisplay = useMemo(() => {
        return filteredStudents.slice(0, numVisibleStudents);
    }, [filteredStudents, numVisibleStudents]);

    const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
        const target = entries[0];
        if (target.isIntersecting && !isLoadingMore && numVisibleStudents < filteredStudents.length) {
            setIsLoadingMore(true);
            setTimeout(() => {
                setNumVisibleStudents(prev => prev + STUDENTS_PER_PAGE);
                setIsLoadingMore(false);
            }, 500);
        }
    }, [isLoadingMore, numVisibleStudents, filteredStudents.length]);

    useEffect(() => {
        const observer = new IntersectionObserver(handleObserver, { rootMargin: "200px" });
        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }
        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [handleObserver]);

    const activeStudents = useMemo(() => students.filter(student => !student.isArchived), [students]);

    const filteredSheetStudents = useMemo(() => {
        return activeStudents.filter(student => {
            if (filters.board && student.board !== filters.board) return false;
            if (filters.grade && student.grade.toString() !== filters.grade) return false;
            if (filters.batch && student.batch !== filters.batch) return false;
            if (filters.branch && student.branch !== filters.branch) return false;
            if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [activeStudents, filters, searchQuery]);
    
    const todaysAttendance = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysRecords = attendanceRecords.filter(r => r.date === todayStr);
        return new Map(todaysRecords.map(r => [r.studentId, r.status]));
    }, [attendanceRecords]);
    
    const getStudentAttendance = (studentId: string): AttendanceStatus => {
        return todaysAttendance.get(studentId) || 'None';
    };

    const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        resetVisibleStudents();
    }, [resetVisibleStudents]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        resetVisibleStudents();
    }, [resetVisibleStudents]);

    const clearFilters = useCallback(() => {
        setFilters({ board: '', grade: '', batch: '', branch: '' });
        setSearchQuery('');
        resetVisibleStudents();
    }, [resetVisibleStudents]);

    const handleShowArchivedChange = useCallback(() => {
        setShowArchived(prev => !prev);
        resetVisibleStudents();
    }, [resetVisibleStudents]);

    const pageTitles: Record<Page, string> = {
        'students': 'Student Directory',
        'subjects': 'Subject Manager',
        'syllabus': 'Syllabus Progress',
        'work-pool': 'Work Pool',
        'doubts': 'Doubt Box',
        'reports': 'Reports & Tests',
        'sheets': 'Sheets',
        'attendance': 'Attendance',
        'ai-assistant': 'AI Assistant',
        'settings': 'Settings',
        'video-library': 'Video Library',
        'analytics': 'Performance Analytics'
    };

    const renderContent = () => {
        switch (currentPage) {
            case 'students':
                if (isLoadingStudents) {
                     return (
                        <>
                            <SkeletonFilterBar />
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                            </div>
                        </>
                    );
                }
                return (
                    <>
                        <FilterBar
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearFilters={clearFilters}
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                            branchOptions={branches}
                        />
                        <div className="flex items-center mb-6">
                            <input
                                type="checkbox"
                                id="showArchived"
                                checked={showArchived}
                                onChange={handleShowArchivedChange}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor="showArchived" className="ml-2 block text-sm text-muted-foreground">
                                Show Archived Students
                            </label>
                        </div>
                        {filteredStudents.length > 0 ? (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {studentsToDisplay.map(student => (
                                        <StudentCard key={student.id} student={student} onClick={setViewingStudent} attendanceStatus={getStudentAttendance(student.id)} />
                                    ))}
                                    {isLoadingMore && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`loading-${i}`} />)}
                                </div>
                                
                                <div ref={loaderRef} style={{ height: '1px' }} />

                                {!isLoadingMore && numVisibleStudents >= filteredStudents.length && filteredStudents.length > STUDENTS_PER_PAGE && (
                                     <div className="text-center py-16 text-muted-foreground">
                                        <h3 className="text-xl font-bold">You've reached the end.</h3>
                                        <p>All {filteredStudents.length} matching students are shown.</p>
                                    </div>
                                )}
                            </>
                        ) : (
                             <div className="text-center py-16 text-muted-foreground">
                                <h3 className="text-xl font-bold">No students found.</h3>
                                <p>Try adjusting your search or filters.</p>
                            </div>
                        )}
                    </>
                );
            case 'sheets':
                if (viewingSheetForStudent) {
                    return <StudentSheetPage student={viewingSheetForStudent} onBack={() => setViewingSheetForStudent(null)} />;
                }
                 if (isLoadingStudents) {
                     return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {Array.from({ length: 12 }).map((_, i) => <div key={i} className="bg-muted rounded-2xl h-40 animate-pulse" />)}
                        </div>
                    );
                }
                return (
                    <>
                        <p className="mt-2 mb-6 text-muted-foreground max-w-3xl">
                            Click on a student's card to view and manage their progress sheet.
                        </p>
                        <FilterBar
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearFilters={clearFilters}
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                            branchOptions={branches}
                        />
                        {filteredSheetStudents.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {filteredSheetStudents.map(student => (
                                    <SimpleStudentCard
                                        key={student.id}
                                        student={student}
                                        onClick={setViewingSheetForStudent}
                                    />
                                ))}
                            </div>
                        ) : (
                             <div className="text-center py-16 text-muted-foreground">
                                <h3 className="text-xl font-bold">No students found.</h3>
                                <p>Try adjusting your search or filters.</p>
                            </div>
                        )}
                    </>
                );
            case 'subjects': return <SubjectManagerPage />;
            case 'syllabus': return <SyllabusProgressPage />;
            case 'work-pool': return <WorkPoolPage />;
            case 'doubts': return <DoubtBoxPage />;
            case 'reports': return <ReportsPage />;
            case 'analytics': return <AnalyticsPage />;
            case 'attendance': return <AttendancePage />;
            case 'ai-assistant': return <AiAssistantPage />;
            case 'settings': return <SettingsPage />;
            case 'video-library': return <VideoLibraryPage />;
            default: return <div>Page not found</div>;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <ToastContainer toasts={toasts} onClose={removeToast} />
            <Sidebar
                isExpanded={isSidebarExpanded}
                onToggle={() => setSidebarExpanded(!isSidebarExpanded)}
                currentPage={currentPage}
                onNavigate={(page) => setCurrentPage(page)}
            />
            
            {isSidebarExpanded && (
                <div
                    onClick={() => setSidebarExpanded(false)}
                    className="fixed inset-0 bg-black/60 z-40 md:hidden"
                    aria-hidden="true"
                />
            )}

            <div className={`transition-all duration-300 ${isSidebarExpanded ? 'md:pl-72' : 'md:pl-24'}`}>
                <header className="sticky top-4 mx-4 z-30">
                     <div className="bg-card/80 dark:bg-card/70 backdrop-blur-lg rounded-2xl border border-border flex items-center justify-between h-16 px-6">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSidebarExpanded(!isSidebarExpanded)} className="md:hidden p-2 -ml-2 rounded-md text-muted-foreground hover:bg-muted">
                                <FaBars className="h-6 w-6" />
                            </button>
                            <h1 className="text-2xl font-bold text-foreground">{pageTitles[currentPage]}</h1>
                        </div>
                        <div className="flex items-center gap-2">
                             <button
                                onClick={() => setNotificationDrawerOpen(true)}
                                className="relative p-2 rounded-full text-muted-foreground hover:bg-muted focus:outline-none"
                                aria-label={`Notifications (${notificationCount})`}
                            >
                                <FaBell className="h-6 w-6" />
                                {notificationCount > 0 && (
                                    <span className="absolute top-1 right-1 h-5 w-5 flex items-center justify-center rounded-full bg-danger text-danger-foreground text-xs font-bold ring-2 ring-card">
                                        {notificationCount}
                                    </span>
                                )}
                            </button>
                            <ProfileDropdown />
                        </div>
                     </div>
                </header>
                
                <main className="p-4 md:p-8">
                    {renderContent()}
                </main>
            </div>

            <NotificationDrawer
                isOpen={isNotificationDrawerOpen}
                onClose={() => setNotificationDrawerOpen(false)}
                notifications={allNotifications}
                onNavigate={handleNavigateFromNotification}
                onDismiss={handleDismissNotification}
                onDismissAll={handleDismissAllNotifications}
            />

            {viewingStudent && <StudentDrawer student={viewingStudent} onClose={() => setViewingStudent(null)} onEdit={(s) => { setViewingStudent(null); setEditingStudent(s); }} onArchive={handleArchiveStudent} onDelete={handleDeleteStudent}/>}
            {editingStudent && <StudentForm student={editingStudent} onSave={handleSaveStudent} onCancel={() => setEditingStudent(null)} />}
            {currentPage === 'students' && <FloatingActionButton onClick={() => setEditingStudent({})} />}
        </div>
    );
};

export default App;