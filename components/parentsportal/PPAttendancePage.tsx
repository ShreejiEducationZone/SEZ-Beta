import React, { useMemo, useState } from 'react';
import { Student } from '../../types';
import { useAttendance } from '../../context/AttendanceContext';
import { FaCheckCircle, FaTimesCircle, FaCalendarDay, FaChevronLeft, FaSun, FaMoon, FaSignOutAlt } from 'react-icons/fa';
import { useData } from '../../context/DataContext';
import PlaceholderAvatar from '../PlaceholderAvatar';
import { ParentPage } from '../ParentsPortal';


const PPAttendancePage: React.FC<{ student: Student, onNavigate: (page: ParentPage) => void; }> = ({ student, onNavigate }) => {
    const { attendanceRecords } = useAttendance();
    const { logout, darkMode, setDarkMode } = useData();
    const [viewLimit, setViewLimit] = useState(10);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const records = useMemo(() => {
        return attendanceRecords
            .filter(r => r.studentId === student.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [attendanceRecords, student.id]);

    const stats = useMemo(() => {
        const present = records.filter(r => r.status === 'Present').length;
        const absent = records.filter(r => r.status === 'Absent').length;
        const leave = records.filter(r => r.status === 'Leave').length;
        return { present, absent, leave };
    }, [records]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Present': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'Absent': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'Leave': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
            case 'Holiday': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <header className="flex justify-between items-center pt-2 pb-6">
                <div className="w-12">
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="w-12 h-12 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-muted transition-all group"
                    >
                        <FaChevronLeft className="h-5 w-5 text-foreground" />
                    </button>
                </div>
                
                <h1 className="text-lg sm:text-xl font-bold text-foreground absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                    Attendance
                </h1>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="w-12 h-12 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-muted transition-all group"
                        aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {darkMode ? <FaSun className="h-5 w-5 text-yellow-500" /> : <FaMoon className="h-5 w-5 text-indigo-500" />}
                    </button>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-12 h-12 rounded-full overflow-hidden bg-muted border-2 border-card shadow-sm hover:ring-2 hover:ring-primary transition-all"
                    >
                        {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                    </button>
                </div>
            </header>
            
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-card border border-border p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-emerald-500">{stats.present}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Present</p>
                </div>
                <div className="bg-card border border-border p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-red-500">{stats.absent}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Absent</p>
                </div>
                <div className="bg-card border border-border p-4 rounded-xl text-center">
                    <p className="text-2xl font-bold text-purple-500">{stats.leave}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Leaves</p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/30">
                    <h3 className="font-semibold text-foreground">History</h3>
                </div>
                <div className="divide-y divide-border">
                    {records.slice(0, viewLimit).map(record => (
                        <div key={record.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${getStatusColor(record.status)} border`}>
                                    {record.status === 'Present' ? <FaCheckCircle /> : 
                                     record.status === 'Absent' ? <FaTimesCircle /> : <FaCalendarDay />}
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">
                                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {record.inTime ? `In: ${record.inTime}` : record.status}
                                    </p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(record.status)}`}>
                                {record.status}
                            </span>
                        </div>
                    ))}
                    {records.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground italic">No attendance records found.</div>
                    )}
                </div>
                {records.length > viewLimit && (
                    <button 
                        onClick={() => setViewLimit(prev => prev + 10)} 
                        className="w-full p-3 text-sm font-semibold text-primary hover:bg-muted transition-colors"
                    >
                        View More
                    </button>
                )}
            </div>
             {showLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}>
                    <div className="bg-card p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-border" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-danger-muted rounded-full flex items-center justify-center mb-4">
                                <FaSignOutAlt className="h-8 w-8 text-danger" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">
                                Confirm Logout
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                Are you sure you want to logout from <strong>{student.name}</strong>'s parent portal?
                            </p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-2.5 rounded-xl font-semibold bg-muted text-muted-foreground hover:bg-border transition-colors">
                                    Cancel
                                </button>
                                <button onClick={logout} className="flex-1 py-2.5 rounded-xl font-semibold bg-danger text-danger-foreground hover:bg-danger/90 transition-colors">
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PPAttendancePage;