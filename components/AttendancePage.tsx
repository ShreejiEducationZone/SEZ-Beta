
import React, { useState } from 'react';
import { ManualAttendance } from './attendance/ManualAttendance';
import { FaceRecognitionAttendance } from './attendance/FaceRecognitionAttendance';
import { StudentRoster } from './attendance/StudentRoster';
import { FaUserFriends } from 'react-icons/fa';

const AttendancePage: React.FC = () => {
    const [view, setView] = useState<'manual' | 'roster' | 'face'>('manual');
    
    return (
        <div>
            <div className="mb-6 flex justify-center bg-gray-200 dark:bg-gray-700 rounded-lg p-1 max-w-md mx-auto">
                <button 
                    onClick={() => setView('manual')} 
                    className={`
                        w-1/3 px-3 py-2 text-sm font-semibold rounded-md transition-colors 
                        ${view === 'manual' ? 'bg-white dark:bg-dark-card shadow' : 'text-gray-600 dark:text-gray-300'}
                    `}
                >
                    Manual Entry
                </button>
                 <button 
                    onClick={() => setView('roster')} 
                    className={`
                        w-1/3 px-3 py-2 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2
                        ${view === 'roster' ? 'bg-white dark:bg-dark-card shadow' : 'text-gray-600 dark:text-gray-300'}
                    `}
                >
                    <FaUserFriends />
                    Students
                </button>
                <button 
                    onClick={() => setView('face')} 
                    className={`
                        w-1/3 px-3 py-2 text-sm font-semibold rounded-md transition-colors 
                        ${view === 'face' ? 'bg-white dark:bg-dark-card shadow' : 'text-gray-600 dark:text-gray-300'}
                    `}
                >
                    Face Recognition
                </button>
            </div>
            
            {view === 'manual' && <ManualAttendance />}
            {view === 'roster' && <StudentRoster />}
            {view === 'face' && <FaceRecognitionAttendance />}
        </div>
    );
};

export default AttendancePage;
