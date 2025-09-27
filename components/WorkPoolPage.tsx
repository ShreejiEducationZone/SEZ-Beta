
import React, { useState, useMemo, useCallback } from 'react';
import { Student, SubjectData, WorkItem, WorkHealthStatus } from '../types';
import StudentWorkCard from './StudentWorkCard';
import WorkForm from './WorkForm';
import WorkItemsTable from './WorkItemsTable';
import WorkPoolFilterBar from './WorkPoolFilterBar';
import WorkCalendarView from './WorkCalendarView';
import WorkItemDetailModal from './WorkItemDetailModal';
import CalendarIcon from './icons/CalendarIcon';
import TableIcon from './icons/TableIcon';
import WorkPoolDrawer from './WorkPoolDrawer';

interface WorkPoolPageProps {
    students: Student[];
    allStudentSubjects: { [key: string]: { studentId: string; subjects: SubjectData[] } };
    workItems: WorkItem[];
    onSaveWorkItem: (item: WorkItem) => void;
    onDeleteWorkItem: (id: string) => void;
}

const WorkPoolPage: React.FC<WorkPoolPageProps> = ({ students, allStudentSubjects, workItems, onSaveWorkItem, onDeleteWorkItem }) => {
    const [showArchived, setShowArchived] = useState(false);
    const [studentForNewWork, setStudentForNewWork] = useState<Student | null>(null);
    const [editingWorkItem, setEditingWorkItem] = useState<WorkItem | null>(null);
    const [viewingStudentWork, setViewingStudentWork] = useState<Student | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
    const [selectedWorkItem, setSelectedWorkItem] = useState<WorkItem | null>(null);

    const [filters, setFilters] = useState({
        searchQuery: '',
        batch: '',
        subject: '',
        status: '',
        priority: '',
    });

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
        // FIX: Explicitly type studentSubjects to resolve 'subjects' property error.
        Object.values(allStudentSubjects).forEach((studentSubjects: { subjects: SubjectData[] }) => {
            studentSubjects.subjects.forEach(subject => subjectsSet.add(subject.subject));
        });
        return Array.from(subjectsSet).sort();
    }, [allStudentSubjects]);

    const workItemsByStudent = useMemo(() => {
        return workItems.reduce((acc, item) => {
            if (!acc[item.studentId]) {
                acc[item.studentId] = [];
            }
            acc[item.studentId].push(item);
            return acc;
        }, {} as { [key: string]: WorkItem[] });
    }, [workItems]);

    const filteredWorkItems = useMemo(() => {
        // FIX: Explicitly type the Map to ensure correct type inference for 'student'.
        const studentMap = new Map<string, Student>(students.map(s => [s.id, s]));

        return workItems.filter(item => {
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
    }, [workItems, students, filters, showArchived]);

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

        workItems.forEach(item => {
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
    }, [workItems]);

    const handleEditWork = (item: WorkItem) => {
        setViewingStudentWork(null); // Close drawer if open
        setEditingWorkItem(item);
    };
    
    const handleCloseForm = () => {
        setStudentForNewWork(null);
        setEditingWorkItem(null);
    };
    
    const handleViewWorkDetails = useCallback((item: WorkItem) => {
        setSelectedWorkItem(item);
    }, []);

    const studentForForm = editingWorkItem 
        ? students.find(s => s.id === editingWorkItem.studentId) 
        : studentForNewWork;

    const selectedStudentForModal = useMemo(() => {
        if (!selectedWorkItem) return null;
        return students.find(s => s.id === selectedWorkItem.studentId) || null;
    }, [selectedWorkItem, students]);

    return (
        <div>
            <p className="mt-2 mb-6 text-gray-600 dark:text-gray-400 max-w-3xl">
                Assign and manage student tasks like tuition work, homework, and other assignments. Click on a student to view their work or "+ Add Work" to get started.
            </p>

            <WorkPoolFilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onSearchChange={handleSearchChange}
                onClearFilters={clearFilters}
                allSubjects={allSubjects}
            />

            <div className="flex items-center mb-6">
                <input
                    type="checkbox"
                    id="showArchivedWorkPool"
                    checked={showArchived}
                    onChange={() => setShowArchived(!showArchived)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="showArchivedWorkPool" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Show Archived Students
                </label>
            </div>
            
            {displayedStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayedStudents.map(student => (
                        <StudentWorkCard
                            key={student.id}
                            student={student}
                            workItems={workItemsByStudent[student.id] || []}
                            onAddWork={() => setStudentForNewWork(student)}
                            onViewWork={() => setViewingStudentWork(student)}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                    <h3 className="text-xl font-semibold">No {showArchived ? 'archived' : 'active'} students found.</h3>
                    <p>Try viewing {showArchived ? 'active' : 'archived'} students or clearing your filters.</p>
                </div>
            )}


            <div className="mt-12">
                <div className="flex justify-end my-4">
                    <button
                        onClick={() => setViewMode(viewMode === 'table' ? 'calendar' : 'table')}
                        className="flex items-center gap-2 h-10 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-semibold transition-colors"
                    >
                        {viewMode === 'table' ? (
                            <>
                                <CalendarIcon className="h-5 w-5" /> Calendar View
                            </>
                        ) : (
                            <>
                                <TableIcon className="h-5 w-5" /> Table View
                            </>
                        )}
                    </button>
                </div>

                 {viewMode === 'table' ? (
                    <WorkItemsTable 
                        workItems={filteredWorkItems} 
                        students={students} 
                        workHealthByStudent={workHealthByStudent}
                        onEdit={handleEditWork}
                        onDelete={onDeleteWorkItem}
                    />
                 ) : (
                    <WorkCalendarView
                        workItems={filteredWorkItems}
                        students={students}
                        onItemClick={handleViewWorkDetails}
                        onSaveWorkItem={onSaveWorkItem}
                    />
                 )}
            </div>

            {viewingStudentWork && (
                <WorkPoolDrawer
                    student={viewingStudentWork}
                    workItems={workItemsByStudent[viewingStudentWork.id] || []}
                    onClose={() => setViewingStudentWork(null)}
                    onEditWorkItem={handleEditWork}
                    onDeleteWorkItem={onDeleteWorkItem}
                    onAddWork={() => {
                        setViewingStudentWork(null); // Close drawer
                        setStudentForNewWork(viewingStudentWork); // Open form
                    }}
                />
            )}

            {(studentForNewWork || editingWorkItem) && studentForForm && (
                <WorkForm
                    student={studentForForm}
                    subjects={allStudentSubjects[studentForForm.id]?.subjects || []}
                    workItem={editingWorkItem || undefined}
                    workItems={workItems}
                    onSave={onSaveWorkItem}
                    onCancel={handleCloseForm}
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
