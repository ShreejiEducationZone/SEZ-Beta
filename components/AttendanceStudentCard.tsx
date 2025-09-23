import React from 'react';
import { Student } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import FaceIdIcon from './icons/FaceIdIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface StudentAttendanceData extends Student {
    status: 'Present' | 'Absent';
    lastSeen: string | null;
    isRegistered: boolean;
}

interface AttendanceStudentCardProps {
    student: StudentAttendanceData;
    onCardClick: () => void;
    onRegisterClick: () => void;
    isRegistering?: boolean;
}

const AttendanceStudentCard: React.FC<AttendanceStudentCardProps> = ({ student, onCardClick, onRegisterClick, isRegistering }) => {
    const isPresent = student.status === 'Present';

    const handleRegister = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRegisterClick();
    };

    return (
        <div
            onClick={onCardClick}
            className={`
                relative min-h-[240px] rounded-2xl p-4 flex flex-col items-center justify-between
                bg-gray-200/50 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-300/50 dark:border-gray-700/50
                transition-all duration-300 hover:shadow-lg hover:border-gray-400/50 dark:hover:border-gray-600/50
                cursor-pointer group
                ${isRegistering ? 'ring-2 ring-brand-blue shadow-xl' : ''}
            `}
        >
            {/* Status Dot */}
            <div
                title={`Status: ${student.status}`}
                className={`absolute top-3.5 right-3.5 w-3 h-3 rounded-full border-2 border-light-card dark:border-dark-card
                ${isPresent ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            
            {/* Main content */}
            <div className="text-center w-full">
                <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-white/50 dark:border-gray-600/50 shadow-md mb-2">
                    {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                </div>
                <p className="font-semibold text-gray-900 dark:text-white truncate">{student.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{`Grade ${student.grade} • Batch ${student.batch}`}</p>
            </div>
            
            {/* Footer */}
            <div className="w-full">
                {student.isRegistered ? (
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-700 dark:text-green-300 bg-green-500/10 dark:bg-green-500/20 rounded-lg px-3 py-1.5">
                        <CheckCircleIcon className="h-4 w-4" /> Registered
                    </div>
                ) : (
                    <button
                        onClick={handleRegister}
                        disabled={isRegistering}
                        className="w-full flex items-center justify-center gap-2 h-9 px-3 rounded-lg bg-brand-blue text-white hover:bg-blue-600 text-sm font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-wait"
                    >
                        <FaceIdIcon className="h-4 w-4" />
                        <span>{isRegistering ? 'Scanning...' : 'Register'}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default AttendanceStudentCard;