import React, { useState, useMemo, FC, useRef, useEffect } from 'react';
import { Student, Doubt, SubjectData, WorkItem, DoubtStatus, DoubtPriority, WorkItem as WorkItemType } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';
import UndoIcon from './icons/UndoIcon';
import ConvertToTaskIcon from './icons/ConvertToTaskIcon';
import DoubtForm from './DoubtForm';
import CheckCircleIcon from './icons/CheckCircleIcon';
import CheckSquareIcon from './icons/CheckSquareIcon';
import { updateDoubtStatusFromWorkItems } from '../utils/workPoolService';
import { DOUBT_PRIORITIES, DOUBT_STATUSES } from '../constants';
import SelectField from './form/SelectField';
import PlusIcon from './icons/PlusIcon';
import DownloadIcon from './icons/DownloadIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import CsvIcon from './icons/CsvIcon';
import PdfIcon from './icons/PdfIcon';
import XIcon from './icons/XIcon';

interface DoubtDrawerProps {
    student: Student;
    doubts: Doubt[];
    subjects: SubjectData[];
    workItems: WorkItem[];
    onClose: () => void;
    onSaveDoubt: (doubt: Doubt) => void;
    onDeleteDoubt: (doubtId: string) => void;
    onSaveWorkItem: (item: WorkItem) => void;
    onConvertToTask: (student: Student, workItem: Partial<WorkItem>) => void;
    onAddDoubt: () => void;
}

const PRIORITY_STYLES: Record<DoubtPriority, string> = {
    High: 'bg-danger-muted text-danger-muted-foreground',
    Medium: 'bg-warning-muted text-warning-muted-foreground',
    Low: 'bg-info-muted text-info-muted-foreground',
};

const STATUS_STYLES: Record<DoubtStatus, string> = {
    Resolved: 'bg-success-muted text-success-muted-foreground',
    Open: 'bg-warning-muted text-warning-muted-foreground',
    Tasked: 'bg-accent-muted text-accent-muted-foreground',
};


