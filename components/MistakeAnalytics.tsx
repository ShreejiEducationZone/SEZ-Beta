import React, { useMemo, useState } from 'react';
import { Test } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList } from 'recharts';
import ChartBarIcon from './icons/ChartBarIcon';
import StarIcon from './icons/StarIcon';
import SubjectsIcon from './icons/SubjectsIcon';
import SelectField from './form/SelectField';

interface MistakeAnalyticsProps {
    tests: Test[];
}

// Consistent colors for the bar chart
const BAR_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#6366F1', '#14B8A6', '#D97706'
];

const StatCard: React.FC<{icon: React.ElementType, title: string, value: string | number}> = ({ icon: Icon, title, value }) => (
    <div className="flex items-center gap-4 p-4 bg-light-bg dark:bg-dark-bg/50 rounded-lg">
        <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full">
            <Icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white truncate" title={String(value)}>{value}</p>
        </div>
    </div>
);

const MistakeAnalytics: React.FC<MistakeAnalyticsProps> = ({ tests }) => {
    const [selectedSubject, setSelectedSubject] = useState('All');

    const uniqueSubjects = useMemo(() => {
        const subjects = new Set(tests.map(t => t.subject));
        return ['All', ...Array.from(subjects).sort()];
    }, [tests]);

    const analyticsData = useMemo(() => {
        const mistakesBySubject: Record<string, number> = {};
        tests.forEach(test => {
            if (test.mistakeTypes && test.mistakeTypes.length > 0) {
                if (!mistakesBySubject[test.subject]) mistakesBySubject[test.subject] = 0;
                mistakesBySubject[test.subject] += test.mistakeTypes.length;
            }
        });

        const subjectWithMostMistakes = Object.entries(mistakesBySubject).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        
        const filteredTests = selectedSubject === 'All' 
            ? tests 
            : tests.filter(t => t.subject === selectedSubject);

        const mistakeCounts = new Map<string, number>();
        let totalMistakes = 0;
        filteredTests.forEach(test => {
            if (test.mistakeTypes) {
                test.mistakeTypes.forEach(mistake => {
                    mistakeCounts.set(mistake, (mistakeCounts.get(mistake) || 0) + 1);
                    totalMistakes++;
                });
            }
        });
        
        if (totalMistakes === 0) {
            return { totalMistakes: 0, mostFrequentMistake: 'N/A', subjectWithMostMistakes, chartData: [] };
        }

        const sortedMistakes = Array.from(mistakeCounts.entries()).sort((a, b) => b[1] - a[1]);
        
        const mostFrequentMistake = sortedMistakes[0]?.[0] || 'N/A';
        
        const chartData = sortedMistakes.map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / totalMistakes) * 100),
        }));

        return { totalMistakes, mostFrequentMistake, subjectWithMostMistakes, chartData };
    }, [tests, selectedSubject]);

    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-bold">Mistake Analytics</h3>
                <div className="w-full sm:w-56">
                    <SelectField
                        label="Filter by Subject"
                        name="subjectFilter"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        options={uniqueSubjects}
                    />
                </div>
            </div>

            {analyticsData.totalMistakes > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <StatCard icon={ChartBarIcon} title="Total Mistakes" value={analyticsData.totalMistakes} />
                        <StatCard icon={StarIcon} title="Most Frequent Mistake" value={analyticsData.mostFrequentMistake} />
                        <StatCard icon={SubjectsIcon} title="Subject w/ Most Mistakes" value={analyticsData.subjectWithMostMistakes} />
                    </div>
                    <div className="lg:col-span-2 min-h-[300px] max-h-[400px] overflow-y-auto thin-scrollbar pr-2">
                         <ResponsiveContainer width="100%" height={Math.max(300, analyticsData.chartData.length * 30)}>
                            <BarChart
                                data={analyticsData.chartData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <XAxis type="number" hide />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={120}
                                    tick={{ fontSize: 12, fill: 'currentColor' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                                    contentStyle={{
                                        backgroundColor: 'var(--light-bg)',
                                        borderColor: '#e5e7eb',
                                        borderRadius: '0.5rem',
                                    }}
                                    wrapperClassName="dark:!bg-dark-bg dark:!border-gray-600"
                                    formatter={(value: number, name, props) => [`${props.payload.percentage}% (${value} times)`, 'Occurrence']}
                                />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                                    <LabelList dataKey="percentage" position="right" formatter={(value: number) => `${value}%`} style={{ fill: 'currentColor', fontSize: '12px' }} />
                                    {analyticsData.chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                    <h3 className="text-lg font-semibold">No mistake data available.</h3>
                    <p>Log completed tests with mistake types to see analytics here.</p>
                </div>
            )}
        </div>
    );
};

export default MistakeAnalytics;
