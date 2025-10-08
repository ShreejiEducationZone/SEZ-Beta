import React from 'react';
import { WorkItem, Student, WorkStatus, WorkPriority } from '../types';
import { FaYoutube } from 'react-icons/fa';

interface WorkItemDetailModalProps {
    item: WorkItem;
    student: Student;
    onClose: () => void;
}

const PRIORITY_STYLES: Record<WorkPriority, string> = {
    High: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
};

const STATUS_STYLES: Record<WorkStatus, string> = {
    Completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    Pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    Assign: 'bg-muted text-muted-foreground',
};

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <div className="text-foreground">{children}</div>
    </div>
);

const WorkItemDetailModal: React.FC<WorkItemDetailModalProps> = ({ item, student, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card/80 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto thin-scrollbar" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">{item.title}</h2>
                        <p className="text-muted-foreground">For {student.name}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-3xl font-light">&times;</button>
                </div>
                
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <DetailRow label="Due Date">
                        <p>{new Date(item.dueDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </DetailRow>
                     <DetailRow label="Status">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[item.status]}`}>
                            {item.status}
                        </span>
                    </DetailRow>
                    <DetailRow label="Priority">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_STYLES[item.priority]}`}>
                            {item.priority}
                        </span>
                    </DetailRow>
                </div>

                <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <DetailRow label="Subject">
                        <p>{item.subject}</p>
                    </DetailRow>
                    <DetailRow label="Chapter">
                        <p>Ch {item.chapterNo} - {item.chapterName}</p>
                    </DetailRow>
                </div>

                {item.topic && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <DetailRow label="Topic">
                            <p>{item.topic}</p>
                        </DetailRow>
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-border">
                    <DetailRow label="Description">
                        <p className="whitespace-pre-wrap">{item.description}</p>
                    </DetailRow>
                </div>

                {item.links && item.links.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <DetailRow label="Attached Links">
                            <div className="space-y-2 mt-1">
                                {item.links.map((link, index) => (
                                    <a 
                                        key={index}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                                    >
                                        <FaYoutube className="h-6 w-6 text-red-500 flex-shrink-0" />
                                        <span className="text-sm font-medium text-primary group-hover:underline truncate">{link}</span>
                                    </a>
                                ))}
                            </div>
                        </DetailRow>
                    </div>
                )}
                
                 <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkItemDetailModal;