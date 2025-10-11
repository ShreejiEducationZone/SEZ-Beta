import React from 'react';
import { WorkItem, WorkPriority } from '../../types';
import { FaYoutube } from 'react-icons/fa';
import SheetsIcon from '../icons/SheetsIcon';
import TestIcon from '../icons/TestIcon';

const PRIORITY_STYLES: Record<WorkPriority, string> = {
    High: 'bg-danger-muted text-danger-muted-foreground',
    Medium: 'bg-warning-muted text-warning-muted-foreground',
    Low: 'bg-info-muted text-info-muted-foreground',
};

const SPWorkItemCard: React.FC<{ item: WorkItem }> = ({ item }) => {
    const isVideo = item.links && item.links.length > 0 && item.links[0].includes('youtu');
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(item.dueDate);
    const isOverdue = dueDate < today && item.status !== 'Completed';

    return (
        <div className={`bg-card rounded-2xl shadow-soft border p-4 transition-all ${isOverdue ? 'border-danger' : 'border-border'}`}>
            <div className="flex justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                         <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${PRIORITY_STYLES[item.priority]}`}>{item.priority} Priority</span>
                         {item.source === 'sheets' && (
                            <span title="From Sheets" className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-success-muted text-success-muted-foreground">
                                <SheetsIcon className="h-3 w-3" /> Sheets
                            </span>
                        )}
                        {item.source === 'test' && (
                            <span title="From Test" className="flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-md bg-accent-muted text-accent-muted-foreground">
                                <TestIcon className="h-3 w-3" /> Test
                            </span>
                        )}
                    </div>
                     <div className="flex items-center gap-2">
                        {isVideo ? (
                            <a href={item.links![0]} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2">
                                <FaYoutube className="h-5 w-5 text-red-500 flex-shrink-0" />
                                <span className="font-bold text-lg text-foreground group-hover:underline group-hover:text-primary">{item.title}</span>
                            </a>
                        ) : (
                            <p className="font-bold text-lg text-foreground">{item.title}</p>
                        )}
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-muted-foreground">Due Date</p>
                    <p className={`font-bold ${isOverdue ? 'text-danger' : 'text-foreground'}`}>
                        {new Date(item.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                </div>
            </div>
             <div className="mt-2 pt-3 border-t border-border space-y-2">
                 <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-card-foreground">{item.subject}</span> - Ch {item.chapterNo}: {item.chapterName}
                    {item.topic && <span className="font-semibold"> • {item.topic}</span>}
                </p>
                <p className="text-sm text-card-foreground whitespace-pre-wrap">{item.description}</p>
                 {item.source === 'sheets' && item.sheetTasks && item.sheetTasks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                        {item.sheetTasks.map(taskName => (
                            <span key={taskName} className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                {taskName}
                            </span>
                        ))}
                    </div>
                )}
             </div>
        </div>
    );
};

export default SPWorkItemCard;