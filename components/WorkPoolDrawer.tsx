import React, { useState, useMemo } from 'react';
import { Student, WorkItem, WorkStatus, WorkPriority } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';

const PRIORITY_STYLES: Record<WorkPriority, string> = {
    High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const STATUS_STYLES: Record<WorkStatus, string> = {
    Completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    Assign: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

interface WorkPoolDrawerProps {
    student: Student;
    workItems: WorkItem[];
    onClose: () => void;
    onEditWorkItem: (item: WorkItem) => void;
    onDeleteWorkItem: (id: string) => void;
    onAddWork: () => void;
}

const WorkPoolDrawer: React.FC<WorkPoolDrawerProps> = ({ student, workItems, onClose, onEditWorkItem, onDeleteWorkItem, onAddWork }) => {
    
    const sortedWorkItems = [...workItems].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-end" onClick={onClose}>
            <div className="w-full max-w-3xl h-full bg-light-card dark:bg-dark-card shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <header className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{student.name}'s Work Pool</h2>
                                <p className="text-gray-500 dark:text-gray-400">Grade {student.grade} • {student.board}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <button onClick={onAddWork} className="bg-brand-blue text-white h-10 px-4 rounded-md hover:bg-blue-600 text-sm font-semibold">
                                + Add Work
                            </button>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-3xl font-light">&times;</button>
                        </div>
                    </div>
                </header>

                {/* Main Content (Table) */}
                <main className="flex-grow overflow-y-auto p-6">
                    {sortedWorkItems.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-white/10 text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">Title</th>
                                        <th className="px-4 py-3">Due Date</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Priority</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedWorkItems.map(item => (
                                        <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5">
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{item.title}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{item.subject} - Ch {item.chapterNo}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.dueDate}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[item.status]}`}>{item.status}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_STYLES[item.priority]}`}>{item.priority}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button onClick={() => onEditWorkItem(item)} title="Edit Item" className="p-1.5 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
                                                        <EditIcon className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => onDeleteWorkItem(item.id)} title="Delete Item" className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50">
                                                        <DeleteIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                            <h3 className="text-xl font-semibold">No work items found for {student.name}.</h3>
                            <p>Click "+ Add Work" to assign a new task.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default WorkPoolDrawer;