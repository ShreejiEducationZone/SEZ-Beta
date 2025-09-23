import React, { useMemo } from 'react';
import { Student, AttendanceRecord } from '../types';
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

const StudentAttendanceDetailView: React.FC<StudentAttendanceDetailViewProps> = ({ student, records, onBack }) => {

    const sortedRecords = useMemo(() => {
        return [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [records]);

    const stats = useMemo(() => {
        const present = records.length;
        // This is a simplification; a full absent count would require knowing all school days.
        // For this view, we'll just show the total logged (present) days.
        const total = present;
        const percentage = total > 0 ? 100 : 0; // Since we only log present days.
        return { present, absent: 'N/A', percentage };
    }, [records]);


    return (
        <div>
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-brand-blue transition-colors mb-4"
            >
                <ChevronLeftIcon className="h-5 w-5" />
                Back to Attendance Dashboard
            </button>
             <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-lg p-6 w-full">
                <h2 className="text-2xl font-bold text-center mb-2">Attendance Report: {student.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Showing all logged attendance records.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <StatCard title="Total Present" value={stats.present} color="#10B981" />
                    <StatCard title="Total Absent" value={stats.absent} color="#EF4444" />
                    <StatCard title="Attendance %" value={`${stats.percentage}%`} color="#3B82F6" />
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
                                        <td className="px-4 py-3">{record.inTime}</td>
                                        <td className="px-4 py-3">{record.lastSeen}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
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