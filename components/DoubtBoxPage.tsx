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
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
// FIX: Import specific context hooks
import { useSyllabus } from '../context/SyllabusContext';
import { useWorkPool } from '../context/WorkPoolContext';
import { useDoubtBox } from '../context/DoubtBoxContext';
// FIX: Import useStudent to get students data
import { useStudent } from '../context/StudentContext';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card/80 dark:bg-card/70 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-border text-sm">
          <p className="font-bold text-foreground">{data.fullDate || label}</p>
          <p className="font-semibold text-primary">{`${data.count} doubt(s)`}</p>
        </div>
      );
    }
    return null;
};
  
const CustomActiveDot = (props: any) => {
    const { cx, cy, stroke } = props;
    return (
        <g>
            <circle cx={cx} cy={cy} r={8} fill={stroke} fillOpacity={0.2} />
            <circle cx={cx} cy={cy} r={4} fill={stroke} />
        </g>
    );
};

const DoubtBoxPage: React.FC = () => {
    // FIX: Get data from specific context hooks
    const { allStudentSubjects } = useSyllabus();
    const { workItems, handleSaveWorkItem } = useWorkPool();
    const { doubts, handleSaveDoubt, handleDeleteDoubt } = useDoubtBox();
    // FIX: Get students from useStudent hook
    const { students } = useStudent();

    const [showArchived, setShowArchived] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [studentForNewDoubt, setStudentForNewDoubt] = useState<Student | null>(null);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const [editingDoubt, setEditingDoubt] = useState<Doubt | null>(null);
    const [studentForEditingDoubt, setStudentForEditingDoubt] = useState<Student | null>(null);
    const [viewingDoubt, setViewingDoubt] = useState<Doubt | null>(null);
    const [viewingWorkItem, setViewingWorkItem] = useState<WorkItem | null>(null);

    const [filters, setFilters] = useState({
        subject: '', priority: '', status: '', board: '', grade: '', batch: '', searchQuery: ''
    });
    const [searchSuggestions, setSearchSuggestions] = useState<Student[]>([]);

    const uniqueSubjects = useMemo(() => Array.from(new Set(doubts.map((d: Doubt) => d.subject))).sort(), [doubts]);

    const chartData = useMemo(() => {
        const doubtsByDate: { [key: string]: number } = {};
        doubts.forEach(doubt => {
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
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setFilters(prev => ({ ...prev, searchQuery: query }));
        if (query.length > 1) {
            setSearchSuggestions(students.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) && s.isArchived === showArchived).slice(0, 5));
        } else {
            setSearchSuggestions([]);
        }
    }, [students, showArchived]);

    const handleSuggestionSelect = useCallback((name: string) => {
        setFilters(prev => ({ ...prev, searchQuery: name }));
        setSearchSuggestions([]);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({ subject: '', priority: '', status: '', board: '', grade: '', batch: '', searchQuery: '' });
        setSearchSuggestions([]);
    }, []);

    const displayedStudents = useMemo(() => {
        const studentIdsWithMatchingDoubts = new Set(
            doubts.filter(doubt => {
                if (filters.subject && doubt.subject !== filters.subject) return false;
                if (filters.priority && doubt.priority !== filters.priority) return false;
                if (filters.status && doubt.status !== filters.status) return false;
                return true;
            }).map(d => d.studentId)
        );
        return (students as Student[]).filter(student => {
            if (student.isArchived !== showArchived) return false;
            if (filters.board && student.board !== filters.board) return false;
            if (filters.grade && student.grade.toString() !== filters.grade) return false;
            if (filters.batch && student.batch !== filters.batch) return false;
            if (filters.searchQuery && !student.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
            const hasDoubtFilters = filters.subject || filters.priority || filters.status;
            if (hasDoubtFilters && !studentIdsWithMatchingDoubts.has(student.id)) return false;
            return true;
        });
    }, [students, doubts, showArchived, filters]);

    const filteredDoubtsForTable = useMemo(() => {
        const studentMap = new Map((students as Student[]).map(s => [s.id, s]));
        return doubts.filter((doubt: Doubt) => {
            const student: Student | undefined = studentMap.get(doubt.studentId);
            if (!student || student.isArchived !== showArchived) return false;
            if (filters.board && student.board !== filters.board) return false;
            if (filters.grade && student.grade.toString() !== filters.grade) return false;
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

    const handleViewDoubtDetails = useCallback((doubt: Doubt) => setViewingDoubt(doubt), []);
    const studentForDoubtModal = useMemo(() => viewingDoubt ? students.find(s => s.id === viewingDoubt.studentId) || null : null, [viewingDoubt, students]);
    const linkedWorkItemForDoubtModal = useMemo(() => viewingDoubt ? workItems.find(w => w.linkedDoubtId === viewingDoubt.id) : undefined, [viewingDoubt, workItems]);
    const doubtsByStudent = useMemo(() => doubts.reduce((acc, doubt) => {
        if (!acc[doubt.studentId]) acc[doubt.studentId] = [];
        acc[doubt.studentId].push(doubt);
        return acc;
    }, {} as { [key: string]: Doubt[] }), [doubts]);
    
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
            const cleanWorkItem: WorkItem = { ...linkedWorkItem, status: 'Completed' };
            handleSaveWorkItem(cleanWorkItem);
        }
        const cleanDoubt: Doubt = { ...doubt, status: 'Resolved', resolvedAt: new Date().toISOString().split('T')[0] };
        handleSaveDoubt(cleanDoubt);
    }, [workItems, handleSaveWorkItem, handleSaveDoubt]);

    const handleViewTask = useCallback((workItem: WorkItem) => setViewingWorkItem(workItem), []);
    const studentForWorkItemModal = useMemo(() => viewingWorkItem ? students.find(s => s.id === viewingWorkItem.studentId) || null : null, [viewingWorkItem, students]);

    return (
        <div>
            <p className="mt-2 mb-6 text-muted-foreground max-w-3xl">Track and resolve student doubts. Click on a student to view their doubt history, or add a new one.</p>
            
            <div className="bg-card p-2 rounded-xl shadow-soft border border-border mb-6 flex justify-between items-center">
                <div className="flex items-center gap-x-4 pl-2">
                    <div className="text-sm font-semibold text-muted-foreground">Total: <span className="text-lg font-bold text-foreground">{doubtStats.total}</span></div>
                    <div className="w-px h-6 bg-border"></div>
                    <div className="text-sm font-semibold text-muted-foreground">Open: <span className="text-lg font-bold text-warning">{doubtStats.open}</span></div>
                    <div className="text-sm font-semibold text-muted-foreground">Tasked: <span className="text-lg font-bold text-accent">{doubtStats.tasked}</span></div>
                    <div className="text-sm font-semibold text-muted-foreground">Resolved: <span className="text-lg font-bold text-success">{doubtStats.resolved}</span></div>
                </div>

                <div className="flex bg-muted rounded-lg p-1">
                    <button onClick={() => setViewMode('cards')} className={`flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'cards' ? 'bg-background shadow-soft' : 'text-muted-foreground'}`}><CardsIcon className="h-5 w-5" /> Cards View</button>
                    <button onClick={() => setViewMode('table')} className={`flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === 'table' ? 'bg-background shadow-soft' : 'text-muted-foreground'}`}><TableIcon className="h-5 w-5" /> Table View</button>
                </div>
            </div>

            <div className="my-8 p-6 bg-card rounded-2xl shadow-soft border border-border">
                <h3 className="text-lg font-semibold text-center mb-4 text-muted-foreground">Doubt Activity – Last 30 Days</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="doubtChartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                            <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                                type="monotone" 
                                dataKey="count" 
                                stroke="hsl(var(--primary))" 
                                strokeWidth={2} 
                                fillOpacity={1} 
                                fill="url(#doubtChartGradient)" 
                                activeDot={<CustomActiveDot />} 
                                name="Doubts"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
            
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
            
            <div className="flex items-center my-6">
                <input type="checkbox" id="showArchivedDoubtBox" checked={showArchived} onChange={() => setShowArchived(!showArchived)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                <label htmlFor="showArchivedDoubtBox" className="ml-2 block text-sm text-muted-foreground">Show Archived Students</label>
            </div>

            {viewMode === 'cards' ? (
                displayedStudents.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {displayedStudents.map(student => <StudentDoubtCard key={student.id} student={student} doubts={doubtsByStudent[student.id] || []} onViewDoubts={() => setSelectedStudent(student)} />)}
                    </div>
                ) : (
                    <div className="text-center py-16 text-muted-foreground"><h3 className="text-xl font-semibold">No students found.</h3><p>Try adjusting your search or filters.</p></div>
                )
            ) : (
                <DoubtTableView {...{ doubts: filteredDoubtsForTable, students, workItems, onEdit: handleEditDoubt, onDelete: handleDeleteDoubt, onResolve: handleResolveDoubt, onViewTask: handleViewTask, onViewDetails: handleViewDoubtDetails }} />
            )}
            
            {selectedStudent && (
                <DoubtDrawer 
                    student={selectedStudent}
                    doubts={doubtsByStudent[selectedStudent.id] || []}
                    subjects={allStudentSubjects[selectedStudent.id]?.subjects || []}
                    workItems={workItems.filter(w => w.studentId === selectedStudent.id)}
                    onClose={() => setSelectedStudent(null)}
                    onSaveDoubt={handleSaveDoubt}
                    onDeleteDoubt={handleDeleteDoubt}
                    onSaveWorkItem={handleSaveWorkItem}
                    onAddDoubt={() => {
                        const studentForNew = selectedStudent;
                        setSelectedStudent(null);
                        setStudentForNewDoubt(studentForNew);
                    }}
                />
            )}
            {(studentForNewDoubt || (editingDoubt && studentForEditingDoubt)) && <DoubtForm student={studentForNewDoubt || studentForEditingDoubt!} subjects={allStudentSubjects[studentForNewDoubt?.id || studentForEditingDoubt!.id]?.subjects || []} workItems={workItems.filter(w => w.studentId === (studentForNewDoubt?.id || studentForEditingDoubt!.id))} doubt={editingDoubt || undefined} onSave={handleSaveDoubt} onCancel={() => { setStudentForNewDoubt(null); setEditingDoubt(null); setStudentForEditingDoubt(null); }} />}
            {viewingDoubt && studentForDoubtModal && <DoubtDetailModal doubt={viewingDoubt} student={studentForDoubtModal} linkedWorkItem={linkedWorkItemForDoubtModal} onClose={() => setViewingDoubt(null)} />}
            {viewingWorkItem && studentForWorkItemModal && <WorkItemDetailModal item={viewingWorkItem} student={studentForWorkItemModal} onClose={() => setViewingWorkItem(null)} />}
        </div>
    );
};

export default DoubtBoxPage;