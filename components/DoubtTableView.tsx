

import React, { useMemo } from 'react';
import { Doubt, Student, WorkItem, DoubtPriority, DoubtStatus } from '../types';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';
import CheckSquareIcon from './icons/CheckSquareIcon';

interface DoubtTableViewProps {
    doubts: Doubt[];
    students: Student[];
    workItems: WorkItem[];
    onEdit: (doubt: Doubt) => void;
    onDelete: (doubtId: string) => void;
    onResolve: (doubt: Doubt) => void;
    onViewTask: (workItem: WorkItem) => void;
    onViewDetails: (doubt: Doubt) => void;
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

const DoubtTableView: React.FC<DoubtTableViewProps> = ({ doubts, students, workItems, onEdit, onDelete, onResolve, onViewTask, onViewDetails }) => {

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s.name])), [students]);

    const sortedDoubts = useMemo(() => {
        return [...doubts].sort((a, b) => {
            const nameA = studentMap.get(a.studentId) || '';
            const nameB = studentMap.get(b.studentId) || '';
            if (nameA.localeCompare(nameB) !== 0) {
                return nameA.localeCompare(nameB);
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [doubts, studentMap]);

    let lastStudentId: string | null = null;

    return (
        <div className="bg-card p-6 rounded-2xl shadow-soft border border-border">
            <h3 className="text-xl font-bold mb-4">All Doubts</h3>
            <div className="overflow-x-auto thin-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
                        <tr>
                            <th scope="col" className="px-4 py-3">Student</th>
                            <th scope="col" className="px-4 py-3">Subject & Chapter</th>
                            <th scope="col" className="px-4 py-3">Doubt</th>
                            <th scope="col" className="px-4 py-3">Priority</th>
                            <th scope="col" className="px-4 py-3">Status</th>
                            <th scope="col" className="px-4 py-3">Origin</th>
                            <th scope="col" className="px-4 py-3">Date</th>
                            <th scope="col" className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDoubts.length > 0 ? sortedDoubts.map((doubt) => {
                             const showStudentInfo = doubt.studentId !== lastStudentId;
                             lastStudentId = doubt.studentId;
                             const linkedWorkItem = workItems.find(w => w.linkedDoubtId === doubt.id);
                             return (
                                <tr key={doubt.id} className="border-b border-border hover:bg-muted/50 cursor-pointer" onClick={() => onViewDetails(doubt)}>
                                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap align-top">
                                        {showStudentInfo && (studentMap.get(doubt.studentId) || 'Unknown')}
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="font-medium">{doubt.subject}</div>
                                        {doubt.chapterName && (
                                            <div className="text-xs text-muted-foreground">Ch {doubt.chapterNo}: {doubt.chapterName}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 align-top max-w-xs" title={doubt.text}>
                                        <p className="truncate">
                                            {doubt.text}
                                        </p>
                                        {doubt.topic && <p className="text-xs text-muted-foreground/80 truncate font-semibold">Topic: {doubt.topic}</p>}
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_STYLES[doubt.priority]}`}>
                                            {doubt.priority}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[doubt.status]}`}>
                                            {doubt.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground align-top">{doubt.origin}</td>
                                    <td className="px-4 py-3 text-muted-foreground align-top">{doubt.createdAt}</td>
                                    <td className="px-4 py-3 text-right align-top">
                                        <div className="flex items-center justify-end space-x-2">
                                            {linkedWorkItem && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onViewTask(linkedWorkItem); }}
                                                    title={`Status: ${linkedWorkItem.status} | Due: ${new Date(linkedWorkItem.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                                                    className="px-2 py-1 text-xs font-semibold rounded-md bg-muted text-muted-foreground hover:bg-border transition-colors"
                                                >
                                                    View Task
                                                </button>
                                            )}
                                            {doubt.status !== 'Resolved' && (
                                                <button onClick={(e) => { e.stopPropagation(); onResolve(doubt); }} title="Resolve Doubt" className="p-1.5 rounded text-muted-foreground hover:bg-muted">
                                                    <CheckSquareIcon className="h-4 w-4 text-success" />
                                                </button>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); onEdit(doubt); }} title="Edit Doubt" className="p-1.5 rounded text-muted-foreground hover:bg-muted">
                                                <EditIcon className="h-4 w-4" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); onDelete(doubt.id); }} title="Delete Doubt" className="p-1.5 rounded text-muted-foreground hover:text-danger hover:bg-danger-muted">
                                                <DeleteIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                             );
                        }) : (
                            <tr>
                                <td colSpan={8} className="text-center py-10 text-muted-foreground">
                                    No doubts found for the selected filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DoubtTableView;