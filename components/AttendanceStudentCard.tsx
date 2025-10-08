
import React from 'react';
import { Student } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import FaceIdIcon from './icons/FaceIdIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import { toTitleCase } from '../utils/stringUtils';

interface AttendanceStudentCardProps {
    student: Student & { isRegistered: boolean };
    onViewHistory: () => void;
    onRegister: () => void;
    isRegistering?: boolean;
    registrationDisabled?: boolean;
}

const AttendanceStudentCard: React.FC<AttendanceStudentCardProps> = ({ student, onViewHistory, onRegister, isRegistering, registrationDisabled }) => {
    
    const handleRegisterClick = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        onRegister();
    };

    return (
        <div
            onClick={onViewHistory}
            className={`
                group relative flex h-full flex-col rounded-2xl bg-card shadow-soft 
                transition-all duration-300 
                border border-border/60 cursor-pointer 
                hover:shadow-soft-lg hover:-translate-y-1.5
                ${isRegistering ? 'ring-2 ring-primary shadow-soft-lg' : ''} 
            `}
        >
            <div className="flex flex-1 flex-col p-5 text-center items-center">
                
                <div className="w-20 h-20 rounded-full overflow-hidden bg-muted shadow-md ring-4 ring-card mb-4 flex-shrink-0">
                    {student.avatarUrl ? (
                        <img src={student.avatarUrl} alt={toTitleCase(student.name)} className="h-full w-full object-cover" />
                    ) : (
                        <PlaceholderAvatar />
                    )}
                </div>

                <div className="flex-grow">
                    <h3 className="text-lg font-bold text-card-foreground" title={toTitleCase(student.name)}>
                        {toTitleCase(student.name)}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Grade {student.grade} • {student.batch}
                    </p>
                </div>
                
                <div className="mt-4 w-full">
                    {student.isRegistered ? (
                        <div className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-success-muted text-success-muted-foreground font-semibold text-sm">
                            <CheckBadgeIcon className="h-5 w-5" />
                            Registered
                        </div>
                    ) : (
                        <button
                            onClick={handleRegisterClick}
                            disabled={isRegistering || registrationDisabled}
                            className="w-full py-2 px-4 rounded-xl bg-primary/10 text-primary font-semibold text-sm transition-colors hover:bg-primary/20 disabled:bg-muted disabled:cursor-wait flex items-center justify-center gap-2"
                        >
                            <FaceIdIcon className="h-5 w-5" />
                            {isRegistering ? 'Scanning...' : registrationDisabled ? 'Loading AI...' : 'Register Face'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceStudentCard;