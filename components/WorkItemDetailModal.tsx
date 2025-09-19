
import React from 'react';
import { WorkItem, Student, WorkStatus, WorkPriority } from '../types';

interface WorkItemDetailModalProps {
    item: WorkItem;
    student: Student;
    onClose: () => void;
}

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

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</p>
        <div className="text-gray-800 dark:text-gray-200">{children}</div>
    </div>
);

const WorkItemDetailModal: React.FC<WorkItemDetailModalProps> = ({ item, student, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-lg p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{item.title}</h2>
                        <p className="text-gray-600 dark:text-gray-400">For {student.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-3xl font-light">&times;</button>
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

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <DetailRow label="Subject">
                        <p>{item.subject}</p>
                    </DetailRow>
                    <DetailRow label="Chapter">
                        <p>Ch {item.chapterNo} - {item.chapterName}</p>
                    </DetailRow>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <DetailRow label="Description">
                        <p className="whitespace-pre-wrap">{item.description}</p>
                    </DetailRow>
                </div>
                
                 <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="py-2 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkItemDetailModal;
