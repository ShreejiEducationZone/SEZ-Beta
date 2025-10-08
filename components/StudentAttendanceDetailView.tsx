

import React, { useMemo } from 'react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';

interface StudentAttendanceDetailViewProps {
    student: Student;
    records: AttendanceRecord[];
    onBack: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number; color: string }> = ({ title, value, color }) => (
    <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-sm text-center">
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    </div>
);

const getStatusStyle = (status: AttendanceStatus) => {
    switch (status) {
        case 'Present':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'Holiday':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'Leave':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
        case 'None':
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        case 'Absent':
        default:
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
};

const StudentAttendanceDetailView: React.FC<StudentAttendanceDetailViewProps> = ({ student, records, onBack }) => {

    const sortedRecords = useMemo(() => {
        return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [records]);

    const stats = useMemo(() => {
        const presentCount = records.filter(r => r.status === 'Present').length;
        const absentCount = records.filter(r => r.status === 'Absent').length;
        const holidayCount = records.filter(r => r.status === 'Holiday').length;
        const leaveCount = records.filter(r => r.status === 'Leave').length;
        const totalDaysLogged = presentCount + absentCount + leaveCount; // Holidays don't count towards percentage
        const percentage = totalDaysLogged > 0 ? Math.round((presentCount / totalDaysLogged) * 100) : 0;
        return { present: presentCount, absent: absentCount, holiday: holidayCount, leave: leaveCount, percentage };
    }, [records]);


    return (
        <div>
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-brand-blue transition-colors mb-4"
            >
                <ChevronLeftIcon className="h-5 w-5" />
                Back to Student Roster
            </button>
             <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-lg p-6 w-full">
                <h2 className="text-2xl font-bold text-center mb-2">Attendance Report: {student.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Showing all logged attendance records.</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                    <StatCard title="Total Present" value={stats.present} color="#10B981" />
                    <StatCard title="Total Absent" value={stats.absent} color="#EF4444" />
                    <StatCard title="Total Leaves" value={stats.leave} color="#8B5CF6" />
                    <StatCard title="Total Holidays" value={stats.holiday} color="#3B82F6" />
                    <StatCard title="Attendance %" value={`${stats.percentage}%`} color="#8B5CF6" />
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-white/10 text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            <tr>
                                <th scope="col" className="px-4 py-3">Date</th>
                                <th scope="col" className="px-4 py-3">Day</th>
                                <th scope="col" className="px-4 py-3">In Time</th>
                                <th scope="col" className="px-4 py-3">Last Seen</th>
                                <th scope="col" className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                           {sortedRecords.length > 0 ? sortedRecords.map((record) => {
                                const recordDate = new Date(record.date);
                                const dayOfWeek = recordDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
                                return (
                                    <tr key={record.id} className="border-b dark:border-gray-700">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{record.date}</td>
                                        <td className="px-4 py-3">{dayOfWeek}</td>
                                        <td className="px-4 py-3">{record.inTime || '—'}</td>
                                        <td className="px-4 py-3">{record.lastSeen || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(record.status)}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-500">
                                        No attendance records found for this student.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentAttendanceDetailView;
