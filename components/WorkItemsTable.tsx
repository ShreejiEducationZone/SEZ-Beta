import React, { useMemo } from 'react';
import { WorkItem, Student, WorkStatus, WorkPriority, WorkHealthStatus } from '../types';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';

interface WorkItemsTableProps {
    workItems: WorkItem[];
    students: Student[];
    workHealthByStudent: Record<string, { health: WorkHealthStatus; pending: number; overdue: number }>;
    onEdit: (item: WorkItem) => void;
    onDelete: (id: string) => void;
}

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

const HEALTH_STYLES: Record<WorkHealthStatus, string> = {
    Healthy: 'bg-success-muted text-success-muted-foreground',
    Warning: 'bg-warning-muted text-warning-muted-foreground',
    Critical: 'bg-danger-muted text-danger-muted-foreground',
};


const WorkItemsTable: React.FC<WorkItemsTableProps> = ({ workItems, students, workHealthByStudent, onEdit, onDelete }) => {
    
    const getStudentName = (studentId: string) => {
        return students.find(s => s.id === studentId)?.name || 'Unknown';
    };

    const HealthBadge: React.FC<{ healthInfo: { health: WorkHealthStatus; pending: number; overdue: number } }> = ({ healthInfo }) => {
        if (!healthInfo) return null;
        
        const { health, pending, overdue } = healthInfo;
        const tooltipText = `${pending} pending, ${overdue} overdue${health === 'Critical' || health === 'Warning' ? ' – action needed' : ''}`;
        
        return (
            <span
                title={tooltipText}
                className={`px-2 py-1 text-xs font-bold rounded-full ${HEALTH_STYLES[health]}`}
            >
                {health}
            </span>
        );
    };

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);

    const sortedWorkItems = useMemo(() => {
        return [...workItems].sort((a, b) => {
            const nameA = studentMap.get(a.studentId) || '';
            const nameB = studentMap.get(b.studentId) || '';
            if (nameA.localeCompare(nameB) !== 0) {
                return nameA.localeCompare(nameB);
            }
            return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
        });
    }, [workItems, studentMap]);
    
    const handleExportCSV = () => {
        const headers = ['Student Name', 'Title', 'Subject', 'Chapter', 'Status', 'Priority', 'Due Date'];
        const csvRows = [headers.join(',')];

        sortedWorkItems.forEach(item => {
            const studentName = getStudentName(item.studentId);
            const chapter = `Ch ${item.chapterNo} - ${item.chapterName}`;
            const row = [
                `"${studentName}"`,
                `"${item.title.replace(/"/g, '""')}"`, // Escape double quotes
                `"${item.subject}"`,
                `"${chapter}"`,
                `"${item.status}"`,
                `"${item.priority}"`,
                `"${item.dueDate}"`,
            ].join(',');
            csvRows.push(row);
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const today = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `Work_Report_${today}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF();
        
        const today = new Date().toLocaleDateString('en-GB');
        const title = `Work Pool Report – Generated on ${today}`;

        doc.setFontSize(16);
        doc.text(title, 14, 20);

        const tableColumn = ["Student Name", "Title", "Subject", "Chapter", "Due Date", "Status", "Priority"];
        const tableRows: (string | number)[][] = [];

        sortedWorkItems.forEach(item => {
            const studentName = getStudentName(item.studentId);
            const chapter = `Ch ${item.chapterNo} - ${item.chapterName}`;
            const workData = [
                studentName,
                item.title,
                item.subject,
                chapter,
                item.dueDate,
                item.status,
                item.priority,
            ];
            tableRows.push(workData);
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 30,
            theme: 'grid',
            headStyles: { fillColor: [3, 105, 161] },
            styles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 25 },
                3: { cellWidth: 30 },
                4: { cellWidth: 20 },
                5: { cellWidth: 20 },
                6: { cellWidth: 20 },
            }
        });

        doc.save(`Work_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    let lastStudentId: string | null = null;

    return (
        <div className="bg-card p-6 rounded-2xl shadow-soft border border-border">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">All Work Items</h3>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-success-muted text-success-muted-foreground hover:bg-success-muted/80 text-sm font-semibold transition-colors"
                    >
                        📤 Export CSV
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-danger-muted text-danger-muted-foreground hover:bg-danger-muted/80 text-sm font-semibold transition-colors"
                    >
                        📄 Export PDF
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto thin-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
                        <tr>
                            <th scope="col" className="px-4 py-3">Student</th>
                            <th scope="col" className="px-4 py-3">Title</th>
                            <th scope="col" className="px-4 py-3">Due Date</th>
                            <th scope="col" className="px-4 py-3">Status</th>
                            <th scope="col" className="px-4 py-3">Priority</th>
                            <th scope="col" className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedWorkItems.length > 0 ? sortedWorkItems.map((item) => {
                            const showStudentInfo = item.studentId !== lastStudentId;
                            lastStudentId = item.studentId;
                            return (
                                <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap align-top">
                                        {showStudentInfo && (
                                            <div className="flex items-center gap-2">
                                                <span>{getStudentName(item.studentId)}</span>
                                                <HealthBadge healthInfo={workHealthByStudent[item.studentId]} />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <div className="font-medium">{item.title}</div>
                                            {item.source === 'syllabus' && (
                                                <span 
                                                    title="Auto-generated from Syllabus Progress"
                                                    className="px-2 py-0.5 text-xs font-semibold rounded-md bg-info-muted text-info-muted-foreground"
                                                >
                                                    Syllabus
                                                </span>
                                            )}
                                            {item.source === 'doubt' && (
                                                <span 
                                                    title="Created via Doubt Box"
                                                    className="px-2 py-0.5 text-xs font-semibold rounded-md bg-warning-muted text-warning-muted-foreground"
                                                >
                                                    Doubt Box
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.subject} - Ch {item.chapterNo}
                                            {item.topic && <span className="font-medium"> - {item.topic}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground align-top">{item.dueDate}</td>
                                    <td className="px-4 py-3 align-top">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[item.status]}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_STYLES[item.priority]}`}>
                                            {item.priority}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right align-top">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => onEdit(item)} title="Edit Item" className="p-1.5 rounded text-muted-foreground hover:bg-muted">
                                                <EditIcon className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => onDelete(item.id)} title="Delete Item" className="p-1.5 rounded text-muted-foreground hover:text-danger hover:bg-danger-muted">
                                                <DeleteIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={6} className="text-center py-10 text-muted-foreground">
                                    No work items found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WorkItemsTable;