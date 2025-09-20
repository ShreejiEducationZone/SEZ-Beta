import React, { useMemo } from 'react';
import { Student } from '../types';

interface AttendanceCalendarModalProps {
    student: Student;
    attendanceLog: { [date: string]: 'Present' | 'Absent' };
    onClose: () => void;
}

const AttendanceCalendarModal: React.FC<AttendanceCalendarModalProps> = ({ student, attendanceLog, onClose }) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = React.useState(today.getMonth());
    const [currentYear, setCurrentYear] = React.useState(today.getFullYear());

    const calendarGrid = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        const grid = [];
        let day = 1;
        for (let i = 0; i < 6; i++) {
            const week = [];
            for (let j = 0; j < 7; j++) {
                if ((i === 0 && j < firstDayOfMonth) || day > daysInMonth) {
                    week.push(null);
                } else {
                    week.push(day);
                    day++;
                }
            }
            grid.push(week);
            if (day > daysInMonth) break;
        }
        return grid;
    }, [currentMonth, currentYear]);

    // Dummy attendance data generation
    const dummyLog = useMemo(() => {
        const log: { [date: string]: 'Present' | 'Absent' } = {};
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            if (date <= today) { // Only generate for past/present days
                const dateStr = date.toISOString().split('T')[0];
                log[dateStr] = Math.random() > 0.3 ? 'Present' : 'Absent';
            }
        }
        return log;
    }, [currentMonth, currentYear]);


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-lg p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Attendance for {student.name}</h2>
                        <p className="text-gray-600 dark:text-gray-400">{new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    </div>
                     <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-3xl font-light">&times;</button>
                </div>
                
                <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2">{day}</div>)}
                </div>
                
                <div className="grid grid-cols-7">
                    {calendarGrid.flat().map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} className="h-12"></div>;

                        const dateStr = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
                        const status = dummyLog[dateStr];
                        
                        let bgColor = 'bg-transparent';
                        if (status === 'Present') bgColor = 'bg-green-100 dark:bg-green-900/50';
                        if (status === 'Absent') bgColor = 'bg-red-100 dark:bg-red-900/50';

                        const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day;
                        
                        return (
                            <div key={day} className={`h-12 flex items-center justify-center ${bgColor}`}>
                                <span className={`w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-brand-blue text-white' : ''}`}>
                                    {day}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AttendanceCalendarModal;
