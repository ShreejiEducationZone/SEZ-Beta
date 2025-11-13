import React, { useMemo, useState } from 'react';
import { Student } from '../../types';
import { useWorkPool } from '../../context/WorkPoolContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
import { ParentPage } from '../ParentsPortal';
import { useData } from '../../context/DataContext';
import { FaChevronLeft, FaSun, FaMoon, FaSignOutAlt } from 'react-icons/fa';
import PlaceholderAvatar from '../PlaceholderAvatar';

const PPPerformancePage: React.FC<{ student: Student, onNavigate: (page: ParentPage) => void; }> = ({ student, onNavigate }) => {
    const { tests } = useWorkPool();
    const { logout, darkMode, setDarkMode } = useData();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const completedTests = useMemo(() => {
        return tests
            .filter(t => t.studentId === student.id && t.status === 'Completed')
            .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());
    }, [tests, student.id]);
    
    const performanceStats = useMemo(() => {
        const studentTests = tests.filter(t => t.studentId === student.id && t.status === 'Completed' && t.marksObtained != null && t.totalMarks != null && t.totalMarks > 0);

        if (studentTests.length === 0) {
            return { overallPercentage: 0, subjectAverages: [] };
        }

        const totalObtained = studentTests.reduce((sum, test) => sum + test.marksObtained!, 0);
        const totalMarks = studentTests.reduce((sum, test) => sum + test.totalMarks!, 0);
        const overallPercentage = totalMarks > 0 ? Math.round((totalObtained / totalMarks) * 100) : 0;

        // FIX: The initial value of the `reduce` accumulator was an untyped empty object `{}`,
        // causing TypeScript to infer its type as `unknown` inside the callback.
        // By providing an explicit type `Record<string, { obtained: number; total: number }>`,
        // we ensure `acc` is correctly typed, resolving the property access errors.
        const scoresBySubject = studentTests.reduce((acc, test) => {
            if (!acc[test.subject]) {
                acc[test.subject] = { obtained: 0, total: 0 };
            }
            acc[test.subject].obtained += test.marksObtained!;
            acc[test.subject].total += test.totalMarks!;
            return acc;
        }, {} as Record<string, { obtained: number; total: number }>);

        const subjectAverages = Object.entries(scoresBySubject).map(([subject, scores]) => ({
            subject,
            percentage: scores.total > 0 ? Math.round((scores.obtained / scores.total) * 100) : 0,
        })).sort((a,b) => b.percentage - a.percentage);

        return { overallPercentage, subjectAverages };
    }, [tests, student.id]);

    const chartData = completedTests.map(t => ({
        name: new Date(t.testDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        score: t.marksObtained && t.totalMarks ? Math.round((t.marksObtained / t.totalMarks) * 100) : 0,
        subject: t.subject
    })).slice(-5); // Last 5 tests

    return (
        <div className="space-y-8 pb-20">
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
                    Performance
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

            {/* Overall Performance Card */}
            <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-6 text-primary-foreground shadow-lg">
                <h3 className="text-lg font-semibold opacity-90 mb-1">Overall Performance</h3>
                <div className="flex items-end gap-2 mb-4">
                    <span className="text-5xl font-bold">{performanceStats.overallPercentage}%</span>
                    <span className="text-base opacity-80 mb-1">Average Score</span>
                </div>
                {performanceStats.subjectAverages.length > 0 ? (
                    <div>
                        <h4 className="text-sm font-semibold opacity-90 mb-2">By Subject</h4>
                        <div className="space-y-2 max-h-28 overflow-y-auto thin-scrollbar pr-2">
                            {performanceStats.subjectAverages.map(({ subject, percentage }) => (
                                <div key={subject} className="flex items-center gap-4">
                                    <span className="w-24 truncate text-sm font-medium opacity-90" title={subject}>{subject}</span>
                                    <div className="flex-grow bg-black/20 rounded-full h-2.5">
                                        <div className="bg-white h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                    <span className="w-10 text-right text-sm font-bold">{percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-xs opacity-80 mt-2">No completed test scores available to calculate performance.</p>
                )}
            </div>

            {/* Recent Test Chart */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-lg text-foreground mb-4">Recent Test Scores</h3>
                {chartData.length > 0 ? (
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                                <Tooltip 
                                    cursor={false}
                                    contentStyle={{ background: 'transparent', border: 'none' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))', textShadow: '0 1px 3px hsl(var(--background))', fontWeight: 'bold' }}
                                    labelStyle={{ color: 'hsl(var(--foreground))', textShadow: '0 1px 3px hsl(var(--background))' }}
                                />
                                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.score >= 80 ? 'hsl(var(--success))' : entry.score >= 60 ? 'hsl(var(--warning))' : 'hsl(var(--danger))'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-8 italic">No test data available yet.</p>
                )}
            </div>

            {/* Recent Tests List */}
            <div>
                <h3 className="font-bold text-lg text-foreground mb-3">History</h3>
                <div className="space-y-3">
                    {completedTests.slice().reverse().slice(0, 5).map(test => {
                        const score = test.marksObtained && test.totalMarks ? Math.round((test.marksObtained / test.totalMarks) * 100) : 0;
                        return (
                            <div key={test.id} className="bg-card p-4 rounded-xl border border-border flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-foreground">{test.subject}</p>
                                    <p className="text-xs text-muted-foreground">{test.title}</p>
                                </div>
                                <div className={`text-right ${score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-danger'}`}>
                                    <span className="font-bold text-lg">{score}%</span>
                                    <p className="text-[10px] text-muted-foreground">{new Date(test.testDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        )
                    })}
                    {completedTests.length === 0 && <div className="text-center text-muted-foreground text-sm">No completed tests found.</div>}
                </div>
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

export default PPPerformancePage;
