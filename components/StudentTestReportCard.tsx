import React from 'react';
import { Student } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import ChevronRightIcon from './icons/ChevronRightIcon';
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
    
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    // SVG properties for the progress circle
    const svgSize = 96;
    const strokeWidth = 8;
    const radius = (svgSize / 2) - (strokeWidth / 2);
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (stats.avgScore / 100) * circumference;
    
    return (
        <div
            onClick={onSelect}
            className="bg-light-card dark:bg-dark-card rounded-2xl shadow-md border border-gray-200/80 dark:border-gray-700/60 p-5 flex flex-col cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative"
        >
            {/* Top Section: Info + Avatar */}
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                    {student.avatarUrl ? (
                        <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                        <PlaceholderAvatar />
                    )}
                </div>
                <div className="flex-grow min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate" title={student.name}>{student.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Grade {student.grade} • {student.board}
                    </p>
                </div>
                <div className="text-gray-300 dark:text-gray-600 group-hover:text-brand-blue transition-transform duration-300 group-hover:translate-x-1">
                    <ChevronRightIcon className="h-6 w-6" />
                </div>
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-gray-200 dark:border-gray-700" />

            {/* Middle Section: Score + Stats */}
            <div className="flex-grow grid grid-cols-2 gap-4">
                {/* Score Progress Circle */}
                <div className="flex flex-col items-center justify-center">
                    <div className="relative w-24 h-24">
                        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${svgSize} ${svgSize}`}>
                            <circle
                                className="text-gray-200 dark:text-gray-700"
                                stroke="currentColor"
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                r={radius}
                                cx={svgSize / 2}
                                cy={svgSize / 2}
                            />
                            <circle
                                className={`${getScoreColor(stats.avgScore)}`}
                                stroke="currentColor"
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                fill="transparent"
                                r={radius}
                                cx={svgSize / 2}
                                cy={svgSize / 2}
                                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-2xl font-bold ${getScoreColor(stats.avgScore)}`}>
                                {stats.avgScore}
                                <span className="text-lg font-semibold">%</span>
                            </span>
                        </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">Avg Score</span>
                </div>
                {/* Key Stats */}
                <div className="flex-grow space-y-3 justify-center flex flex-col">
                     <div className="flex items-center text-sm gap-3">
                        <StarIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">Strongest</p>
                            <p className="font-semibold text-gray-800 dark:text-white truncate" title={stats.strongestSubject}>
                                {stats.strongestSubject === 'N/A' ? '—' : stats.strongestSubject}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center text-sm gap-3">
                        <ClipboardListIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">Completed</p>
                            <p className="font-semibold text-gray-800 dark:text-white">{stats.completedTests} Tests</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentTestReportCard;
