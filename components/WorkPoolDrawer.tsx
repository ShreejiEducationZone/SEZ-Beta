import React, { useState, useMemo, FC, useRef, useEffect } from 'react';
import { Student, WorkItem, WorkStatus, WorkPriority } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';
import SelectField from './form/SelectField';
import { FaYoutube } from 'react-icons/fa';
import { WORK_PRIORITIES } from '../constants';
import PlusIcon from './icons/PlusIcon';
import DownloadIcon from './icons/DownloadIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import CsvIcon from './icons/CsvIcon';
import PdfIcon from './icons/PdfIcon';
import XIcon from './icons/XIcon';
import SheetsIcon from './icons/SheetsIcon';

const PRIORITY_STYLES: Record<WorkPriority, string> = {
    High: 'bg-danger-muted text-danger-muted-foreground',
    Medium: 'bg-warning-muted text-warning-muted-foreground',
    Low: 'bg-info-muted text-info-muted-foreground',
};

const STATUS_STYLES: Record<WorkStatus, string> = {
    Completed: 'bg-success-muted text-success-muted-foreground',
    Pending: 'bg-warning-muted text-warning-muted-foreground',
    Assign: 'bg-muted text-muted-foreground',
};

interface WorkPoolDrawerProps {
    student: Student;
    workItems: WorkItem[];
    onClose: () => void;
    onEditWorkItem: (item: WorkItem) => void;
    onDeleteWorkItem: (id: string) => void;
    onAddWork: () => void;
}

