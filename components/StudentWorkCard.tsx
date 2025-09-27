


import React, { useMemo } from 'react';
import { Student, WorkItem } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import { SUBJECT_CARD_STYLES } from '../constants';
import PinIcon from './icons/PinIcon';

interface StudentWorkCardProps {
    student: Student;
    workItems: WorkItem[];
    onAddWork: () => void;
    onViewWork: () => void;
}

const StudentWorkCard: React.FC<StudentWorkCardProps> = ({ student, workItems, onAddWork, onViewWork }) => {
    const boardStyle = SUBJECT_CARD_STYLES[student.board] || SUBJECT_CARD_STYLES['GSEB'];

    const workInsights = useMemo(() => {
        const pendingCount = workItems.filter(item => item.status === 'Assign' || item.status === 'Pending').length;
        const completedCount = workItems.filter(item => item.status === 'Completed').length;
        
        const todayStr = new Date().toISOString().split('T')[0];
        const isOverdue = workItems.some(item => item.status !== 'Completed' && item.dueDate < todayStr);

        const tasksForTooltip = [...workItems]
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 2);
            
        return { pendingCount, completedCount, isOverdue, tasksForTooltip };
    }, [workItems]);

    return (
        <div
            onClick={onViewWork}
            className={`
                relative group cursor-pointer
                rounded-2xl shadow-md p-4 transition-all duration-300 flex flex-col
                border-l-4 ${boardStyle.border}
                ${student.isArchived 
                    ? 'bg-gray-50 dark:bg-gray-800/50 opacity-70' 
                    : 'bg-white dark:bg-dark-card'}
            `}
        >
            <div className="flex items-start space-x-4">
                 <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                    {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                </div>
                <div>
                    <h3 className="text-base font-semibold text-gray-800 dark:text-white">{student.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{`Grade ${student.grade} • ${student.board}`}</p>
                     <p className="text-sm text-gray-500 dark:text-gray-400">{student.school}</p>
                </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-grow">
                <div className="flex justify-between items-center mb-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        <span>🟠 Pending: {workInsights.pendingCount}</span>
                        <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                        <span>✅ Done: {workInsights.completedCount}</span>
                    </div>
                    {workInsights.isOverdue && (
                        <span className="px-2 py-0.5 text-xs font-semibold text-red-800 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-full">
                            Overdue!
                        </span>
                    )}
                </div>
                
                <div className="space-y-1.5 min-h-[44px]">
                    {workInsights.tasksForTooltip.length > 0 ? (
                        workInsights.tasksForTooltip.map(item => (
                            <div key={item.id} className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                                <PinIcon className="h-4 w-4 mr-2 mt-0.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                <span className="truncate" title={item.title}>{item.title}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-center text-gray-500 italic pt-2">No work assigned yet.</p>
                    )}
                </div>
            </div>

            <div className="mt-4">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddWork();
                    }}
                    disabled={student.isArchived}
                    className="w-full h-10 px-4 rounded-md bg-brand-blue text-white hover:bg-blue-600 text-sm font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    + Add Work
                </button>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 w-full left-0 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                <div className="bg-gray-800 dark:bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 w-full">
                    <h4 className="font-bold text-sm border-b border-gray-600 pb-1 mb-2">Upcoming Tasks</h4>
                    {workInsights.tasksForTooltip.length > 0 ? (
                        <ul className="space-y-1.5">
                            {workInsights.tasksForTooltip.map(item => (
                                <li key={item.id}>
                                    <p className="font-semibold truncate" title={item.title}>📝 {item.title}</p>
                                    <div className="flex justify-between items-center text-gray-300 mt-1">
                                      <span>📆 Due: {new Date(item.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                      <span>✅ Status: {item.status}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400">No tasks assigned.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentWorkCard;