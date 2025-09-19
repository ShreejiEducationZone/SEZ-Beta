import React, { useState, useMemo, FC } from 'react';
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

interface DoubtDrawerProps {
    student: Student;
    doubts: Doubt[];
    subjects: SubjectData[];
    workItems: WorkItem[];
    onClose: () => void;
    onSaveDoubt: (doubt: Doubt) => void;
    onDeleteDoubt: (doubtId: string) => void;
    onSaveWorkItem: (item: WorkItem) => void;
}

const PRIORITY_STYLES: Record<DoubtPriority, string> = {
    High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const STATUS_STYLES: Record<DoubtStatus, string> = {
    Resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Open: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    Tasked: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};


const DoubtDrawer: FC<DoubtDrawerProps> = ({ student, doubts, subjects, workItems, onClose, onSaveDoubt, onDeleteDoubt, onSaveWorkItem }) => {
    const [activeTab, setActiveTab] = useState<'All' | 'Open' | 'Resolved'>('Open');
    const [editingDoubt, setEditingDoubt] = useState<Doubt | null>(null);
    const [filters, setFilters] = useState({
        subject: '',
        priority: '',
        status: '',
        searchQuery: ''
    });

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
            tempDoubts = tempDoubts.filter(d => d.status === 'Open' || d.status === 'Tasked');
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
        // Find the work item linked to this doubt
        const linkedWorkItem = workItems.find(item => item.linkedDoubtId === doubt.id && item.source === 'doubt');

        // If a linked task exists and it's not already completed, mark it as completed.
        if (linkedWorkItem && linkedWorkItem.status !== 'Completed') {
            onSaveWorkItem({ ...linkedWorkItem, status: 'Completed' });
        }

        // Then, resolve the doubt itself.
        onSaveDoubt({ ...doubt, status: 'Resolved', resolvedAt: new Date().toISOString().split('T')[0] });
    };

    const handleUndoResolve = (doubt: Doubt) => {
        const { resolvedAt, ...rest } = doubt;
        onSaveDoubt({ ...rest, status: 'Open' });
    };

    const handleConvertToTask = (doubt: Doubt) => {
        // Safeguard to prevent creating a duplicate task.
        const alreadyExists = workItems.some(item => item.linkedDoubtId === doubt.id);
        if (alreadyExists) {
            alert("This doubt has already been converted to a work task.");
            return;
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3);

        const newWorkItem: WorkItemType = {
            id: `w_${Date.now()}`,
            studentId: doubt.studentId,
            title: `Resolve Doubt: ${doubt.chapterName || doubt.subject}`,
            subject: doubt.subject,
            chapterNo: doubt.chapterNo || '',
            chapterName: doubt.chapterName || '',
            description: doubt.text,
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'Assign',
            priority: doubt.priority,
            dateCreated: new Date().toISOString().split('T')[0],
            linkedDoubtId: doubt.id,
            source: 'doubt',
        };
        onSaveWorkItem(newWorkItem);
        onSaveDoubt({ ...doubt, status: 'Tasked' });
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ⏳ Logged: {createdAtFormatted} → Resolved: {resolvedAtFormatted} ({durationText})
                </p>
            );
        } else {
            const today = new Date();
            const durationDays = getDaysDuration(doubt.createdAt, today.toISOString());
            const durationText = durationDays === 0 ? 'since today' : `for ${durationDays} day${durationDays !== 1 ? 's' : ''}`;
            timelineElement = (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ⏳ Logged: {createdAtFormatted} → Open {durationText}
                </p>
            );
        }

        return (
            <div key={doubt.id} className="bg-light-bg/50 dark:bg-dark-bg/50 p-4 rounded-lg">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_STYLES[doubt.status]}`}>{doubt.status}</span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${PRIORITY_STYLES[doubt.priority]}`}>{doubt.priority} Priority</span>
                        </div>
                        <p className="font-semibold mt-2 text-gray-800 dark:text-gray-200">{doubt.subject} {doubt.chapterName && ` - Ch ${doubt.chapterNo}: ${doubt.chapterName}`}</p>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{doubt.text}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-1">
                        <button onClick={() => setEditingDoubt(doubt)} className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md" title="Edit Doubt"><EditIcon className="h-4 w-4" /></button>
                        <button onClick={() => onDeleteDoubt(doubt.id)} className="p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 rounded-md" title="Delete Doubt"><DeleteIcon className="h-4 w-4" /></button>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Origin: {doubt.origin} | Logged: {doubt.createdAt}</p>
                        {timelineElement}
                    </div>
                     <div className="flex items-center space-x-1">
                        {doubt.status === 'Resolved' ? (
                            <button
                                onClick={() => handleUndoResolve(doubt)}
                                className="p-1.5 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                                title="Undo Resolve"
                            >
                                <UndoIcon className="h-4 w-4" />
                            </button>
                        ) : (
                            <>
                                {doubt.status === 'Tasked' || linkedWorkItem ? (
                                    <div
                                        className="p-1.5 text-blue-500"
                                        title="Already sent to Work Pool"
                                    >
                                        <CheckCircleIcon className="h-4 w-4" />
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleConvertToTask(doubt)}
                                        className="p-1.5 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md"
                                        title="Convert this doubt to a work task"
                                    >
                                        <ConvertToTaskIcon className="h-4 w-4"/>
                                    </button>
                                )}
                                <button
                                    onClick={() => handleResolve(doubt)}
                                    className="p-1.5 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md"
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
            <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-end" onClick={onClose}>
                <div className="w-full max-w-2xl h-full bg-light-card dark:bg-dark-card shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                    <header className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                    {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{student.name}'s Doubts</h2>
                                    <p className="text-gray-500 dark:text-gray-400">{`Grade ${student.grade} • ${student.board}`}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleExportCSV}
                                    className="flex items-center justify-center gap-2 h-9 px-3 rounded-md bg-green-600 text-white hover:bg-green-700 text-xs font-semibold transition-colors"
                                >
                                    📤 Export CSV
                                </button>
                                <button
                                    onClick={handleExportPDF}
                                    className="flex items-center justify-center gap-2 h-9 px-3 rounded-md bg-red-600 text-white hover:bg-red-700 text-xs font-semibold transition-colors"
                                >
                                    📄 Export PDF
                                </button>
                                <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-3xl font-light ml-2">&times;</button>
                            </div>
                        </div>
                        <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
                            <nav className="-mb-px flex space-x-6 overflow-x-auto">
                                {(['Open', 'Resolved', 'All'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </header>

                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                            <div className="md:col-span-3 lg:col-span-2">
                                <label htmlFor="doubtSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Search Doubts
                                </label>
                                <input
                                    type="text"
                                    id="doubtSearch"
                                    name="searchQuery"
                                    value={filters.searchQuery}
                                    onChange={handleSearchChange}
                                    placeholder="Search inside doubt text..."
                                    className="mt-1 block w-full h-10 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            
                            <SelectField label="Subject" name="subject" value={filters.subject} onChange={handleFilterChange} options={uniqueSubjects} />
                            
                            <SelectField label="Priority" name="priority" value={filters.priority} onChange={handleFilterChange} options={DOUBT_PRIORITIES} />
                            
                            <SelectField label="Status" name="status" value={filters.status} onChange={handleFilterChange} options={DOUBT_STATUSES} />
                            
                            <button
                                onClick={clearFilters}
                                className="w-full h-10 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-medium"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    <main className="flex-grow overflow-y-auto p-6 space-y-4">
                        {filteredDoubts.length > 0 ? (
                            filteredDoubts.map(renderDoubtCard)
                        ) : (
                            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
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