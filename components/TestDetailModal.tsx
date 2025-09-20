import React from 'react';
import { Test, Student, TestPriority, TestStatus } from '../types';

interface TestDetailModalProps {
    test: Test;
    student: Student;
    onClose: () => void;
    onAddMarking: (test: Test) => void;
    onEdit: (test: Test) => void;
    onDelete: (testId: string) => void;
}

const PRIORITY_STYLES: Record<TestPriority, string> = {
    High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const STATUS_STYLES: Record<TestStatus, string> = {
    Completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    Absent: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const DetailRow: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <div className={className}>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</p>
        <div className="text-gray-800 dark:text-gray-200 mt-1">{children}</div>
    </div>
);


const TestDetailModal: React.FC<TestDetailModalProps> = ({ test, student, onClose, onAddMarking, onEdit, onDelete }) => {
    
    const scorePercentage = (test.marksObtained != null && test.totalMarks != null && test.totalMarks > 0)
        ? Math.round((test.marksObtained / test.totalMarks) * 100)
        : null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto thin-scrollbar" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{test.title}</h2>
                        <p className="text-gray-600 dark:text-gray-400">For {student.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-3xl font-light">&times;</button>
                </div>
                
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DetailRow label="Subject"><p>{test.subject}</p></DetailRow>
                    <DetailRow label="Test Date"><p>{new Date(test.testDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p></DetailRow>
                    <DetailRow label="Status"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[test.status]}`}>{test.status}</span></DetailRow>
                    <DetailRow label="Priority"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_STYLES[test.priority]}`}>{test.priority}</span></DetailRow>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <DetailRow label="Syllabus / Chapters">
                        <ul className="list-disc list-inside space-y-1">
                            {test.chapters.map(c => <li key={`${c.no}-${c.name}`}>{c.name} (Ch. {c.no})</li>)}
                        </ul>
                    </DetailRow>
                </div>

                {test.status === 'Completed' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                        <div className="bg-gray-50 dark:bg-dark-bg/50 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2 text-center">Performance Summary</h3>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <DetailRow label="Score">
                                    <p className="text-xl font-bold">{test.marksObtained} / {test.totalMarks}</p>
                                </DetailRow>
                                <DetailRow label="Percentage">
                                    <p className="text-xl font-bold text-brand-blue">{scorePercentage}%</p>
                                </DetailRow>
                                <DetailRow label="Test Type"><p>{test.testType || 'N/A'}</p></DetailRow>
                                <DetailRow label="Retest?"><p className={`font-bold ${test.retestRequired === 'Yes' ? 'text-red-500' : 'text-green-500'}`}>{test.retestRequired || 'N/A'}</p></DetailRow>
                            </div>
                        </div>
                        
                        <DetailRow label="Mistake Analysis">
                            {test.mistakeTypes && test.mistakeTypes.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {test.mistakeTypes.map(type => <span key={type} className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">{type}</span>)}
                                </div>
                            ) : <p className="text-sm italic text-gray-500">No mistake types logged.</p>}
                        </DetailRow>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailRow label="Strong Area"><p className="whitespace-pre-wrap">{test.strongArea || 'N/A'}</p></DetailRow>
                            <DetailRow label="Weak Area"><p className="whitespace-pre-wrap">{test.weakArea || 'N/A'}</p></DetailRow>
                        </div>
                        <DetailRow label="Remarks"><p className="whitespace-pre-wrap">{test.remarks || 'N/A'}</p></DetailRow>
                    </div>
                )}
                
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center gap-3">
                    <button onClick={onClose} className="py-2 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">
                        Close
                    </button>
                    <button onClick={() => onDelete(test.id)} className="h-10 px-4 rounded-md bg-red-600 text-white hover:bg-red-700 text-sm font-semibold">
                        Delete
                    </button>
                     <button onClick={() => onEdit(test)} className="h-10 px-4 rounded-md bg-gray-700 text-white hover:bg-gray-800 dark:bg-gray-500 dark:hover:bg-gray-400 text-sm font-semibold">
                        Edit Test
                    </button>
                    {test.status === 'Upcoming' && (
                        <button onClick={() => onAddMarking(test)} className="h-10 px-4 rounded-md bg-brand-blue text-white hover:bg-blue-600 text-sm font-semibold">
                            + Add Marking
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestDetailModal;