import React from 'react';
import { Student } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';

interface SimpleStudentCardProps {
    student: Student;
    onClick: (student: Student) => void;
}

const SimpleStudentCard: React.FC<SimpleStudentCardProps> = ({ student, onClick }) => {
    return (
        <div
            onClick={() => onClick(student)}
            className="bg-card rounded-2xl shadow-soft border border-border flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-soft-lg group cursor-pointer"
        >
            {/* Banner */}
            <div className="h-14 md:h-20 rounded-t-2xl bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-slate-900 dark:to-slate-800"></div>
            
            {/* Avatar & Info */}
            <div className="flex flex-col items-center -mt-8 md:-mt-10 p-4 text-center">
                <div className="relative">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-muted ring-4 ring-card">
                        {student.avatarUrl ? (
                            <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                            <PlaceholderAvatar />
                        )}
                    </div>
                </div>
                
                <h3 className="text-base font-bold mt-3 text-foreground truncate w-full" title={student.name}>{student.name}</h3>
                
                {/* View Sheets Button */}
                <div className="mt-4 w-full px-3 py-2 text-xs rounded-lg bg-primary/10 text-primary font-semibold group-hover:bg-primary/20 transition-colors">
                    View Sheets
                </div>
            </div>
        </div>
    );
};

export default SimpleStudentCard;