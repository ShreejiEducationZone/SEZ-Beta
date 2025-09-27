

import React, { useState, useMemo, useCallback } from 'react';
import { Student, SubjectData, WorkItem, Doubt } from '../types';
import StudentDoubtCard from './StudentDoubtCard';
import DoubtDrawer from './DoubtDrawer';
import DoubtForm from './DoubtForm';
import DoubtFilterBar from './DoubtFilterBar';
import { BOARDS, GRADES, BATCHES, DOUBT_PRIORITIES, DOUBT_STATUSES } from '../constants';
import DoubtTableView from './DoubtTableView';
import TableIcon from './icons/TableIcon';
import CardsIcon from './icons/CardsIcon';
import WorkItemDetailModal from './WorkItemDetailModal';
import DoubtDetailModal from './DoubtDetailModal';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Label } from 'recharts';


interface DoubtBoxPageProps {
    students: Student[];
    allStudentSubjects: { [key: string]: { studentId: string; subjects: SubjectData[] } };
    workItems: WorkItem[];
    doubts: Doubt[];
    onSaveDoubt: (doubt: Doubt) => void;
    onDeleteDoubt: (doubtId: string) => void;
    onSaveWorkItem: (item: WorkItem) => void;
}

const DoubtBoxPage: React.FC<DoubtBoxPageProps> = ({ students, allStudentSubjects, workItems, doubts, onSaveDoubt, onDeleteDoubt, onSaveWorkItem }) => {
    const [showArchived, setShowArchived] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentForNewDoubt, setStudentForNewDoubt] = useState<Student | null>(null);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const [editingDoubt, setEditingDoubt] = useState<Doubt | null>(null);
    const [studentForEditingDoubt, setStudentForEditingDoubt] = useState<Student | null>(null);
    const [viewingDoubt, setViewingDoubt] = useState<Doubt | null>(null);
    const [viewingWorkItem, setViewingWorkItem] = useState<WorkItem | null>(null);

    const [filters, setFilters] = useState({
        subject: '',
        priority: '',
        status: '',
        board: '',
        grade: '',
        batch: '',
        searchQuery: ''
    });
    const [searchSuggestions, setSearchSuggestions] = useState<Student[]>([]);

    const uniqueSubjects = useMemo(() => {
        const subjectsSet = new Set<string>();
        doubts.forEach(d => subjectsSet.add(d.subject));
        return Array.from(subjectsSet).sort();
    }, [doubts]);

    const chartData = useMemo(() => {
        const doubtsByDate: { [key: string]: number } = {};
        
        doubts.forEach(doubt => {
            // Using local date parts to avoid timezone shifts
            const d = new Date(doubt.createdAt);
            const date = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().split('T')[0];
            doubtsByDate[date] = (doubtsByDate[date] || 0) + 1;
        });

        const data = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            
            data.push({
                date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                fullDate: date.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                count: doubtsByDate[dateString] || 0,
            });
        }
        
        return data;
    }, [doubts]);

    const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setFilters(prev => ({ ...prev, searchQuery: query }));

        if (query.length > 1) {
            const suggestions = students.filter(s =>
                s.name.toLowerCase().includes(query.toLowerCase()) && s.isArchived === showArchived
            ).slice(0, 5);
            setSearchSuggestions(suggestions);
        } else {
            setSearchSuggestions([]);
        }
    }, [students, showArchived]);

    const handleSuggestionSelect = useCallback((name: string) => {
        setFilters(prev => ({ ...prev, searchQuery: name }));
        setSearchSuggestions([]);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({
            subject: '',
            priority: '',
            status: '',
            board: '',
            grade: '',
            batch: '',
            searchQuery: ''
        });
        setSearchSuggestions([]);
    }, []);

    const displayedStudents = useMemo(() => {
        const studentIdsWithMatchingDoubts = new Set(
            doubts
                .filter(doubt => {
                    if (filters.subject && doubt.subject !== filters.subject) return false;
                    if (filters.priority && doubt.priority !== filters.priority) return false;
                    if (filters.status && doubt.status !== filters.status) return false;
                    return true;
                })
                .map(d => d.studentId)
        );

        // FIX: Explicitly typed 'student' as Student to fix property access errors where type was inferred as 'unknown'.
        return students.filter((student: Student) => {
            if (student.isArchived !== showArchived) return false;
            
            if (filters.board && student.board !== filters.board) return false;
            if (filters.grade && student.grade !== filters.grade) return false;
            if (filters.batch && student.batch !== filters.batch) return false;
            
            if (filters.searchQuery && !student.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
                return false;
            }
            
            const hasDoubtFilters = filters.subject || filters.priority || filters.status;
            if (hasDoubtFilters && !studentIdsWithMatchingDoubts.has(student.id)) {
                return false;
            }

            return true;
        });
    }, [students, doubts, showArchived, filters]);

    const filteredDoubtsForTable = useMemo(() => {
        const studentMap = new Map(students.map(s => [s.id, s]));

        return doubts.filter(doubt => {
            const student = studentMap.get(doubt.studentId);
            if (!student || student.isArchived !== showArchived) return false;
            
            if (filters.board && student.board !== filters.board) return false;
            if (filters.grade && student.grade !== filters.grade) return false;
            if (filters.batch && student.batch !== filters.batch) return false;
            if (filters.searchQuery && !student.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
            
            if (filters.subject && doubt.subject !== filters.subject) return false;
            if (filters.priority && doubt.priority !== filters.priority) return false;
            if (filters.status && doubt.status !== filters.status) return false;

            return true;
        });
    }, [doubts, students, showArchived, filters]);

    const doubtStats = useMemo(() => {
        const total = filteredDoubtsForTable.length;
        const open = filteredDoubtsForTable.filter(d => d.status === 'Open').length;
        const tasked = filteredDoubtsForTable.filter(d => d.status === 'Tasked').length;
        const resolved = filteredDoubtsForTable.filter(d => d.status === 'Resolved').length;
        return { total, open, tasked, resolved };
    }, [filteredDoubtsForTable]);

    const handleViewDoubtDetails = useCallback((doubt: Doubt) => {
        setViewingDoubt(doubt);
    }, []);

    const studentForDoubtModal = useMemo(() => {
        if (!viewingDoubt) return null;
        return students.find(s => s.id === viewingDoubt.studentId) || null;
    }, [viewingDoubt, students]);

    const linkedWorkItemForDoubtModal = useMemo(() => {
        if (!viewingDoubt) return undefined;
        return workItems.find(w => w.linkedDoubtId === viewingDoubt.id);
    }, [viewingDoubt, workItems]);

    const doubtsByStudent = useMemo(() => {
        return doubts.reduce((acc, doubt) => {
            if (!acc[doubt.studentId]) {
                acc[doubt.studentId] = [];
            }
            acc[doubt.studentId].push(doubt);
            return acc;
        }, {} as { [key: string]: Doubt[] });
    }, [doubts]);
    
    const handleEditDoubt = useCallback((doubt: Doubt) => {
        const student = students.find(s => s.id === doubt.studentId);
        if (student) {
            setStudentForEditingDoubt(student);
            setEditingDoubt(doubt);
        }
    }, [students]);

    const handleResolveDoubt = useCallback((doubt: Doubt) => {
        const linkedWorkItem = workItems.find(item => item.linkedDoubtId === doubt.id && item.source === 'doubt');
        if (linkedWorkItem && linkedWorkItem.status !== 'Completed') {
            // Create a clean work item object to prevent circular structure errors
            const cleanWorkItem: WorkItem = {
                id: linkedWorkItem.id, studentId: linkedWorkItem.studentId, title: linkedWorkItem.title,
                subject: linkedWorkItem.subject, chapterNo: linkedWorkItem.chapterNo, chapterName: linkedWorkItem.chapterName,
                topic: linkedWorkItem.topic, description: linkedWorkItem.description, dueDate: linkedWorkItem.dueDate,
                status: 'Completed',
                priority: linkedWorkItem.priority, links: linkedWorkItem.links, files: linkedWorkItem.files,
                mentorNote: linkedWorkItem.mentorNote, dateCreated: linkedWorkItem.dateCreated,
                linkedDoubtId: linkedWorkItem.linkedDoubtId, source: linkedWorkItem.source
            };
            onSaveWorkItem(cleanWorkItem);
        }
        // Create a clean doubt object to prevent circular structure errors
        const cleanDoubt: Doubt = {
            id: doubt.id, studentId: doubt.studentId, subject: doubt.subject,
            chapterNo: doubt.chapterNo, chapterName: doubt.chapterName, testId: doubt.testId,
            text: doubt.text, priority: doubt.priority, origin: doubt.origin,
            createdAt: doubt.createdAt, 
            status: 'Resolved',
            resolvedAt: new Date().toISOString().split('T')[0],
            attachment: doubt.attachment, voiceNote: doubt.voiceNote
        };
        onSaveDoubt(cleanDoubt);
    }, [workItems, onSaveWorkItem, onSaveDoubt]);

    const handleViewTask = useCallback((workItem: WorkItem) => {
        setViewingWorkItem(workItem);
    }, []);

    const studentForWorkItemModal = useMemo(() => {
        if (!viewingWorkItem) return null;
        return students.find(s => s.id === viewingWorkItem.studentId) || null;
    }, [viewingWorkItem, students]);

    return (
        <div>
            <p className="mt-2 mb-6 text-gray-600 dark:text-gray-400 max-w-3xl">
                Track and resolve student doubts. Click on a student to view their doubt history, or add a new one.
            </p>

            <DoubtFilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onSearchChange={handleSearchChange}
                onSuggestionSelect={handleSuggestionSelect}
                onClearFilters={clearFilters}
                studentSuggestions={searchSuggestions}
                allSubjects={uniqueSubjects}
                allPriorities={DOUBT_PRIORITIES}
                allStatuses={DOUBT_STATUSES}
                allBoards={BOARDS}
                allGrades={GRADES}
                allBatches={BATCHES}
            />

            {viewMode === 'cards' && (
                 <div className="my-8 p-6 bg-light-card dark:bg-dark-card rounded-2xl shadow-sm">
                    <h3 className="text-lg font-semibold text-center mb-4 text-gray-800 dark:text-gray-200">Doubt Activity – Last 30 Days</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart
                                data={chartData}
                                margin={{
                                    top: 5,
                                    right: 20,
                                    left: 0,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.2} />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{ fontSize: 12, fill: 'currentColor' }} 
                                    stroke="currentColor"
                                    tickLine={{ stroke: 'currentColor' }}
                                />
                                <YAxis 
                                    allowDecimals={false} 
                                    tick={{ fontSize: 12, fill: 'currentColor' }} 
                                    stroke="currentColor"
                                    tickLine={{ stroke: 'currentColor' }}
                                >
                                    <Label value="Doubts" angle={-90} position="insideLeft" style={{ textAnchor: 'middle', fill: 'currentColor' }} />
                                </YAxis>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        color: 'hsl(var(--card-foreground))',
                                        borderRadius: '0.5rem',
                                    }}
                                    wrapperClassName="!border-none !shadow-lg"
                                    formatter={(value: number) => [`${value} doubts`, null]}
                                    labelFormatter={(label, payload) => payload[0]?.payload.fullDate || label}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    name="Doubts Logged"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    dot={{ r: 4, strokeWidth: 2 }}
                                    activeDot={{ r: 6, strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="showArchivedDoubtBox"
                        checked={showArchived}
                        onChange={() => setShowArchived(!showArchived)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="showArchivedDoubtBox" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                        Show Archived Students
                    </label>
                </div>
                 <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('cards')}
                        className={`flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'cards' ? 'bg-white dark:bg-dark-card shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        <CardsIcon className="h-5 w-5" /> Cards View
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-dark-card shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        <TableIcon className="h-5 w-5" /> Table View
                    </button>
                </div>
            </div>
            
            {viewMode === 'cards' ? (
                displayedStudents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {displayedStudents.map(student => (
                            <StudentDoubtCard
                                key={student.id}
                                student={student}
                                doubts={doubtsByStudent[student.id] || []}
                                onAddDoubt={() => setStudentForNewDoubt(student)}
                                onViewDoubts={() => setSelectedStudent(student)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                        <h3 className="text-xl font-semibold">No students found.</h3>
                        <p>Try adjusting your search or filters.</p>
                    </div>
                )
            ) : (
                <>
                    <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm mb-4 flex items-center gap-6 text-sm flex-wrap">
                        <div className="font-semibold text-gray-800 dark:text-white">
                            Total: <span className="text-base">{doubtStats.total}</span> doubts
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                Open: {doubtStats.open}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                Tasked: {doubtStats.tasked}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Resolved: {doubtStats.resolved}
                            </span>
                        </div>
                    </div>
                    <DoubtTableView
                        doubts={filteredDoubtsForTable}
                        students={students}
                        workItems={workItems}
                        onEdit={handleEditDoubt}
                        onDelete={onDeleteDoubt}
                        onResolve={handleResolveDoubt}
                        onViewTask={handleViewTask}
                        onViewDetails={handleViewDoubtDetails}
                    />
                </>
            )}
            
            {selectedStudent && (
                <DoubtDrawer
                    student={selectedStudent}
                    doubts={doubtsByStudent[selectedStudent.id] || []}
                    subjects={allStudentSubjects[selectedStudent.id]?.subjects || []}
                    workItems={workItems.filter(w => w.studentId === selectedStudent.id)}
                    onClose={() => setSelectedStudent(null)}
                    onSaveDoubt={onSaveDoubt}
                    onDeleteDoubt={onDeleteDoubt}
                    onSaveWorkItem={onSaveWorkItem}
                />
            )}
            
            {(studentForNewDoubt || (editingDoubt && studentForEditingDoubt)) && (
                <DoubtForm
                    student={studentForNewDoubt || studentForEditingDoubt!}
                    subjects={allStudentSubjects[studentForNewDoubt?.id || studentForEditingDoubt!.id]?.subjects || []}
                    workItems={workItems.filter(w => w.studentId === (studentForNewDoubt?.id || studentForEditingDoubt!.id))}
                    doubt={editingDoubt || undefined}
                    onSave={onSaveDoubt}
                    onCancel={() => {
                        setStudentForNewDoubt(null);
                        setEditingDoubt(null);
                        setStudentForEditingDoubt(null);
                    }}
                />
            )}

            {viewingDoubt && studentForDoubtModal && (
                <DoubtDetailModal
                    doubt={viewingDoubt}
                    student={studentForDoubtModal}
                    linkedWorkItem={linkedWorkItemForDoubtModal}
                    onClose={() => setViewingDoubt(null)}
                />
            )}

            {viewingWorkItem && studentForWorkItemModal && (
                <WorkItemDetailModal
                    item={viewingWorkItem}
                    student={studentForWorkItemModal}
                    onClose={() => setViewingWorkItem(null)}
                />
            )}
        </div>
    );
};

export default DoubtBoxPage;