const WorkItemCard: FC<{ item: WorkItem; onEdit: (item: WorkItem) => void; onDelete: (id: string) => void; }> = ({ item, onEdit, onDelete }) => {
    const isVideo = item.links && item.links.length > 0 && item.links[0].includes('youtu');

    return (
        <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_STYLES[item.status]}`}>{item.status}</span>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${PRIORITY_STYLES[item.priority]}`}>{item.priority} Priority</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isVideo ? (
                            <a href={item.links![0]} target="_blank" rel="noopener noreferrer" className="group">
                                <div className="flex items-center gap-2">
                                    <FaYoutube className="h-5 w-5 text-red-500 flex-shrink-0" />
                                    <span className="font-semibold text-foreground group-hover:underline group-hover:text-primary">{item.title}</span>
                                </div>
                            </a>
                        ) : (
                            <p className="font-semibold text-foreground">{item.title}</p>
                        )}
                        {item.source === 'sheets' && (
                            <span title="Created via Sheets" className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-success-muted text-success-muted-foreground">
                                <SheetsIcon className="h-3 w-3" />
                                Sheets
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        {item.subject} - Ch {item.chapterNo}: {item.chapterName}
                        {item.topic && <span className="font-semibold"> • {item.topic}</span>}
                    </p>
                    {item.source === 'sheets' && item.sheetTasks && item.sheetTasks.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.sheetTasks.map(taskName => (
                                <span key={taskName} className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                    {taskName}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex-shrink-0 flex items-center space-x-1">
                    <button onClick={() => onEdit(item)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-md" title="Edit Work"><EditIcon className="h-4 w-4" /></button>
                    <button onClick={() => onDelete(item.id)} className="p-1.5 text-muted-foreground hover:bg-danger-muted hover:text-danger rounded-md" title="Delete Work"><DeleteIcon className="h-4 w-4" /></button>
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                Due: {new Date(item.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
        </div>
    );
};

const WorkPoolDrawer: React.FC<WorkPoolDrawerProps> = ({ student, workItems, onClose, onEditWorkItem, onDeleteWorkItem, onAddWork }) => {
    
    const [activeTab, setActiveTab] = useState<'Pending' | 'Completed' | 'All'>('Pending');
    const [filters, setFilters] = useState({ subject: '', priority: '', searchQuery: '' });
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

    const uniqueSubjects = useMemo(() => Array.from(new Set(workItems.map(item => item.subject))), [workItems]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
    };

    const clearFilters = () => {
        setFilters({ subject: '', priority: '', searchQuery: '' });
    };

    const filteredWorkItems = useMemo(() => {
        let tempItems = [...workItems];

        if (activeTab === 'Pending') {
            tempItems = tempItems.filter(item => item.status === 'Assign' || item.status === 'Pending');
        } else if (activeTab === 'Completed') {
            tempItems = tempItems.filter(item => item.status === 'Completed');
        }

        if (filters.subject) {
            tempItems = tempItems.filter(item => item.subject === filters.subject);
        }
        if (filters.priority) {
            tempItems = tempItems.filter(item => item.priority === filters.priority);
        }
        if (filters.searchQuery) {
            const lowercasedQuery = filters.searchQuery.toLowerCase();
            tempItems = tempItems.filter(item => item.title.toLowerCase().includes(lowercasedQuery));
        }

        return tempItems.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [workItems, activeTab, filters]);
    
    const handleExportCSV = () => {
        setIsExportMenuOpen(false);
        const headers = ['Title', 'Subject', 'Chapter', 'Topic', 'Due Date', 'Status', 'Priority'];
        const csvRows = [headers.join(',')];

        filteredWorkItems.forEach(item => {
            const row = [
                `"${item.title.replace(/"/g, '""')}"`,
                `"${item.subject}"`,
                `"${item.chapterNo} - ${item.chapterName}"`,
                `"${item.topic || ''}"`,
                `"${item.dueDate}"`,
                `"${item.status}"`,
                `"${item.priority}"`,
            ].join(',');
            csvRows.push(row);
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const today = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `Work_Report_${student.name.replace(/\s/g, '_')}_${today}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        setIsExportMenuOpen(false);
        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF();
        
        const today = new Date().toLocaleDateString('en-GB');
        doc.setFontSize(16);
        doc.text(`Work Report for ${student.name}`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated on ${today}`, 14, 25);

        const tableColumn = ["Title", "Subject", "Due Date", "Status", "Priority"];
        const tableRows = filteredWorkItems.map(item => [
            item.title,
            item.subject,
            item.dueDate,
            item.status,
            item.priority,
        ]);

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [3, 105, 161] },
        });
        
        doc.save(`Work_Report_${student.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex justify-end" onClick={onClose}>
            <div className="w-full max-w-3xl h-full bg-card/80 dark:bg-card/70 backdrop-blur-lg border-l border-border shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-border flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">{student.name}'s Work Pool</h2>
                                <p className="text-muted-foreground">Grade {student.grade} • {student.board}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onAddWork}
                                className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-colors"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Add Work
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
                            {(['Pending', 'Completed', 'All'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>
                </header>
                
                <div className="px-6 py-4 border-b border-border flex-shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <div className="lg:col-span-2">
                             <label htmlFor="work-search" className="block text-sm font-medium text-muted-foreground">Search Title</label>
                             <input
                                type="text"
                                id="work-search"
                                value={filters.searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Search by work title..."
                                className="mt-1 block w-full h-10 px-3 rounded-lg border border-border bg-background"
                             />
                        </div>
                        <SelectField label="Subject" name="subject" value={filters.subject} onChange={handleFilterChange} options={uniqueSubjects} />
                        <div className="flex items-end gap-2">
                            <SelectField label="Priority" name="priority" value={filters.priority} onChange={handleFilterChange} options={WORK_PRIORITIES} />
                             <button onClick={clearFilters} className="h-10 px-4 rounded-lg bg-muted text-muted-foreground hover:bg-border text-sm font-medium">Clear</button>
                        </div>
                    </div>
                </div>

                <main className="flex-grow overflow-y-auto p-6 space-y-4 thin-scrollbar">
                    {filteredWorkItems.length > 0 ? (
                        filteredWorkItems.map(item => (
                           <WorkItemCard key={item.id} item={item} onEdit={onEditWorkItem} onDelete={onDeleteWorkItem} />
                        ))
                    ) : (
                        <div className="text-center py-16 text-muted-foreground">
                            <h3 className="text-xl font-semibold">No work items match your criteria.</h3>
                            <p>Try adjusting your filters or search term.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default WorkPoolDrawer;