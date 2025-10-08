
import React from 'react';
import { Student } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import ProgressIcon from './icons/ProgressIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import StarIcon from './icons/StarIcon';

interface StudentTestReportCardProps {
    student: Student;
    stats: {
        avgScore: number;
        completedTests: number;
        upcomingTests: number;
        absentTests: number;
    };
    onSelect: () => void;
}

const Stat: React.FC<{ label: string; value: React.ReactNode; icon: React.ReactNode; valueColor?: string }> = ({ label, value, icon, valueColor = 'text-foreground' }) => (
    <div className="text-center flex-1">
        <div className={`flex items-center justify-center gap-1 text-sm font-bold ${valueColor}`}>
            {icon}
            <div>{value}</div>
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
    </div>
);

const StudentTestReportCard: React.FC<StudentTestReportCardProps> = ({ student, stats, onSelect }) => {
    
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-success';
        if (score >= 60) return 'text-warning';
        return 'text-danger';
    };
    
    return (
        <div
            onClick={onSelect}
            className="bg-card rounded-2xl shadow-soft border border-border flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg group cursor-pointer"
        >
            {/* Banner */}
            <div className="h-16 md:h-28 rounded-t-2xl bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-slate-900 dark:to-slate-800"></div>
            
            {/* Avatar & Info */}
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

                {/* Stats */}
                <div className="w-full bg-muted/80 dark:bg-muted/50 rounded-xl p-2 md:p-3 mt-3 md:mt-4 flex justify-around items-center text-sm">
                    <Stat 
                        label="Avg Score" 
                        value={`${stats.avgScore}%`}
                        icon={<ProgressIcon className="h-4 w-4" />} 
                        valueColor={getScoreColor(stats.avgScore)}
                    />
                    <div className="h-6 md:h-8 w-px bg-border"></div>
                    <Stat 
                        label="Completed" 
                        value={stats.completedTests}
                        icon={<ClipboardListIcon className="h-4 w-4" />}
                    />
                </div>

                {/* View/Manage Button */}
                <div className="mt-3 md:mt-4 w-full px-3 py-2 text-sm rounded-xl bg-primary/10 text-primary font-semibold group-hover:bg-primary/20 transition-colors">
                    View Report
                </div>
            </div>
        </div>
    );
};

export default StudentTestReportCard;
