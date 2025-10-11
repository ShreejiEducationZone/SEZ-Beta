import React, { useMemo, useState } from 'react';
import { Student, Test, TestPriority } from '../../types';
// FIX: Import useReports hook
import { useReports } from '../../context/ReportsContext';
import { FaChartBar } from 'react-icons/fa';

interface SPTestsPageProps {
    student: Student;
}

const PRIORITY_STYLES: Record<TestPriority, string> = {
    High: 'bg-danger-muted text-danger-muted-foreground',
    Medium: 'bg-warning-muted text-warning-muted-foreground',
    Low: 'bg-info-muted text-info-muted-foreground',
};

const TestCard: React.FC<{ test: Test }> = ({ test }) => {
    const scorePercentage = (test.marksObtained != null && test.totalMarks != null && test.totalMarks > 0)
        ? Math.round((test.marksObtained / test.totalMarks) * 100)
        : null;

    const getScoreColor = (s: number | null) => {
        if (s === null) return 'text-muted-foreground';
        if (s >= 80) return 'text-success';
        if (s >= 60) return 'text-warning';
        return 'text-danger';
    };

    return (
        <div className="bg-card rounded-2xl shadow-soft border border-border p-4 flex flex-col gap-2">
             <div className="flex justify-between items-start gap-2">
                <h4 className="font-bold text-foreground">{test.title}</h4>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${PRIORITY_STYLES[test.priority]}`}>{test.priority}</span>
            </div>
            <p className="text-sm text-muted-foreground">{test.subject}</p>
            <p className="text-sm text-card-foreground">Syllabus: {test.chapters.map(c => c.name).join(', ')}</p>

            {test.status === 'Completed' && (
                <div className="mt-2 pt-2 border-t border-border text-sm font-semibold">
                    Score: <span className={getScoreColor(scorePercentage)}>{test.marksObtained}/{test.totalMarks} ({scorePercentage}%)</span>
                </div>
            )}
             {test.status === 'Absent' && (
                <div className="mt-2 pt-2 border-t border-border text-sm font-semibold text-muted-foreground">
                    Status: Absent
                </div>
            )}
             <div className="mt-auto pt-2 border-t border-border text-xs font-semibold text-muted-foreground">
                Date: {new Date(test.testDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
        </div>
    );
};


const SPTestsPage: React.FC<SPTestsPageProps> = ({ student }) => {
    // FIX: Get tests from useReports hook
    const { tests } = useReports();
    const [activeTab, setActiveTab] = useState<'Upcoming' | 'Completed'>('Upcoming');

    const studentTests = useMemo(() => {
        const myTests = tests.filter(t => t.studentId === student.id);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const upcoming = myTests
            .filter(t => t.status === 'Upcoming' && new Date(t.testDate) >= today)
            .sort((a,b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());
        
        const completed = myTests
            .filter(t => t.status === 'Completed' || t.status === 'Absent')
            .sort((a,b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
        
        return { upcoming, completed };
    }, [tests, student.id]);

    const itemsToShow = activeTab === 'Upcoming' ? studentTests.upcoming : studentTests.completed;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">My Tests</h1>
            <p className="text-muted-foreground mb-6">View your upcoming and completed test schedule.</p>

            <div className="border-b border-border mb-6">
                <nav className="-mb-px flex space-x-6">
                    {(['Upcoming', 'Completed'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab} ({tab === 'Upcoming' ? studentTests.upcoming.length : studentTests.completed.length})
                        </button>
                    ))}
                </nav>
            </div>

            {itemsToShow.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {itemsToShow.map(item => <TestCard key={item.id} test={item} />)}
                </div>
            ) : (
                <div className="text-center py-20 text-muted-foreground bg-muted/30 rounded-2xl flex flex-col items-center justify-center">
                    <FaChartBar className="h-16 w-16 mb-4 opacity-50"/>
                    <h3 className="text-xl font-semibold">No {activeTab.toLowerCase()} tests.</h3>
                    <p>Check back later for updates.</p>
                </div>
            )}
        </div>
    );
};

export default SPTestsPage;