import React from 'react';
import { Student } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import ClockIcon from './icons/ClockIcon';
import PhoneIcon from './icons/PhoneIcon';
import WarningIcon from './icons/WarningIcon';

interface StudentCardProps {
    student: Student;
    onClick: (student: Student) => void;
    attendanceStatus: 'Present' | 'Absent';
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onClick, attendanceStatus }) => {
    // Calculate profile completion percentage
    const optionalFields: (keyof Student)[] = [
        'personalPhone', 'fatherPhone', 'motherPhone', 'address', 'fatherName',
        'motherName', 'occupation', 'gender', 'email', 'dob'
    ];
    const filledCount = optionalFields.filter(field => student[field] && String(student[field]).trim() !== '').length;
    const completionPercentage = Math.round((filledCount / optionalFields.length) * 100);

    // SVG properties for the progress circle
    const svgSize = 96;
    const strokeWidth = 5; // Slightly thicker for a bolder look
    const radius = (svgSize / 2) - (strokeWidth / 2);
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

    const contact = student.personalPhone || student.fatherPhone || student.motherPhone;

    return (
        <div
            onClick={() => onClick(student)}
            className="relative h-80 bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/80 dark:border-white/30 p-5 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.03] group"
        >
            {/* Attendance Status Badge */}
            <div className={`absolute top-4 right-4 px-2 py-0.5 text-xs font-semibold rounded-full ${
                attendanceStatus === 'Present'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border border-green-200 dark:border-green-700'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border border-red-200 dark:border-red-700'
            }`}>
                {attendanceStatus}
            </div>

            {/* Avatar + Progress */}
            <div className="relative flex-shrink-0 w-24 h-24 mt-4 mb-4">
                 {/* Progress Circle SVG */}
                <svg className="absolute inset-0 transform -rotate-90" viewBox={`0 0 ${svgSize} ${svgSize}`}>
                    <circle
                        className="text-gray-900/10 dark:text-white/10"
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        r={radius}
                        cx={svgSize / 2}
                        cy={svgSize / 2}
                    />
                    <circle
                        className="text-indigo-500"
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out' }}
                        strokeLinecap="round"
                        r={radius}
                        cx={svgSize / 2}
                        cy={svgSize / 2}
                    />
                </svg>

                {/* Profile Picture */}
                <div className="absolute inset-[10px] rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-inner">
                    {student.avatarUrl ? (
                        <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                        <PlaceholderAvatar />
                    )}
                </div>

                {/* Icon on the circle */}
                <div className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md">
                    {completionPercentage === 100 ? (
                        <CheckBadgeIcon className="h-6 w-6 text-indigo-500" />
                    ) : (
                        <div className="h-6 w-6 rounded-full flex items-center justify-center" title="Profile Incomplete">
                            <WarningIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                        </div>
                    )}
                </div>
            </div>

            {/* Student Info */}
            <div className="flex-grow flex flex-col items-center min-w-0 w-full">
                <h3 className="w-full text-xl font-semibold text-gray-800 dark:text-white truncate" title={student.name}>
                    {student.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    Grade {student.grade} • {student.board}
                </p>
                {student.programStage && (
                    <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium mt-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/50 rounded-full truncate">
                        {student.programStage}
                    </p>
                )}
            </div>
            
            {/* Bottom Details */}
            <footer className="w-full mt-auto pt-4 border-t border-gray-900/10 dark:border-white/10">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5" title={`Batch: ${student.batch} (${student.timeSlot})`}>
                        <ClockIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Batch {student.batch}</span>
                    </div>
                    {contact && (
                        <div className="flex items-center gap-1.5" title={contact}>
                            <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{contact}</span>
                        </div>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default StudentCard;