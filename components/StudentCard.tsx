import React from 'react';
import { Student, AttendanceStatus } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import ClockIcon from './icons/ClockIcon';

interface StudentCardProps {
    student: Student;
    onClick: (student: Student) => void;
    attendanceStatus: AttendanceStatus;
}

const Stat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="text-center">
        <p className="text-sm font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
    </div>
);

const StudentCard: React.FC<StudentCardProps> = ({ student, onClick, attendanceStatus }) => {
    return (
        <div
            onClick={() => onClick(student)}
            className="bg-card rounded-2xl shadow-soft border border-border flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg group cursor-pointer"
        >
            {/* Banner */}
            <div className="h-16 md:h-28 rounded-t-2xl bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-slate-900 dark:to-slate-800"></div>
            
            {/* Avatar & Info */}
            <div className="flex flex-col items-center -mt-8 md:-mt-14 p-4 md:px-6 md:pb-6 text-center">
                <div className="relative">
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden bg-muted ring-4 ring-card">
                        {student.avatarUrl ? (
                            <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                            <PlaceholderAvatar />
                        )}
                    </div>
                    {attendanceStatus === 'Present' && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 md:h-4 md:w-4 rounded-full bg-success ring-2 ring-card pulse-green" title="Present"></div>
                    )}
                </div>
                
                <h3 className="text-base md:text-xl font-bold mt-2 md:mt-4 text-foreground truncate w-full" title={student.name}>{student.name}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{`Grade ${student.grade} • ${student.board}`}</p>

                {/* Stats */}
                <div className="w-full bg-muted/80 dark:bg-muted/50 rounded-xl p-2 md:p-3 mt-3 md:mt-4 flex justify-around items-center text-sm">
                    <Stat label="Grade" value={student.grade} />
                    <div className="h-6 md:h-8 w-px bg-border"></div>
                    <Stat label="Batch" value={student.batch} />
                    <div className="h-6 md:h-8 w-px bg-border hidden md:block"></div>
                    <div className="text-center hidden md:block">
                        <p className="text-sm font-bold text-foreground flex items-center gap-1 justify-center"><ClockIcon className="h-4 w-4" />{student.timeSlot.split('–')[0]}</p>
                        <p className="text-xs text-muted-foreground">Time</p>
                    </div>
                </div>

                {/* View Profile Button */}
                <div className="mt-3 md:mt-4 w-full px-3 py-2 text-sm rounded-xl bg-primary/10 text-primary font-semibold group-hover:bg-primary/20 transition-colors">
                    View Profile
                </div>
            </div>
        </div>
    );
};

export default StudentCard;