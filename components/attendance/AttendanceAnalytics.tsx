
import React, { useState, useMemo } from 'react';
import { AttendanceRecord, Student, AttendanceStatus } from '../../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import ChevronRightIcon from '../icons/ChevronRightIcon';

interface AttendanceAnalyticsProps {
    records: AttendanceRecord[];
    students: Student[];
}

type ViewMode = 'Month' | 'Week' | 'Year';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-sm">
        <p className="font-bold text-gray-800 dark:text-white">{data.fullDate || label}</p>
        <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{`${data.percentage.toFixed(1)}% Attendance`}</p>
        <div className="text-xs mt-1 text-gray-600 dark:text-gray-300">
          <p>Present: {data.present}</p>
          <p>Absent: {data.absent}</p>
          <p>Leave: {data.leave}</p>
        </div>
      </div>
    );
  }
  return null;
};

const CustomActiveDot = (props: any) => {
  const { cx, cy, stroke } = props;
  return (
    <g>
        <circle cx={cx} cy={cy} r={8} fill={stroke} fillOpacity={0.2} />
        <circle cx={cx} cy={cy} r={4} fill={stroke} />
    </g>
  );
};


const AttendanceAnalytics: React.FC<AttendanceAnalyticsProps> = ({ records, students }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('Month');
    const [currentDate, setCurrentDate] = useState(new Date());

    const { chartData, overallAverage, periodLabel } = useMemo(() => {
        const activeStudentIds = new Set(students.map(s => s.id));
        const relevantRecords = records.filter(r => activeStudentIds.has(r.studentId));

        const recordsByDate = new Map<string, Map<string, AttendanceStatus>>();
        relevantRecords.forEach(record => {
            if (!recordsByDate.has(record.date)) {
                recordsByDate.set(record.date, new Map());
            }
            recordsByDate.get(record.date)!.set(record.studentId, record.status);
        });

        const data: { name: string; fullDate: string; percentage: number; present: number; absent: number; leave: number; }[] = [];
        let periodLabel = '';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const calculateDailyStats = (date: Date) => {
            // Format date as YYYY-MM-DD in local timezone to avoid UTC conversion issues.
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const dateString = `${year}-${month}-${day}`;

            const dailyRecordsMap = recordsByDate.get(dateString) || new Map();
            let present = 0, absent = 0, leave = 0;
            
            students.forEach(student => {
                const status = dailyRecordsMap.get(student.id);
                switch (status) {
                    case 'Present': present++; break;
                    case 'Leave': leave++; break;
                    case 'Holiday': break; // Holidays are excluded from percentage calculation
                    case 'Absent':
                    default: // If no record exists, count as absent
                        absent++;
                        break;
                }
            });

            const totalForPercentage = present + absent + leave;
            const percentage = totalForPercentage > 0 ? (present / totalForPercentage) * 100 : 0;
            return { percentage, present, absent, leave };
        };

        switch (viewMode) {
            case 'Month': {
                periodLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(year, month, day);
                    const { percentage, present, absent, leave } = calculateDailyStats(date);
                    data.push({
                        name: day.toString(),
                        fullDate: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                        percentage, present, absent, leave
                    });
                }
                break;
            }
            case 'Week': {
                const startOfWeek = new Date(currentDate);
                startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                periodLabel = `${startOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`;

                for (let i = 0; i < 7; i++) {
                    const date = new Date(startOfWeek);
                    date.setDate(startOfWeek.getDate() + i);
                    const { percentage, present, absent, leave } = calculateDailyStats(date);
                    data.push({
                        name: date.toLocaleDateString('default', { weekday: 'short' }),
                        fullDate: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                        percentage, present, absent, leave
                    });
                }
                break;
            }
            case 'Year': {
                periodLabel = year.toString();
                for (let m = 0; m < 12; m++) {
                    const startOfMonth = new Date(year, m, 1);
                    const endOfMonth = new Date(year, m + 1, 0);
                    let totalPresent = 0, totalAbsent = 0, totalLeave = 0;

                    for (let day = startOfMonth.getDate(); day <= endOfMonth.getDate(); day++) {
                        const date = new Date(year, m, day);
                        const stats = calculateDailyStats(date);
                        totalPresent += stats.present;
                        totalAbsent += stats.absent;
                        totalLeave += stats.leave;
                    }
                    
                    const totalForPercentage = totalPresent + totalAbsent + totalLeave;
                    const percentage = totalForPercentage > 0 ? (totalPresent / totalForPercentage) * 100 : 0;
                    
                    data.push({
                        name: new Date(year, m, 1).toLocaleString('default', { month: 'short' }),
                        fullDate: new Date(year, m, 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
                        percentage, present: totalPresent, absent: totalAbsent, leave: totalLeave
                    });
                }
                break;
            }
        }

        const validDataPoints = data.filter(item => (item.present + item.absent + item.leave) > 0);
        const totalPercentage = validDataPoints.reduce((sum, item) => sum + item.percentage, 0);
        const overallAverage = validDataPoints.length > 0 ? totalPercentage / validDataPoints.length : 0;

        return { chartData: data, overallAverage, periodLabel };

    }, [records, students, viewMode, currentDate]);
    
    const handleNav = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        const d = direction === 'prev' ? -1 : 1;
        switch (viewMode) {
            case 'Month': newDate.setMonth(newDate.getMonth() + d); break;
            case 'Week': newDate.setDate(newDate.getDate() + (7 * d)); break;
            case 'Year': newDate.setFullYear(newDate.getFullYear() + d); break;
        }
        setCurrentDate(newDate);
    };

    return (
        <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-800 dark:via-slate-900 dark:to-black p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-4 gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300">Attendance Performance</h3>
                    <p className="text-5xl font-bold text-gray-800 dark:text-white mt-1">{overallAverage.toFixed(1)}<span className="text-2xl">%</span></p>
                </div>
                <div className="flex bg-gray-200/80 dark:bg-gray-700/80 rounded-lg p-1">
                    {(['Week', 'Month', 'Year'] as ViewMode[]).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${viewMode === mode ? 'bg-white dark:bg-dark-card shadow' : 'text-gray-600 dark:text-gray-300'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

             <div className="flex items-center justify-center gap-4 my-4">
                <button onClick={() => handleNav('prev')} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronLeftIcon className="h-5 w-5"/></button>
                <span className="font-semibold text-gray-700 dark:text-gray-300 w-48 text-center">{periodLabel}</span>
                <button onClick={() => handleNav('next')} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><ChevronRightIcon className="h-5 w-5"/></button>
            </div>

            {chartData.length > 0 ? (
                <div style={{ width: '100%', height: 250 }}>
                    <ResponsiveContainer>
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#A78BFA" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'currentColor' }} />
                            <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 12, fill: 'currentColor' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                                type="monotone" 
                                dataKey="percentage" 
                                stroke="#8B5CF6" 
                                strokeWidth={2} 
                                fillOpacity={1} 
                                fill="url(#chartGradient)" 
                                activeDot={<CustomActiveDot />} 
                                name="Attendance"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="h-[250px] flex items-center justify-center text-center py-16 text-gray-500 dark:text-gray-400">
                    <p>No attendance data to display for this period.</p>
                </div>
            )}
        </div>
    );
};

export default AttendanceAnalytics;
