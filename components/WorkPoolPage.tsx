import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Student, SubjectData, WorkItem, WorkHealthStatus } from '../types';
import StudentWorkCard from './StudentWorkCard';
import WorkItemsTable from './WorkItemsTable';
import WorkPoolFilterBar from './WorkPoolFilterBar';
import WorkCalendarView from './WorkCalendarView';
import WorkItemDetailModal from './WorkItemDetailModal';
import CalendarIcon from './icons/CalendarIcon';
import TableIcon from './icons/TableIcon';
import WorkPoolDrawer from './WorkPoolDrawer';
// FIX: Import specific context hooks
import { useSyllabus } from '../context/SyllabusContext';
import { useWorkPool } from '../context/WorkPoolContext';
// FIX: Import useStudent to get students data
import { useStudent } from '../context/StudentContext';
import CardsIcon from './icons/CardsIcon';

const WorkPoolPage: React.FC = () => {
    // FIX: Get data from specific context hooks
    const { allStudentSubjects } = useSyllabus();
    const { workItems, handleSaveWorkItem, handleDeleteWorkItem, openWorkForm } = useWorkPool();
    // FIX: Get students from useStudent hook
    const { students } = useStudent();

    const [showArchived, setShowArchived] = useState(false);
    const [viewingStudentWork, setViewingStudentWork] = useState<Student | null>(null);
    const [viewMode, setViewMode] = useState<'cards' | 'table' | 'calendar'>('cards');
    const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);

    const [sliderStyle, setSliderStyle] = useState({});
    const tabsContainerRef = useRef<HTMLDivElement>(null);

    const updateSlider = useCallback(() => {
        if (tabsContainerRef.current) {
            const activeTabNode = tabsContainerRef.current.querySelector(`[data-viewmode="${viewMode}"]`) as HTMLElement;
            if (activeTabNode) {
                setSliderStyle({
                    width: `${activeTabNode.offsetWidth}px`,
                    transform: `translateX(${activeTabNode.offsetLeft}px)`,
                });
            }
        }
    }, [viewMode]);

    useEffect(() => {
        // A small timeout to ensure layout is complete before measuring
        const timeoutId = setTimeout(updateSlider, 50);
        window.addEventListener('resize', updateSlider);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', updateSlider);
        };
    }, [viewMode, updateSlider]);


    const [filters, setFilters] = useState({
        searchQuery: '',
        batch: '',
        subject: '',
        status: '',
        priority: '',
    });

    // Automatically update 'Assign' status to 'Pending' for overdue items for display purposes.
    const processedWorkItems = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return workItems.map(item => {
            if (item.status === 'Assign' && new Date(item.dueDate) < today) {
                return { ...item, status: 'Pending' as 'Pending' };
            }
            return item;
        });
    }, [workItems]);

    const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({
            searchQuery: '',
            batch: '',
            subject: '',
            status: '',
            priority: '',
        });
    }, []);

    const allSubjects = useMemo(() => {
        const subjectsSet = new Set<string>();
        Object.values(allStudentSubjects).forEach((studentSubjects: { subjects: SubjectData[] }) => {
            studentSubjects.subjects.forEach(subject => subjectsSet.add(subject.subject));
        });
        return Array.from(subjectsSet).sort();
    }, [allStudentSubjects]);

    const workItemsByStudent = useMemo(() => {
        return processedWorkItems.reduce((acc, item) => {
            if (!acc[item.studentId]) {
                acc[item.studentId] = [];
            }
            acc[item.studentId].push(item);
            return acc;
        }, {} as { [key: string]: WorkItem[] });
    }, [processedWorkItems]);

    const filteredWorkItems = useMemo(() => {
        const studentMap = new Map<string, Student>(students.map(s => [s.id, s]));

        return processedWorkItems.filter(item => {
            const student = studentMap.get(item.studentId);
            if (!student) return false;
            
            if (student.isArchived !== showArchived) return false;

            if (filters.searchQuery && !student.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
            if (filters.batch && student.batch !== filters.batch) return false;
            if (filters.subject && item.subject !== filters.subject) return false;
            if (filters.status && item.status !== filters.status) return false;
            if (filters.priority && item.priority !== filters.priority) return false;
            
            return true;
        });
    }, [processedWorkItems, students, filters, showArchived]);

    const displayedStudents = useMemo(() => {
        const baseStudents = students.filter(student => student.isArchived === showArchived);
        const areAnyFiltersActive = filters.searchQuery || filters.batch || filters.subject || filters.status || filters.priority;
    
        if (!areAnyFiltersActive) {
            return baseStudents;
        }
    
        const studentIdsInFilteredWork = new Set(filteredWorkItems.map(item => item.studentId));
        
        return baseStudents.filter(student => studentIdsInFilteredWork.has(student.id));
    
    }, [students, showArchived, filters, filteredWorkItems]);

    const workHealthByStudent = useMemo(() => {
        const statsByStudent: Record<string, { pending: number; overdue: number }> = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        processedWorkItems.forEach(item => {
            if (!statsByStudent[item.studentId]) {
                statsByStudent[item.studentId] = { pending: 0, overdue: 0 };
            }

            if (item.status === 'Assign' || item.status === 'Pending') {
                statsByStudent[item.studentId].pending++;
                const dueDate = new Date(item.dueDate);
                if (dueDate < today) {
                    statsByStudent[item.studentId].overdue++;
                }
            }
        });

        const healthMap: Record<string, { health: WorkHealthStatus; pending: number; overdue: number }> = {};
        for (const studentId in statsByStudent) {
            const { pending, overdue } = statsByStudent[studentId];
            let health: WorkHealthStatus = 'Healthy';

            if (overdue >= 2 || pending > 3) {
                health = 'Critical';
            } else if (overdue === 1) {
                health = 'Warning';
            }

            healthMap[studentId] = { health, pending, overdue };
        }
        return healthMap;
    }, [processedWorkItems]);

    const handleEditWork = (item: WorkItem) => {
        const student = students.find(s => s.id === item.studentId);
        if (student) {
            setViewingStudentWork(null); 
            openWorkForm(student, item);
        }
    };
    
    const handleViewWorkDetails = useCallback((item: WorkItem) => {
        setSelectedWorkItem(item);
    }, []);

    const selectedStudentForModal = useMemo(() => {
        if (!selectedWorkItem) return null;
        return students.find(s => s.id === selectedWorkItem.studentId) || null;
    }, [selectedWorkItem, students]);
    
    const renderContent = () => {
        switch (viewMode) {
            case 'cards':
                return displayedStudents.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {displayedStudents.map(student => (
                            <StudentWorkCard
                                key={student.id}
                                student={student}
                                workItems={workItemsByStudent[student.id] || []}
                                onViewWork={() => setViewingStudentWork(student)}
                            />
                        ))}
                    </div>
                ) : (
                     <div className="text-center py-16 text-muted-foreground">
                        <h3 className="text-xl font-semibold">No {showArchived ? 'archived' : 'active'} students found.</h3>
                        <p>Try viewing {showArchived ? 'active' : 'archived'} students or clearing your filters.</p>
                    </div>
                );
            case 'table':
                return <WorkItemsTable 
                    workItems={filteredWorkItems} 
                    students={students} 
                    workHealthByStudent={workHealthByStudent}
                    onEdit={handleEditWork}
                    onDelete={handleDeleteWorkItem}
                />;
            case 'calendar':
                return <WorkCalendarView
                    workItems={filteredWorkItems}
                    students={students}
                    onItemClick={handleViewWorkDetails}
                    onSaveWorkItem={handleSaveWorkItem}
                />;
            default:
                return null;
        }
    };


    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="showArchivedWorkPool"
                        checked={showArchived}
                        onChange={() => setShowArchived(!showArchived)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <label htmlFor="showArchivedWorkPool" className="ml-2 block text-sm text-muted-foreground">
                        Show Archived Students
                    </label>
                </div>
                <div ref={tabsContainerRef} className="relative flex items-center bg-muted p-1 rounded-full">
                    <div
                        className="absolute h-[calc(100%-0.5rem)] bg-background rounded-full shadow-soft transition-all duration-300"
                        style={sliderStyle}
                    ></div>
                    <button data-viewmode="cards" onClick={() => setViewMode('cards')} className={`relative z-10 flex items-center justify-center gap-2 sm:px-4 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'cards' ? 'text-foreground' : 'text-muted-foreground'}`}>
                        <CardsIcon className="h-5 w-5" /> <span className="hidden sm:inline">Cards</span>
                    </button>
                    <button data-viewmode="table" onClick={() => setViewMode('table')} className={`relative z-10 flex items-center justify-center gap-2 sm:px-4 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'table' ? 'text-foreground' : 'text-muted-foreground'}`}>
                        <TableIcon className="h-5 w-5" /> <span className="hidden sm:inline">Table</span>
                    </button>
                    <button data-viewmode="calendar" onClick={() => setViewMode('calendar')} className={`relative z-10 flex items-center justify-center gap-2 sm:px-4 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'calendar' ? 'text-foreground' : 'text-muted-foreground'}`}>
                        <CalendarIcon className="h-5 w-5" /> <span className="hidden sm:inline">Calendar</span>
                    </button>
                </div>
            </div>

            <WorkPoolFilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onSearchChange={handleSearchChange}
                onClearFilters={clearFilters}
                allSubjects={allSubjects}
            />
            
            {renderContent()}

            {viewingStudentWork && (
                <WorkPoolDrawer
                    student={viewingStudentWork}
                    workItems={workItemsByStudent[viewingStudentWork.id] || []}
                    onClose={() => setViewingStudentWork(null)}
                    onEditWorkItem={handleEditWork}
                    onDeleteWorkItem={handleDeleteWorkItem}
                    onAddWork={() => {
                        openWorkForm(viewingStudentWork);
                        setViewingStudentWork(null);
                    }}
                />
            )}

            {selectedWorkItem && selectedStudentForModal && (
                <WorkItemDetailModal
                    item={selectedWorkItem}
                    student={selectedStudentForModal}
                    onClose={() => setSelectedWorkItem(null)}
                />
            )}
        </div>
    );
};

export default WorkPoolPage;