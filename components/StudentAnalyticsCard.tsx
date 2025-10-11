import React from 'react';
import { Student } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import SparklesIcon from './icons/SparklesIcon';
import WarningIcon from './icons/WarningIcon';

interface StudentAnalyticsCardProps {
    student: Student;
    focusAreaCount: number;
    onSelect: () => void;
}

const StudentAnalyticsCard: React.FC<StudentAnalyticsCardProps> = ({ student, focusAreaCount, onSelect }) => {
    return (
        <div
            onClick={onSelect}
            className="bg-card rounded-2xl shadow-soft border border-border flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg group cursor-pointer"
        >
            <div className="h-16 md:h-28 rounded-t-2xl bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-slate-900 dark:to-slate-800"></div>
            
            <div className="flex flex-col items-center -mt-8 md:-mt-14 p-4 md:px-6 md:pb-6 text-center">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden bg-muted ring-4 ring-card">
                    {student.avatarUrl ? (
                        <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                        <PlaceholderAvatar />
                    )}
                </div>
                
                <h3 className="text-base md:text-xl font-bold mt-2 md:mt-4 text-foreground truncate w-full" title={student.name}>{student.name}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{`Grade ${student.grade} • ${student.board}`}</p>

                <div className={`w-full rounded-xl p-2 md:p-3 mt-3 md:mt-4 flex justify-center items-center gap-2 text-sm ${focusAreaCount > 0 ? 'bg-warning-muted' : 'bg-success-muted'}`}>
                    {focusAreaCount > 0 ? <WarningIcon className="h-5 w-5 text-warning-muted-foreground" /> : <SparklesIcon className="h-5 w-5 text-success-muted-foreground" />}
                    <span className={`font-bold ${focusAreaCount > 0 ? 'text-warning-muted-foreground' : 'text-success-muted-foreground'}`}>
                        {focusAreaCount} Focus Area{focusAreaCount !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default StudentAnalyticsCard;