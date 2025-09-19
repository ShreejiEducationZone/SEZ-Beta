
import React, { useMemo } from 'react';
import { Student, Doubt } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import { SUBJECT_CARD_STYLES } from '../constants';

interface StudentDoubtCardProps {
    student: Student;
    doubts: Doubt[];
    onAddDoubt: () => void;
    onViewDoubts: () => void;
}

const StudentDoubtCard: React.FC<StudentDoubtCardProps> = ({ student, doubts, onAddDoubt, onViewDoubts }) => {
    const boardStyle = SUBJECT_CARD_STYLES[student.board] || SUBJECT_CARD_STYLES['GSEB'];

    const doubtStats = useMemo(() => {
        const open = doubts.filter(d => d.status === 'Open' || d.status === 'Tasked').length;
        const resolved = doubts.filter(d => d.status === 'Resolved').length;
        const lastDoubt = doubts.length > 0 ? [...doubts].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null;

        return { open, resolved, lastDoubt };
    }, [doubts]);

    return (
        <div className={`
            relative group
            rounded-2xl shadow-md p-4 transition-all duration-300 flex flex-col
            border-l-4 ${boardStyle.border}
            ${student.isArchived 
                ? 'bg-gray-50 dark:bg-gray-800/50 opacity-70 cursor-not-allowed' 
                : 'bg-white dark:bg-dark-card hover:shadow-lg'}
        `}>
             <div onClick={onViewDoubts} className="cursor-pointer flex-grow">
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
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        <span>🔴 Open: {doubtStats.open}</span>
                        <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                        <span>✅ Resolved: {doubtStats.resolved}</span>
                    </div>
                    <div className="space-y-1.5 min-h-[44px]">
                        {doubtStats.lastDoubt ? (
                            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                                <p className="font-semibold">Last Doubt:</p>
                                <p className="truncate" title={doubtStats.lastDoubt.text}>{doubtStats.lastDoubt.text}</p>
                            </div>
                        ) : (
                             <p className="text-sm text-center text-gray-500 italic pt-2">No doubts logged yet.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-4">
                <button
                    onClick={onAddDoubt}
                    disabled={student.isArchived}
                    className="w-full h-10 px-4 rounded-md bg-brand-blue text-white hover:bg-blue-600 text-sm font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    + Add Doubt
                </button>
            </div>
        </div>
    );
};

export default StudentDoubtCard;
