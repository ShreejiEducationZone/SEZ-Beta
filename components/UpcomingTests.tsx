import React, { useMemo } from 'react';
import { Test, TestPriority } from '../types';

interface UpcomingTestsProps {
    tests: Test[];
    onTestSelect: (test: Test) => void;
}

const PRIORITY_BADGE_STYLES: Record<TestPriority, string> = {
    High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    Medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const UpcomingTests: React.FC<UpcomingTestsProps> = ({ tests, onTestSelect }) => {
    
    const sortedTests = useMemo(() => {
        return [...tests].sort((a,b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());
    }, [tests]);

    const calculateDaysLeft = (dateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const testDate = new Date(dateStr);
        testDate.setUTCHours(0,0,0,0);
        const diffTime = testDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };


    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-bold">Upcoming Schedule</h3>
            </div>
            
            {sortedTests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedTests.map(test => {
                        const daysLeft = calculateDaysLeft(test.testDate);
                        const daysLeftText = daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Today' : `${daysLeft}d left`;
                        
                        return (
                            <div key={test.id} onClick={() => onTestSelect(test)} className="bg-light-bg dark:bg-dark-bg/50 p-4 rounded-lg cursor-pointer hover:shadow-lg transition-shadow border-l-4 border-blue-400">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-gray-200">{test.title}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{test.subject}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_BADGE_STYLES[test.priority]}`}>{test.priority}</span>
                                </div>
                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate" title={test.chapters.map(c => c.name).join(', ')}>
                                    {test.chapters.map(c => c.name).join(', ')}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">📅 {new Date(test.testDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', timeZone: 'UTC'})}</p>
                                    <p className={`text-sm font-semibold ${daysLeft < 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>{daysLeftText}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <h3 className="text-lg font-semibold">No upcoming tests scheduled.</h3>
                    <p>Click "+ Add Test Record" to schedule a new test.</p>
                </div>
            )}
        </div>
    );
};

export default UpcomingTests;
