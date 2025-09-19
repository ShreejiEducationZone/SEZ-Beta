import React, { useMemo } from 'react';
import { Test } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceArea } from 'recharts';

interface ScoreTrendChartProps {
    completedTests: Test[];
}

// Consistent colors for subjects
const subjectColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#6366F1', '#14B8A6', '#D97706'
];

const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({ completedTests }) => {
    const { chartData, subjects } = useMemo(() => {
        if (completedTests.length === 0) return { chartData: [], subjects: [] };

        const subjectsSet = new Set<string>();
        const dataByDate: { [date: string]: any } = {};

        // Sort tests by date to ensure the chart is chronological
        const sortedTests = [...completedTests].sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());

        sortedTests.forEach(test => {
            if (test.marksObtained != null && test.totalMarks != null && test.totalMarks > 0) {
                subjectsSet.add(test.subject);
                const date = new Date(test.testDate).toISOString().split('T')[0];
                const percentage = Math.round((test.marksObtained / test.totalMarks) * 100);
                
                if (!dataByDate[date]) {
                    dataByDate[date] = { 
                        date, 
                        formattedDate: new Date(test.testDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) 
                    };
                }
                dataByDate[date][test.subject] = percentage;
            }
        });

        const chartData = Object.values(dataByDate);
        
        return { chartData, subjects: Array.from(subjectsSet) };
    }, [completedTests]);

    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold mb-4">Subject-wise Score Trend</h3>
            {chartData.length > 1 ? (
                 <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.2} />
                            <XAxis dataKey="formattedDate" tick={{ fontSize: 12, fill: 'currentColor' }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'currentColor' }} unit="%" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--light-card)',
                                    borderColor: '#e5e7eb',
                                    borderRadius: '0.5rem',
                                    color: 'var(--dark-bg)'
                                }}
                                itemStyle={{color: 'var(--dark-bg)'}}
                                wrapperClassName="dark:!bg-dark-card dark:!border-gray-600 dark:[&_.recharts-tooltip-item]:!text-gray-100"
                                labelStyle={{ fontWeight: 'bold' }}
                                formatter={(value: number, name: string) => [`${value}%`, name]}
                            />
                            <Legend wrapperStyle={{fontSize: "14px"}} />
                            
                            <ReferenceArea y1={80} y2={100} fill="#4ADE80" fillOpacity={0.1} label={{ value: 'Strong', position: 'insideTopRight', fill: '#166534', fontSize: 12 }} />
                            <ReferenceArea y1={60} y2={80} fill="#FACC15" fillOpacity={0.1} label={{ value: 'Average', position: 'insideTopRight', fill: '#854D0E', fontSize: 12 }} />
                            <ReferenceArea y1={0} y2={60} fill="#F87171" fillOpacity={0.1} label={{ value: 'Weak', position: 'insideTopRight', fill: '#991B1B', fontSize: 12 }} />

                            {subjects.map((subject, index) => (
                                <Line
                                    key={subject}
                                    type="monotone"
                                    dataKey={subject}
                                    stroke={subjectColors[index % subjectColors.length]}
                                    strokeWidth={2}
                                    connectNulls
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                    <h3 className="text-lg font-semibold">Not enough data to show a trend.</h3>
                    <p>At least two completed tests are required to plot a trend line.</p>
                </div>
            )}
        </div>
    );
};

export default ScoreTrendChart;
