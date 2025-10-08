
import React from 'react';
import { Student, AttendanceStatus } from '../../types';
import PlaceholderAvatar from '../PlaceholderAvatar';

interface ManualAttendanceCardProps {
    student: Student;
    status: AttendanceStatus;
    onClick: () => void;
}

export const ManualAttendanceCard: React.FC<ManualAttendanceCardProps> = ({ student, status, onClick }) => {
    
    const getStatusStyles = () => {
        switch (status) {
            case 'Present': return 'border-green-500 bg-green-50 dark:bg-green-500/10';
            case 'Leave': return 'border-purple-500 bg-purple-50 dark:bg-purple-500/10';
            case 'Holiday': return 'border-blue-500 bg-blue-50 dark:bg-blue-500/10';
            case 'Absent': return 'border-red-500 bg-red-50 dark:bg-red-500/10';
            case 'None':
            default: return 'border-gray-400 bg-gray-100 dark:bg-gray-700/50';
        }
    };
    
    return (
        <div
            onClick={onClick}
            className={`
                p-4 rounded-2xl flex flex-col items-center text-center cursor-pointer
                border-2 transition-all duration-200
                ${getStatusStyles()}
            `}
        >
            <div className="w-20 h-20 mb-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-600 shadow-md">
                {student.avatarUrl 
                    ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> 
                    : <PlaceholderAvatar />
                }
            </div>
            <p className="font-semibold text-gray-900 dark:text-white truncate w-full">{student.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{status}</p>
        </div>
    );
};
