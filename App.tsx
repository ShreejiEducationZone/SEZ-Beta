

import React, { useState, useMemo, useCallback } from 'react';
import { useData } from './context/DataContext';
import { Student, AttendanceStatus } from './types';
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
import { FaBars } from 'react-icons/fa';
import SkeletonCard from './components/loading/SkeletonCard';
import SkeletonFilterBar from './components/loading/SkeletonFilterBar';
import ProfileDropdown from './components/layout/ProfileDropdown';

type Page = 'students' | 'subjects' | 'syllabus' | 'work-pool' | 'doubts' | 'reports' | 'attendance' | 'settings' | 'ai-assistant';

const App: React.FC = () => {
    const { 
        students, 
        isLoading,
        toasts,
        removeToast,
        handleSaveStudent,
        handleArchiveStudent,
        handleDeleteStudent,
        attendanceRecords,
    } = useData();

    // Local UI state
    const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
    const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
    const [showArchived, setShowArchived] = useState<boolean>(false);
    const [filters, setFilters] = useState({
        board: '',
        grade: '',
        batch: '',
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState<Page>('students');
    const [isSidebarExpanded, setSidebarExpanded] = useState(() => window.innerWidth >= 768);

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
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({ board: '', grade: '', batch: '' });
        setSearchQuery('');
    }, []);

    const pageTitles: Record<Page, string> = {
        'students': 'Student Directory',
        'subjects': 'Subject Manager',
        'syllabus': 'Syllabus Progress',
        'work-pool': 'Work Pool',
        'doubts': 'Doubt Box',
        'reports': 'Reports & Tests',
        'attendance': 'Attendance',
        'ai-assistant': 'AI Assistant',
        'settings': 'Settings',
    };

    const renderContent = () => {
        if (isLoading) {
             return (
                <>
                    <SkeletonFilterBar />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                </>
            );
        }

        switch (currentPage) {
            case 'students':
                return (
                    <>
                        <FilterBar
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClearFilters={clearFilters}
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                        />
                        <div className="flex items-center mb-6">
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
                                    <StudentCard key={student.id} student={student} onClick={setViewingStudent} attendanceStatus={getStudentAttendance(student.id)} />
                                ))}
                            </div>
                        ) : (
                             <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                                <h3 className="text-xl font-semibold">No students found.</h3>
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
            case 'attendance': return <AttendancePage />;
            case 'ai-assistant': return <AiAssistantPage />;
            case 'settings': return <SettingsPage />;
            default: return <div>Page not found</div>;
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-300`}>
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

            <div className={`transition-all duration-300 ${isSidebarExpanded ? 'md:pl-[220px]' : 'md:pl-[60px]'}`}>
                <header className="flex items-center justify-between h-16 bg-light-card/95 dark:bg-dark-card/95 backdrop-blur-sm px-4 md:px-8 sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarExpanded(!isSidebarExpanded)} className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <FaBars className="h-6 w-6" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{pageTitles[currentPage]}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {currentPage === 'students' && (
                             <button
                                onClick={() => setEditingStudent({})}
                                className="bg-brand-blue text-white h-10 px-4 rounded-md hover:bg-blue-600 transition-colors text-sm font-semibold flex-shrink-0"
                            >
                                + Add Student
                            </button>
                        )}
                        <ProfileDropdown />
                    </div>
                </header>
                
                <main className="p-4 md:p-8">
                    {renderContent()}
                </main>
            </div>

            {viewingStudent && <StudentDrawer student={viewingStudent} onClose={() => setViewingStudent(null)} onEdit={(s) => { setViewingStudent(null); setEditingStudent(s); }} onArchive={handleArchiveStudent} onDelete={handleDeleteStudent}/>}
            {editingStudent && <StudentForm student={editingStudent} onSave={handleSaveStudent} onCancel={() => setEditingStudent(null)} />}
        </div>
    );
};

export default App;