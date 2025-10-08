
import React, { useMemo } from 'react';
import { Student, Doubt } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import LockIcon from './icons/LockIcon';
import DoubtIcon from './icons/DoubtIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface StudentDoubtCardProps {
    student: Student;
    doubts: Doubt[];
    onViewDoubts: () => void;
}

const Stat: React.FC<{ label: string; value: string | number; icon: React.ReactNode; valueColor?: string }> = ({ label, value, icon, valueColor = 'text-foreground' }) => (
    <div className="text-center flex-1">
        <div className={`flex items-center justify-center gap-1 text-sm font-bold ${valueColor}`}>
            {icon}
            <p>{value}</p>
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
    </div>
);

const StudentDoubtCard: React.FC<StudentDoubtCardProps> = ({ student, doubts, onViewDoubts }) => {
    
    const doubtStats = useMemo(() => {
        const open = doubts.filter(d => d.status === 'Open' || d.status === 'Tasked').length;
        const resolved = doubts.filter(d => d.status === 'Resolved').length;
        return { open, resolved };
    }, [doubts]);

    return (
        <div
            onClick={!student.isArchived ? onViewDoubts : undefined}
            className={`
                relative bg-card rounded-2xl shadow-soft border border-border flex flex-col 
                transition-all duration-300 group
                ${student.isArchived 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:-translate-y-1.5 hover:shadow-soft-lg cursor-pointer'}
            `}
        >
            {student.isArchived && (
                <div className="absolute top-4 right-4 text-muted-foreground z-10" title="Archived (Read-only)">
                    <LockIcon className="h-5 w-5" />
                </div>
            )}
            
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

                <div className="w-full bg-muted/80 dark:bg-muted/50 rounded-xl p-2 md:p-3 mt-3 md:mt-4 flex justify-around items-center text-sm">
                    <Stat 
                        label="Open" 
                        value={doubtStats.open} 
                        icon={<DoubtIcon className="h-4 w-4" />}
                        valueColor={doubtStats.open > 0 ? 'text-orange-500' : 'text-foreground'}
                    />
                    <div className="h-6 md:h-8 w-px bg-border"></div>
                    <Stat 
                        label="Resolved" 
                        value={doubtStats.resolved} 
                        icon={<CheckCircleIcon className="h-4 w-4" />}
                    />
                </div>

                <div className="mt-3 md:mt-4 w-full px-3 py-2 text-sm rounded-xl bg-primary/10 text-primary font-semibold group-hover:bg-primary/20 transition-colors">
                    Manage Doubts
                </div>
            </div>
        </div>
    );
};

export default StudentDoubtCard;