const DoubtDrawer: FC<DoubtDrawerProps> = ({ student, doubts, subjects, workItems, onClose, onSaveDoubt, onDeleteDoubt, onSaveWorkItem, onConvertToTask, onAddDoubt }) => {
    const [activeTab, setActiveTab] = useState<'Open' | 'Tasked' | 'Resolved'>('Open');
    const [editingDoubt, setEditingDoubt] = useState<Doubt | null>(null);
    const [filters, setFilters] = useState({
        subject: '',
        priority: '',
        status: '',
        searchQuery: ''
    });
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const doubtCounts = useMemo(() => {
        return doubts.reduce((acc, doubt) => {
            if (doubt.status === 'Open') acc.Open++;
            else if (doubt.status === 'Tasked') acc.Tasked++;
            else if (doubt.status === 'Resolved') acc.Resolved++;
            return acc;
        }, { Open: 0, Tasked: 0, Resolved: 0 });
    }, [doubts]);

    const uniqueSubjects = useMemo(() => {
        return Array.from(new Set(subjects.map(s => s.subject)));
    }, [subjects]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
    };

    const clearFilters = () => {
        setFilters({
            subject: '',
            priority: '',
            status: '',
            searchQuery: ''
        });
    };

    const filteredDoubts = useMemo(() => {
        let tempDoubts = [...doubts];

        // 1. Apply activeTab filter
        if (activeTab === 'Open') {
            tempDoubts = tempDoubts.filter(d => d.status === 'Open');
        } else if (activeTab === 'Tasked') {
            tempDoubts = tempDoubts.filter(d => d.status === 'Tasked');
        } else if (activeTab === 'Resolved') {
            tempDoubts = tempDoubts.filter(d => d.status === 'Resolved');
        }

        // 2. Apply secondary filters
        if (filters.subject) {
            tempDoubts = tempDoubts.filter(d => d.subject === filters.subject);
        }
        if (filters.priority) {
            tempDoubts = tempDoubts.filter(d => d.priority === filters.priority);
        }
        if (filters.status) {
            tempDoubts = tempDoubts.filter(d => d.status === filters.status);
        }
        if (filters.searchQuery) {
            const lowercasedQuery = filters.searchQuery.toLowerCase();
            tempDoubts = tempDoubts.filter(d => d.text.toLowerCase().includes(lowercasedQuery));
        }

        // 3. Sort the final list
        return tempDoubts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [doubts, activeTab, filters]);

    const handleExportCSV = () => {
        setIsExportMenuOpen(false);
        const headers = ['Student Name', 'Subject', 'Chapter No', 'Chapter Name', 'Doubt Text', 'Priority', 'Status', 'Origin', 'Logged At', 'Resolved At'];
        const csvRows = [headers.join(',')];

        filteredDoubts.forEach(doubt => {
            const row = [
                `"${student.name}"`,
                `"${doubt.subject}"`,
                `"${doubt.chapterNo || ''}"`,
                `"${doubt.chapterName || ''}"`,
                `"${doubt.text.replace(/"/g, '""')}"`, // Escape double quotes
                `"${doubt.priority}"`,
                `"${doubt.status}"`,
                `"${doubt.origin}"`,
                `"${doubt.createdAt}"`,
                `"${doubt.resolvedAt || ''}"`,
            ].join(',');
            csvRows.push(row);
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const today = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `Doubts_Report_${student.name.replace(/\s/g, '_')}_${today}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        setIsExportMenuOpen(false);
        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF();
        
        const today = new Date().toLocaleDateString('en-GB');
        const title = `Doubts Report for ${student.name}`;
        const generatedOn = `Generated on ${today}`;

        doc.setFontSize(16);
        doc.text(title, 14, 20);
        doc.setFontSize(10);
        doc.text(generatedOn, 14, 25);

        const tableColumn = ["Subject", "Chapter", "Doubt", "Status", "Priority", "Logged At"];
        const tableRows: (string | number)[][] = [];

        filteredDoubts.forEach(doubt => {
            const chapter = doubt.chapterName ? `Ch ${doubt.chapterNo}: ${doubt.chapterName}` : 'N/A';
            const doubtData = [
                doubt.subject,
                chapter,
                doubt.text, // autoTable will handle wrapping
                doubt.status,
                doubt.priority,
                doubt.createdAt,
            ];
            tableRows.push(doubtData);
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [3, 105, 161] },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 30 },
                2: { cellWidth: 'auto' }, // Let this column take up remaining space
                3: { cellWidth: 18 },
                4: { cellWidth: 18 },
                5: { cellWidth: 20 },
            }
        });
        
        const todayStr = new Date().toISOString().split('T')[0];
        doc.save(`Doubts_Report_${student.name.replace(/\s/g, '_')}_${todayStr}.pdf`);
    };

    const handleResolve = (doubt: Doubt) => {
        const linkedWorkItem = workItems.find(item => item.linkedDoubtId === doubt.id && item.source === 'doubt');
        if (linkedWorkItem && linkedWorkItem.status !== 'Completed') {
            onSaveWorkItem({ ...linkedWorkItem, status: 'Completed' });
        }
        onSaveDoubt({ ...doubt, status: 'Resolved', resolvedAt: new Date().toISOString().split('T')[0] });
    };

    const handleUndoResolve = (doubt: Doubt) => {
         onSaveDoubt({ ...doubt, status: 'Open', resolvedAt: undefined });
    };

    const handleConvertToTask = (doubt: Doubt) => {
        const alreadyExists = workItems.some(item => item.linkedDoubtId === doubt.id);
        if (alreadyExists) {
            alert("This doubt has already been converted to a work task.");
            return;
        }

        const partialWorkItem: Partial<WorkItem> = {
            title: `Resolve Doubt: ${doubt.chapterName || doubt.subject}`,
            subject: doubt.subject,
            chapterNo: doubt.chapterNo,
            chapterName: doubt.chapterName,
            topic: doubt.topic,
            description: doubt.text,
            priority: doubt.priority,
            linkedDoubtId: doubt.id,
            source: 'doubt',
            status: 'Assign',
        };
        
        onConvertToTask(student, partialWorkItem);
    };


    const renderDoubtCard = (doubt: Doubt) => {
        const linkedWorkItem = workItems.find(w => w.linkedDoubtId === doubt.id);

        const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

        const getDaysDuration = (start: string, end: string) => {
            const startDate = new Date(start);
            const endDate = new Date(end);
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            return Math.round(diffTime / (1000 * 60 * 60 * 24));
        };

        let timelineElement: React.ReactNode = null;
        const createdAtFormatted = formatDate(doubt.createdAt);

        if (doubt.status === 'Resolved' && doubt.resolvedAt) {
            const resolvedAtFormatted = formatDate(doubt.resolvedAt);
            const durationDays = getDaysDuration(doubt.createdAt, doubt.resolvedAt);
            const durationText = durationDays === 0 ? 'same day' : `${durationDays} day${durationDays !== 1 ? 's' : ''}`;
            timelineElement = (
                <p className="text-xs text-muted-foreground mt-1">
                    ⏳ Logged: {createdAtFormatted} → Resolved: {resolvedAtFormatted} ({durationText})
                </p>
            );
        } else {
            const today = new Date();
            const durationDays = getDaysDuration(doubt.createdAt, today.toISOString());
            const durationText = durationDays === 0 ? 'since today' : `for ${durationDays} day${durationDays !== 1 ? 's' : ''}`;
            timelineElement = (
                <p className="text-xs text-muted-foreground mt-1">
                    ⏳ Logged: {createdAtFormatted} → Open {durationText}
                </p>
            );
        }

        return (
            <div key={doubt.id} className="bg-muted/50 p-4 rounded-lg">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_STYLES[doubt.status]}`}>{doubt.status}</span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${PRIORITY_STYLES[doubt.priority]}`}>{doubt.priority} Priority</span>
                        </div>
                        <p className="font-semibold mt-2 text-foreground">{doubt.subject} {doubt.chapterName && ` - Ch ${doubt.chapterNo}: ${doubt.chapterName}`}</p>
                        {doubt.topic && <p className="text-sm text-card-foreground font-medium">Topic: {doubt.topic}</p>}
                        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{doubt.text}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-1">
                        <button onClick={() => setEditingDoubt(doubt)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-md" title="Edit Doubt"><EditIcon className="h-4 w-4" /></button>
                        <button onClick={() => onDeleteDoubt(doubt.id)} className="p-1.5 text-muted-foreground hover:bg-danger-muted hover:text-danger rounded-md" title="Delete Doubt"><DeleteIcon className="h-4 w-4" /></button>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                    <div>
                        <p className="text-xs text-muted-foreground">Origin: {doubt.origin} | Logged: {doubt.createdAt}</p>
                        {timelineElement}
                    </div>
                     <div className="flex items-center space-x-1">
                        {doubt.status === 'Resolved' ? (
                            <button
                                onClick={() => handleUndoResolve(doubt)}
                                className="p-1.5 text-muted-foreground hover:bg-muted rounded-md"
                                title="Undo Resolve"
                            >
                                <UndoIcon className="h-4 w-4" />
                            </button>
                        ) : (
                            <>
                                {doubt.status === 'Tasked' || linkedWorkItem ? (
                                    <div
                                        className="p-1.5 text-primary"
                                        title="Already sent to Work Pool"
                                    >
                                        <CheckCircleIcon className="h-4 w-4" />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleConvertToTask(doubt)}
                                        className="p-1.5 text-primary hover:bg-primary/10 rounded-md"
                                        title="Convert this doubt to a work task"
                                    >
                                        <ConvertToTaskIcon className="h-4 w-4"/>
                                    </button>
                                )}
                                <button
                                    onClick={() => handleResolve(doubt)}
                                    className="p-1.5 text-success hover:bg-success/10 rounded-md"
                                    title="Mark this doubt as resolved"
                                >
                                    <CheckSquareIcon className="h-4 w-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex justify-end" onClick={onClose}>
                <div className="w-full max-w-3xl h-full bg-card/80 backdrop-blur-lg border-l border-border shadow-2xl flex flex-col rounded-l-2xl" onClick={e => e.stopPropagation()}>
                    <header className="p-6 border-b border-border flex-shrink-0">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                    {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">{student.name}'s Doubts</h2>
                                    <p className="text-muted-foreground">{`Grade ${student.grade} • ${student.board}`}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onAddDoubt}
                                    className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-colors"
                                >
                                    <PlusIcon className="h-4 w-4" /> Add Doubt
                                </button>
                                
                                <div className="relative" ref={exportMenuRef}>
                                    <button
                                        onClick={() => setIsExportMenuOpen(prev => !prev)}
                                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-muted text-muted-foreground hover:bg-border text-sm font-semibold transition-colors"
                                    >
                                        <DownloadIcon className="h-4 w-4" />
                                        Export
                                        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isExportMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-soft-lg border border-border z-10 py-1">
                                            <button onClick={handleExportCSV} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted">
                                                <CsvIcon className="h-5 w-5 text-muted-foreground"/>
                                                Export as CSV
                                            </button>
                                            <button onClick={handleExportPDF} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted">
                                                <PdfIcon className="h-5 w-5 text-muted-foreground"/>
                                                Export as PDF
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <button onClick={onClose} className="p-2 rounded-full text-muted-foreground hover:bg-muted" aria-label="Close"><XIcon className="h-6 w-6" /></button>
                            </div>
                        </div>
                        <div className="mt-4 border-b border-border">
                            <nav className="-mb-px flex space-x-6 overflow-x-auto">
                                {(['Open', 'Tasked', 'Resolved'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {tab}
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab ? 'bg-primary/20 text-primary' : 'bg-border text-muted-foreground'}`}>
                                            {doubtCounts[tab]}
                                        </span>
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </header>

                    <div className="px-6 py-4 border-b border-border flex-shrink-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                            <div className="md:col-span-3 lg:col-span-2">
                                <label htmlFor="doubtSearch" className="block text-sm font-medium text-muted-foreground">
                                    Search Doubts
                                </label>
                                <input
                                    type="text"
                                    id="doubtSearch"
                                    name="searchQuery"
                                    value={filters.searchQuery}
                                    onChange={handleSearchChange}
                                    placeholder="Search inside doubt text..."
                                    className="mt-1 block w-full h-10 px-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                            
                            <SelectField label="Subject" name="subject" value={filters.subject} onChange={handleFilterChange} options={uniqueSubjects} />
                            
                            <SelectField label="Priority" name="priority" value={filters.priority} onChange={handleFilterChange} options={DOUBT_PRIORITIES} />
                            
                            <SelectField label="Status" name="status" value={filters.status} onChange={handleFilterChange} options={DOUBT_STATUSES} />
                            
                            <button
                                onClick={clearFilters}
                                className="w-full h-10 px-4 rounded-lg bg-muted hover:bg-border text-sm font-medium"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    <main className="flex-grow overflow-y-auto p-6 space-y-4 thin-scrollbar">
                        {filteredDoubts.length > 0 ? (
                            filteredDoubts.map(renderDoubtCard)
                        ) : (
                            <div className="text-center py-16 text-muted-foreground">
                                <h3 className="text-xl font-semibold">No doubts match your criteria.</h3>
                                <p>Try adjusting your filters or search term.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
            {editingDoubt && (
                 <DoubtForm
                    student={student}
                    doubt={editingDoubt}
                    subjects={subjects}
                    workItems={workItems}
                    onSave={onSaveDoubt}
                    onCancel={() => setEditingDoubt(null)}
                />
            )}
        </>
    );
};

export default DoubtDrawer;