
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { WorkItem, Student, WorkPriority, WorkStatus } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface WorkCalendarViewProps {
    workItems: WorkItem[];
    students: Student[];
    onItemClick: (item: WorkItem) => void;
    onSaveWorkItem: (item: WorkItem) => void;
}

const PRIORITY_BADGE_STYLES: Record<WorkPriority, string> = {
    High: 'bg-red-500 text-white',
    Medium: 'bg-yellow-500 text-white',
    Low: 'bg-blue-500 text-white',
};

const STATUS_BORDER_STYLES: Record<WorkStatus, string> = {
    Completed: 'border-l-4 border-green-500',
    Pending: 'border-l-4 border-orange-500',
    Assign: 'border-l-4 border-gray-400',
};

// Helper to get the start of the week (Monday)
const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};


const WorkCalendarView: React.FC<WorkCalendarViewProps> = ({ workItems, students, onItemClick, onSaveWorkItem }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week'>('month');
    const [dragOverDate, setDragOverDate] = useState<string | null>(null);
    const todayColumnRef = useRef<HTMLDivElement>(null);

    const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

    const workItemsByDate = useMemo(() => {
        return workItems.reduce((acc, item) => {
            const date = item.dueDate;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(item);
            return acc;
        }, {} as { [key: string]: WorkItem[] });
    }, [workItems]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
    };

    const changeWeek = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + (7 * offset));
            return newDate;
        });
    };

    const handleGoToToday = () => {
        setCurrentDate(new Date());
    };

    const weekDates = useMemo(() => {
        const start = getStartOfWeek(currentDate);
        return Array.from({ length: 7 }).map((_, i) => {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            return date;
        });
    }, [currentDate]);

    useEffect(() => {
        // Auto-scroll to today's column in week view if it's in the current view
        const todayStr = new Date().toISOString().split('T')[0];
        const isTodayInCurrentWeek = weekDates.some(d => d.toISOString().split('T')[0] === todayStr);

        if (view === 'week' && isTodayInCurrentWeek && todayColumnRef.current) {
            setTimeout(() => { // Timeout helps ensure ref is attached after render
                todayColumnRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center',
                    block: 'nearest'
                });
            }, 100);
        }
    }, [currentDate, view, weekDates]);

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // Sunday is 0
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const grid = [];
        let day = 1;
        for (let i = 0; i < 6; i++) { // 6 weeks to cover all possibilities
            const week = [];
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < firstDayOfMonth) {
                    const prevMonthDays = new Date(year, month, 0).getDate();
                    const date = new Date(year, month - 1, prevMonthDays - firstDayOfMonth + j + 1);
                    week.push({ date, isCurrentMonth: false });
                } else if (day > daysInMonth) {
                    const date = new Date(year, month + 1, day - daysInMonth);
                    week.push({ date, isCurrentMonth: false });
                    day++;
                } else {
                    const date = new Date(year, month, day);
                    week.push({ date, isCurrentMonth: true });
                    day++;
                }
            }
            grid.push(week);
            if (day > daysInMonth) break;
        }
        return grid;
    }, [currentDate]);


    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: WorkItem) => {
        e.dataTransfer.setData('workItemId', item.id);
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, dateString: string) => {
        e.preventDefault();
        setDragOverDate(dateString);
    };

    const handleDragLeave = () => {
        setDragOverDate(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dateString: string) => {
        e.preventDefault();
        setDragOverDate(null);
        const workItemId = e.dataTransfer.getData('workItemId');
        const itemToUpdate = workItems.find(item => item.id === workItemId);

        if (itemToUpdate && itemToUpdate.dueDate !== dateString) {
            onSaveWorkItem({ ...itemToUpdate, dueDate: dateString });
        }
    };

    const renderWorkItem = (item: WorkItem) => {
        const student = studentMap.get(item.studentId);
        return (
            <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onDragEnd={handleDragEnd}
                onClick={() => onItemClick(item)}
                title={`Description: ${item.description}\nStatus: ${item.status}`}
                className={`p-1.5 rounded text-xs cursor-grab active:cursor-grabbing transition-shadow shadow-sm hover:shadow-md ${STATUS_BORDER_STYLES[item.status]} bg-white dark:bg-gray-800/80`}
            >
                <div className="flex justify-between items-start">
                    <p className="font-bold flex-1 mr-1 text-gray-800 dark:text-gray-200 break-words">{item.title}</p>
                    <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-semibold ${PRIORITY_BADGE_STYLES[item.priority]}`}>
                        {item.priority}
                    </span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-1 truncate">{student?.name} | {item.subject}</p>
            </div>
        );
    }


    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-sm">
            <header className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    {view === 'month' ? (
                        <>
                            <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ChevronLeftIcon /></button>
                            <h3 className="text-xl font-bold text-center w-48">
                                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h3>
                            <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ChevronRightIcon /></button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => changeWeek(-1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ChevronLeftIcon /></button>
                            <h3 className="text-xl font-bold text-center w-48 sm:w-64">
                                {`${weekDates[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${weekDates[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                            </h3>
                            <button onClick={() => changeWeek(1)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"><ChevronRightIcon /></button>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2">
                         {view === 'week' && 
                            <>
                                <button onClick={() => changeWeek(-1)} className="px-3 py-1.5 text-sm font-semibold rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Previous Week</button>
                                <button onClick={() => changeWeek(1)} className="px-3 py-1.5 text-sm font-semibold rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Next Week</button>
                            </>
                        }
                        <button onClick={handleGoToToday} className="px-3 py-1.5 text-sm font-semibold rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600">Today</button>
                    </div>

                    <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                        <button
                            onClick={() => setView('month')}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'month' ? 'bg-white dark:bg-dark-card shadow' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                            Month View
                        </button>
                        <button
                            onClick={() => setView('week')}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${view === 'week' ? 'bg-white dark:bg-dark-card shadow' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                            Week View
                        </button>
                    </div>
                </div>
            </header>
            
            {view === 'month' ? (
                <>
                    <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-2 border-b border-gray-200 dark:border-gray-700">{day}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 grid-rows-6">
                        {calendarGrid.flat().map(({ date, isCurrentMonth }, idx) => {
                            date.setHours(0, 0, 0, 0);
                            const dateString = date.toISOString().split('T')[0];
                            const itemsForDay = workItemsByDate[dateString] || [];
                            const isToday = date.getTime() === today.getTime();
                            const isPast = date < today;

                            return (
                                <div 
                                    key={idx} 
                                    className={`p-2 h-36 flex flex-col overflow-hidden border-b border-r border-gray-200 dark:border-gray-700 transition-colors
                                        ${!isCurrentMonth ? 'bg-gray-50 dark:bg-dark-card/50' : ''}
                                        ${isPast && isCurrentMonth ? 'bg-gray-100 dark:bg-gray-800/50' : ''}
                                        ${dragOverDate === dateString ? 'bg-brand-blue/20' : ''}
                                        ${isToday ? 'border-2 border-brand-blue' : ''}`
                                    }
                                    onDragOver={(e) => handleDragOver(e, dateString)}
                                    onDrop={(e) => handleDrop(e, dateString)}
                                    onDragLeave={handleDragLeave}
                                >
                                    <span className={`font-semibold text-sm ${isCurrentMonth ? '' : 'text-gray-400 dark:text-gray-600'}`}>
                                        {date.getDate()}
                                    </span>
                                    <div className="mt-1 space-y-1.5 overflow-y-auto -mr-2 pr-1">
                                        {itemsForDay.map(item => renderWorkItem(item))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div>
                    <div className="grid grid-cols-7 text-center">
                        {weekDates.map(date => {
                            const isToday = date.toDateString() === new Date().toDateString();
                            return (
                                <div key={date.toISOString()} className={`py-2 border-b-2 border-gray-200 dark:border-gray-700 ${isToday ? 'bg-yellow-50 dark:bg-yellow-500/10' : ''}`}>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                        <p className={`text-2xl font-bold ${isToday ? 'text-yellow-600 dark:text-yellow-300' : ''}`}>{date.getDate()}</p>
                                        {isToday && (
                                            <span className="text-xs font-bold text-yellow-800 bg-yellow-200 dark:bg-yellow-400 dark:text-yellow-900 rounded-full px-2 py-0.5">Today</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="grid grid-cols-7 h-[60vh] overflow-x-auto">
                        {weekDates.map(date => {
                            date.setHours(0, 0, 0, 0);
                            const dateString = date.toISOString().split('T')[0];
                            const itemsForDay = workItemsByDate[dateString] || [];
                            const isToday = date.getTime() === today.getTime();
                            
                            return (
                                <div 
                                    key={dateString}
                                    ref={isToday ? todayColumnRef : null}
                                    className={`p-2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto space-y-2 transition-colors 
                                        ${dragOverDate === dateString ? 'bg-brand-blue/20' : ''} 
                                        ${isToday ? 'bg-yellow-50 dark:bg-yellow-500/10' : ''}`
                                    }
                                    onDragOver={(e) => handleDragOver(e, dateString)}
                                    onDrop={(e) => handleDrop(e, dateString)}
                                    onDragLeave={handleDragLeave}
                                >
                                    {itemsForDay.map(item => renderWorkItem(item))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkCalendarView;
