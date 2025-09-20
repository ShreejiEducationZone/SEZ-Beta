import React, { useMemo } from 'react';
import { Student, StudentAttendance } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';

interface AttendanceStudentCardProps {
    student: Student;
    attendance?: StudentAttendance;
    onClick: (student: Student) => void;
}

const AttendanceStudentCard: React.FC<AttendanceStudentCardProps> = ({ student, attendance, onClick }) => {
    const isPresent = attendance?.status === 'Present';

    // FIX: useMemo was used without being imported.
    const lastSeenTime = useMemo(() => {
        if (!attendance?.lastSeen) return null;
        try {
            return new Date(attendance.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch {
            return null;
        }
    }, [attendance?.lastSeen]);
    
    return (
        <div
            onClick={() => onClick(student)}
            className={`
                bg-light-card dark:bg-dark-card rounded-2xl shadow-md p-4 transition-all duration-300 cursor-pointer
                border-l-4
                ${isPresent ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'}
                hover:shadow-lg hover:-translate-y-1
            `}
        >
            <div className="flex flex-col h-full">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{student.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Grade {student.grade}</p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                     <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                        <p className={`text-lg font-bold ${isPresent ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                            {attendance?.status || 'Absent'}
                        </p>
                    </div>
                    {lastSeenTime && isPresent && (
                         <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Last Seen</p>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{lastSeenTime}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AttendanceStudentCard;