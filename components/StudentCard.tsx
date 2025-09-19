
import React from 'react';
import { Student } from '../types';
import { SUBJECT_CARD_STYLES } from '../constants';
import PlaceholderAvatar from './PlaceholderAvatar';

interface StudentCardProps {
    student: Student;
    onClick: (student: Student) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onClick }) => {
    const contact = student.personalPhone || student.fatherPhone || student.motherPhone;
    const boardStyle = SUBJECT_CARD_STYLES[student.board] || SUBJECT_CARD_STYLES['GSEB'];

    return (
        <div
            className={`bg-light-card dark:bg-dark-card rounded-2xl shadow-md transition-all duration-300 cursor-pointer hover:shadow-lg flex flex-col border-l-4 ${boardStyle.border}`}
            onClick={() => onClick(student)}
        >
            <div className="p-4 flex flex-col h-full">
                <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{student.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Grade {student.grade} • {student.board}</p>
                        {(student.board === 'Cambridge' || student.board === 'IB') && student.programStage && (
                            <p className="text-sm text-gray-500 dark:text-gray-300 truncate">{student.programStage}</p>
                        )}
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm space-y-2 flex-grow">
                    <p><span className="font-semibold text-gray-700 dark:text-gray-300 w-20 inline-block">Batch:</span> {student.batch} ({student.timeSlot})</p>
                    <p><span className="font-semibold text-gray-700 dark:text-gray-300 w-20 inline-block">Contact:</span> {contact || 'N/A'}</p>
                </div>
            </div>
        </div>
    );
};

export default StudentCard;
