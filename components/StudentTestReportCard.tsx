import React from 'react';
import { Student } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import { SUBJECT_CARD_STYLES } from '../constants';
import ChartBarIcon from './icons/ChartBarIcon';
import StarIcon from './icons/StarIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';

interface StudentTestReportCardProps {
    student: Student;
    stats: {
        avgScore: number;
        strongestSubject: string;
        completedTests: number;
        upcomingTests: number;
        absentTests: number;
    };
    onSelect: () => void;
}

const StudentTestReportCard: React.FC<StudentTestReportCardProps> = ({ student, stats, onSelect }) => {
    const boardStyle = SUBJECT_CARD_STYLES[student.board] || SUBJECT_CARD_STYLES['GSEB'];

    return (
        <div
            onClick={onSelect}
            className={`
                bg-light-card dark:bg-dark-card rounded-2xl shadow-md p-5 transition-all duration-300 cursor-pointer
                border-l-4 ${boardStyle.border} flex flex-col justify-between
                hover:shadow-lg hover:-translate-y-1
            `}
        >
            {/* Header section */}
            <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 border-2 border-white dark:border-gray-600 shadow-sm">
                    {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">{student.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{`Grade ${student.grade} • ${student.board}`}</p>
                </div>
            </div>

            {/* Stats section */}
            <div className="mt-5 grid grid-cols-3 gap-4 text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center">
                    <ChartBarIcon className="h-6 w-6 text-brand-blue mb-1" />
                    <p className="text-xl font-bold text-gray-800 dark:text-white">{stats.avgScore}<span className="text-sm font-medium">%</span></p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avg Score</p>
                </div>
                <div className="flex flex-col items-center">
                    <StarIcon className="h-6 w-6 text-yellow-500 mb-1" />
                    <p className="text-base font-semibold text-gray-800 dark:text-white truncate w-full" title={stats.strongestSubject}>{stats.strongestSubject === 'N/A' ? '—' : stats.strongestSubject}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Strongest</p>
                </div>
                <div className="flex flex-col items-center">
                    <ClipboardListIcon className="h-6 w-6 text-green-500 mb-1" />
                    <p className="text-xl font-bold text-gray-800 dark:text-white">{stats.completedTests + stats.upcomingTests + stats.absentTests}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tests</p>
                </div>
            </div>
        </div>
    );
};

export default StudentTestReportCard;