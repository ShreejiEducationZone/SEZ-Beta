
import React from 'react';
import { Student } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import { SUBJECT_CARD_STYLES } from '../constants';

type SubjectProgressInfo = {
    subject: string;
    completed: number;
    total: number;
};

interface StudentProgressCardProps {
    student: Student;
    overallPercentage: number;
    subjectProgress: SubjectProgressInfo[];
    lastUpdate: string | null;
    onViewTimeline: () => void;
}

const StudentProgressCard: React.FC<StudentProgressCardProps> = ({ student, overallPercentage, subjectProgress, lastUpdate, onViewTimeline }) => {
    const boardStyle = SUBJECT_CARD_STYLES[student.board] || SUBJECT_CARD_STYLES['GSEB'];

    const formattedLastUpdate = lastUpdate
        ? new Date(lastUpdate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        : null;

    return (
        <div className={`bg-light-card dark:bg-dark-card rounded-2xl shadow-md transition-all duration-300 flex flex-col border-l-4 ${boardStyle.border}`}>
            <div className="p-4 flex flex-col h-full">
                <div className="flex items-start space-x-4">
                     <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{student.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Grade {student.grade} • {student.board}</p>
                    </div>
                </div>

                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 flex-grow divide-y divide-gray-200 dark:divide-gray-700">
                    {subjectProgress.slice(0, 3).map((sub) => (
                         <div key={sub.subject} className="py-3 flex justify-between items-center">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{sub.subject}</span>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{sub.completed}/{sub.total} done</p>
                                {formattedLastUpdate && <p className="text-xs text-gray-500">Last updated: {formattedLastUpdate}</p>}
                            </div>
                        </div>
                    ))}
                    {subjectProgress.length === 0 && (
                         <p className="text-sm text-gray-500 italic text-center py-4">No subjects assigned.</p>
                    )}
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                         <div>
                            <span className="text-sm font-semibold text-brand-blue">{overallPercentage}%</span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">Syllabus Done</span>
                        </div>
                        <button
                            onClick={onViewTimeline}
                            className="h-10 px-4 rounded-md bg-brand-blue text-white hover:bg-blue-600 text-sm font-semibold transition-colors"
                        >
                            View Timeline
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProgressCard;
