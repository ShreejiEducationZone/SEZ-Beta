
import React from 'react';
import { Student, SubjectData } from '../types';
import { SUBJECT_CARD_STYLES } from '../constants';
import LockIcon from './icons/LockIcon';

interface StudentSubjectCardProps {
    student: Student;
    subjects: SubjectData[];
    onSelect: () => void;
}

const StudentSubjectCard: React.FC<StudentSubjectCardProps> = ({ student, subjects, onSelect }) => {
    const boardStyle = SUBJECT_CARD_STYLES[student.board] || SUBJECT_CARD_STYLES['GSEB'];
    const totalSubjects = subjects.length;

    return (
        <div
            onClick={onSelect}
            className={`
                relative rounded-2xl shadow-md p-4 transition-all duration-300 cursor-pointer
                border-l-4 ${boardStyle.border}
                ${student.isArchived 
                    ? 'bg-gray-50 dark:bg-gray-800/50 opacity-70' 
                    : 'bg-white dark:bg-dark-card hover:shadow-lg'}
            `}
        >
            {student.isArchived && (
                <div className="absolute top-3 right-3 text-gray-500 dark:text-gray-400" title="Archived (Read-only)">
                    <LockIcon className="h-5 w-5" />
                </div>
            )}
            
            <div className="flex flex-col h-full">
                <div>
                    <h3 className="text-base font-semibold text-gray-800 dark:text-white">{student.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{`Grade ${student.grade} • ${student.board}`}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{student.school}</p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-grow">
                    {totalSubjects > 0 ? (
                        <div className="space-y-2">
                            {subjects.slice(0, 4).map(subject => (
                                <div key={subject.subject} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                                    <span className="truncate flex-grow pr-2">{subject.subject}</span>
                                    <span className="bg-gray-100 text-gray-800 rounded-full px-2 py-0.5 text-xs font-medium dark:bg-gray-700 dark:text-gray-200 flex-shrink-0">
                                        {subject.chapters.length} chap
                                    </span>
                                </div>
                            ))}
                            {subjects.length > 4 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">+ {subjects.length - 4} more subjects...</p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">No subjects assigned.</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Click to add curriculum.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentSubjectCard;
