import React, { useState, useMemo, useCallback } from 'react';
import { Student, SubjectData, WorkItem, Doubt } from '../types';
import StudentDoubtCard from './StudentDoubtCard';
import DoubtDrawer from './DoubtDrawer';
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
import { useStudent } from '../context/StudentContext';

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
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
  
const CustomActiveDot: React.FC<any> = (props: any) => {
    const { cx, cy, stroke } = props;
    return (
        <g>
            <circle cx={cx} cy={cy} r={8} fill={stroke} fillOpacity={0.2} />
            <circle cx={cx} cy={cy} r={4} fill={stroke} />
        </g>
    );
};

const StatItem: React.FC<{ count: number; label: string; badgeClasses: string; }> = ({ count, label, badgeClasses }) => (
    <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={`flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold ${badgeClasses}`}>
            {count}
        </span>
    </div>
);


const DoubtBoxPage: React.FC = () => {
    const { allStudentSubjects } = useSyllabus();
    const { workItems, handleSaveWorkItem, openWorkForm, doubts, handleSaveDoubt, handleDeleteDoubt, openDoubtForm } = useWorkPool();
    const { students } = useStudent();

    const [showArchived, setShowArchived] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const [viewingDoubt, setViewingDoubt] = useState<Doubt | null>(null);
    const [viewingWorkItem, setViewingWorkItem] = useState<WorkItem | null>(null);
    
    const doubtViews: ('cards' | 'table')[] = ['cards', 'table'];
    const activeDoubtViewIndex = doubtViews.indexOf(viewMode);

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
        return (students as Student[]).filter((student: Student) => {
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
        const open = filteredDoubtsForTable.filter(d => d.status === 'Open').length;
        const tasked = filteredDoubtsForTable.filter(d => d.status === 'Tasked').length;
        const resolved = filteredDoubtsForTable.filter(d => d.status === 'Resolved').length;
        return { open, tasked, resolved };
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
            openDoubtForm(student, doubt);
        }
    }, [students, openDoubtForm]);

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

    const handleConvertToTask = (student: Student, partialWorkItem: Partial<WorkItem>) => {
        setSelectedStudent(null);
        openWorkForm(student, partialWorkItem);
    };

    return (
        <div>
            <p className="mt-2 mb-6 text-muted-foreground max-w-3xl">Track and resolve student doubts. Click on a student to view their doubt history, or add a new one.</p>
            
             <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4 bg-card rounded-2xl shadow-soft border border-border">
                    <StatItem count={doubtStats.open} label="Open" badgeClasses="bg-warning-muted text-warning-muted-foreground" />
                    <StatItem count={doubtStats.tasked} label="Tasked" badgeClasses="bg-accent-muted text-accent-muted-foreground" />
                    <StatItem count={doubtStats.resolved} label="Resolved" badgeClasses="bg-success-muted text-success-muted-foreground" />
                </div>

                <div className="flex items-center gap-4 self-end md:self-center">
                    <div className="flex items-center">
                        <input type="checkbox" id="showArchivedDoubtBox" checked={showArchived} onChange={() => setShowArchived(!showArchived)} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                        <label htmlFor="showArchivedDoubtBox" className="ml-2 block text-sm text-muted-foreground whitespace-nowrap">Show Archived</label>
                    </div>
                    <div className="relative flex items-center bg-muted p-1 rounded-full flex-shrink-0">
                        <div
                            className="absolute h-[calc(100%-0.5rem)] w-1/2 bg-background rounded-full shadow-soft transition-transform duration-300"
                            style={{ transform: `translateX(${activeDoubtViewIndex * 100}%)` }}
                        ></div>
                        <button onClick={() => setViewMode('cards')} className={`relative z-10 flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'cards' ? 'text-foreground' : 'text-muted-foreground'}`}>
                            <CardsIcon className="h-5 w-5" /> Cards
                        </button>
                        <button onClick={() => setViewMode('table')} className={`relative z-10 flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${viewMode === 'table' ? 'text-foreground' : 'text-muted-foreground'}`}>
                            <TableIcon className="h-5 w-5" /> Table
                        </button>
                    </div>
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
                    onConvertToTask={handleConvertToTask}
                    onAddDoubt={() => {
                        const studentForNew = selectedStudent;
                        setSelectedStudent(null);
                        openDoubtForm(studentForNew);
                    }}
                />
            )}

            {viewingDoubt && studentForDoubtModal && <DoubtDetailModal doubt={viewingDoubt} student={studentForDoubtModal} linkedWorkItem={linkedWorkItemForDoubtModal} onClose={() => setViewingDoubt(null)} />}
            {viewingWorkItem && studentForWorkItemModal && <WorkItemDetailModal item={viewingWorkItem} student={studentForWorkItemModal} onClose={() => setViewingWorkItem(null)} />}
        </div>
    );
};

export default DoubtBoxPage;