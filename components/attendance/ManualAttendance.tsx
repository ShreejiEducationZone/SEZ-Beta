
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Student, AttendanceRecord, AttendanceStatus } from '../../types';
import { ManualAttendanceCard } from './ManualAttendanceCard';
import { HolidayManagerModal } from './HolidayManagerModal';
import FilterBar from '../FilterBar';
import AttendanceAnalytics from './AttendanceAnalytics';
import CalendarIcon from '../icons/CalendarIcon';

const DonutChart: React.FC<{ value: number; total: number; label: string; colorClass: string; trackColorClass?: string; }> = ({ value, total, label, colorClass, trackColorClass = 'text-gray-200 dark:text-gray-700' }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle className={trackColorClass} stroke="currentColor" strokeWidth="12" fill="transparent" r={radius} cx="50" cy="50" />
                    <circle className={colorClass} stroke="currentColor" strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" fill="transparent" r={radius} cx="50" cy="50" style={{ transition: 'stroke-dashoffset 0.5s ease-out' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800 dark:text-white">{value}</span>
                </div>
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</p>
        </div>
    );
};

const STATUS_OPTIONS = ['Present', 'Absent', 'Leave', 'Holiday', 'Unmarked', 'Registered'] as const;


export const ManualAttendance: React.FC = () => {
    const { students, attendanceRecords, handleBatchSaveAttendanceRecords, showToast, faceDescriptors } = useData();
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    });
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    
    const [filters, setFilters] = useState({ board: '', batch: '', status: '' });
    const [searchQuery, setSearchQuery] = useState('');
    
    const [pendingChanges, setPendingChanges] = useState<Map<string, AttendanceStatus>>(new Map());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Clear pending changes when the date changes
        setPendingChanges(new Map());
    }, [selectedDate]);

    const activeStudents = useMemo(() => students.filter(s => !s.isArchived), [students]);

    const registeredStudentIds = useMemo(() => new Set(faceDescriptors.map(d => d.id)), [faceDescriptors]);

    const attendanceMap = useMemo(() => {
        const recordsForDate = attendanceRecords.filter(r => r.date === selectedDate);
        return new Map(recordsForDate.map(r => [r.studentId, r.status]));
    }, [attendanceRecords, selectedDate]);

    const filteredStudents = useMemo(() => {
        return activeStudents.filter(student => {
            if (filters.board && student.board !== filters.board) return false;
            if (filters.batch && student.batch !== filters.batch) return false;
            if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            
            if (filters.status) {
                if (filters.status === 'Registered') {
                    if (!registeredStudentIds.has(student.id)) return false;
                } else if (filters.status) {
                    const studentStatus = pendingChanges.get(student.id) || attendanceMap.get(student.id) || 'None';
                    const filterStatus = filters.status === 'Unmarked' ? 'None' : filters.status;
                    if (studentStatus !== filterStatus) return false;
                }
            }

            return true;
        });
    }, [activeStudents, filters, searchQuery, attendanceMap, registeredStudentIds, pendingChanges]);

    const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value })), []);
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value), []);
    const clearFilters = useCallback(() => { setFilters({ board: '', batch: '', status: '' }); setSearchQuery(''); }, []);

    const handleStatusCycle = (studentId: string) => {
        const currentStatus = pendingChanges.get(studentId) || attendanceMap.get(studentId) || 'None';
        let nextStatus: AttendanceStatus;

        switch (currentStatus) {
            case 'None': nextStatus = 'Present'; break;
            case 'Present': nextStatus = 'Leave'; break;
            case 'Leave': nextStatus = 'Absent'; break;
            case 'Absent': nextStatus = 'None'; break;
            case 'Holiday': nextStatus = 'Present'; break; // Override holiday to present
            default: nextStatus = 'None';
        }
        
        setPendingChanges(prev => new Map(prev).set(studentId, nextStatus));
    };

    const handleDeclareHoliday = () => {
        const studentIds = filteredStudents.map(s => s.id);
        if (studentIds.length === 0) {
            showToast("No students are visible to mark as holiday.", "info");
            return;
        }
        const newChanges = new Map(pendingChanges);
        studentIds.forEach(id => newChanges.set(id, 'Holiday'));
        setPendingChanges(newChanges);
        showToast(`Marked holiday for ${studentIds.length} visible students. Click 'Save Changes' to confirm.`, 'info');
    };

    const handleSaveChanges = async () => {
        if (pendingChanges.size === 0) {
            showToast("No changes to save.", "info");
            return;
        }
        setIsSaving(true);
        const recordsToSave: AttendanceRecord[] = [];
        pendingChanges.forEach((status, studentId) => {
            // Only save if the status is different from the original
            if (status !== (attendanceMap.get(studentId) || 'None')) {
                 recordsToSave.push({
                    id: `${studentId}_${selectedDate}`,
                    studentId,
                    date: selectedDate,
                    status: status,
                    reason: status === 'Leave' ? 'Applied Leave' : status === 'Holiday' ? 'Declared Holiday' : undefined
                });
            }
        });

        try {
            if (recordsToSave.length > 0) {
                await handleBatchSaveAttendanceRecords(recordsToSave);
            } else {
                showToast("No actual changes detected from original status.", "info");
            }
            setPendingChanges(new Map());
        } catch (error) {
            // Error toast is shown by context
        } finally {
            setIsSaving(false);
        }
    };
    
    const dailyStats = useMemo(() => {
        let present = 0, absent = 0, holiday = 0, leave = 0, none = 0;
        filteredStudents.forEach(student => {
            const status = pendingChanges.get(student.id) || attendanceMap.get(student.id) || 'None';
            if (status === 'Present') present++;
            else if (status === 'Absent') absent++;
            else if (status === 'Holiday') holiday++;
            else if (status === 'Leave') leave++;
            else none++;
        });
        return { present, absent, holiday, leave, none, total: filteredStudents.length };
    }, [filteredStudents, attendanceMap, pendingChanges]);

    const totalRegistered = useMemo(() => {
        return filteredStudents.filter(s => registeredStudentIds.has(s.id)).length;
    }, [filteredStudents, registeredStudentIds]);


    return (
        <>
            <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm mb-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Date</label>
                        <div className="mt-1 flex items-center gap-2">
                            <div className="w-full sm:w-56 h-10 flex items-center px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                                <span className="text-gray-900 dark:text-gray-100 font-medium">
                                    {new Date(selectedDate.replace(/-/g, '/')).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                            <label htmlFor="attendance-date-picker" className="relative cursor-pointer h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600">
                                <CalendarIcon className="h-5 w-5 text-gray-500" />
                                <input
                                    type="date"
                                    id="attendance-date-picker"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                />
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                         <button onClick={() => setIsHolidayModalOpen(true)} className="h-10 px-4 rounded-md bg-gray-600 text-white hover:bg-gray-700 text-sm font-semibold">
                            Manage Holidays
                        </button>
                        <button onClick={handleDeclareHoliday} className="h-10 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold">
                            Declare Holiday
                        </button>
                        {pendingChanges.size > 0 && (
                             <button onClick={handleSaveChanges} disabled={isSaving} className="h-10 px-4 rounded-md bg-green-600 text-white hover:bg-green-700 text-sm font-semibold disabled:bg-gray-400">
                                {isSaving ? 'Saving...' : `Save ${pendingChanges.size} Change(s)`}
                            </button>
                        )}
                    </div>
                </div>
                 <div className="pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                    <DonutChart value={dailyStats.present} total={dailyStats.total} label="Present" colorClass="text-green-500" />
                    <DonutChart value={dailyStats.absent} total={dailyStats.total} label="Absent" colorClass="text-red-500" />
                    <DonutChart value={dailyStats.leave} total={dailyStats.total} label="Leave" colorClass="text-purple-500" />
                    <DonutChart value={dailyStats.holiday} total={dailyStats.total} label="Holiday" colorClass="text-blue-500" />
                    <DonutChart value={dailyStats.none} total={dailyStats.total} label="Unmarked" colorClass="text-gray-500" />
                    <DonutChart value={totalRegistered} total={dailyStats.total} label="Registered" colorClass="text-indigo-500" />
                </div>
            </div>

            <FilterBar 
                filters={filters} 
                onFilterChange={handleFilterChange} 
                onClearFilters={clearFilters} 
                searchQuery={searchQuery} 
                onSearchChange={handleSearchChange}
                statusOptions={STATUS_OPTIONS}
            />
            
            <div className="max-h-[60vh] overflow-y-auto thin-scrollbar pr-2 -mr-2 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {filteredStudents.map(student => (
                    <ManualAttendanceCard 
                        key={student.id}
                        student={student}
                        status={pendingChanges.get(student.id) || attendanceMap.get(student.id) || 'None'}
                        onClick={() => handleStatusCycle(student.id)}
                    />
                ))}
                {filteredStudents.length === 0 && (
                    <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400">
                        <p className="font-semibold text-lg">No students found.</p>
                        <p className="text-sm">Try adjusting your filters.</p>
                    </div>
                )}
            </div>
            
            <div className="mt-8">
                <AttendanceAnalytics records={attendanceRecords} students={activeStudents} />
            </div>

            {isHolidayModalOpen && <HolidayManagerModal onClose={() => setIsHolidayModalOpen(false)} />}
        </>
    );
};