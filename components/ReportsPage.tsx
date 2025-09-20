import React, { useState, useMemo, useCallback } from 'react';
import { Student, SubjectData, Test } from '../types';
import TestForm from './TestForm';
import TestDetailModal from './TestDetailModal';
import ScoreTrendChart from './ScoreTrendChart';
import TestSchedule from './TestSchedule';
import CompletedTestsTable from './CompletedTestsTable';
import ReportsFilterBar from './ReportsFilterBar';
import StudentTestReportCard from './StudentTestReportCard';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import MistakeAnalytics from './MistakeAnalytics';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StarIcon from './icons/StarIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import CalendarIcon from './icons/CalendarIcon';
import XCircleIcon from './icons/XCircleIcon';


interface ReportsPageProps {
    students: Student[];
    allStudentSubjects: { [key: string]: { studentId: string; subjects: SubjectData[] } };
    tests: Test[];
    onSaveTest: (test: Test) => void;
    onDeleteTest: (testId: string) => void;
    allMistakeTypes: string[];
}

const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // green-500
    if (score >= 60) return '#F59E0B'; // yellow-500
    return '#EF4444'; // red-500
};

const StatCard: React.FC<{icon: React.ElementType, iconColor: string, bgColor: string, darkBgColor: string, title: string, value: string | number}> = ({ icon: Icon, iconColor, bgColor, darkBgColor, title, value }) => (
    <div className={`flex items-center gap-4 p-4 bg-light-bg dark:bg-dark-bg/50 rounded-lg`}>
        <div className={`p-2 ${bgColor} ${darkBgColor} rounded-full`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white truncate" title={String(value)}>{value}</p>
        </div>
    </div>
);


const ReportsPage: React.FC<ReportsPageProps> = ({ students, allStudentSubjects, tests, onSaveTest, onDeleteTest, allMistakeTypes }) => {
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [isTestFormOpen, setIsTestFormOpen] = useState(false);
    const [editingTest, setEditingTest] = useState<Test | null>(null);
    const [viewingTest, setViewingTest] = useState<Test | null>(null);
    
    const [studentFilters, setStudentFilters] = useState({
        searchQuery: '',
        strongestSubject: '',
    });

    const activeStudents = useMemo(() => students.filter(s => !s.isArchived), [students]);

    const studentPerformanceData = useMemo(() => {
        const data = new Map<string, { avgScore: number; strongestSubject: string; completedTests: number; upcomingTests: number; absentTests: number; }>();
        
        activeStudents.forEach(student => {
            const studentTests = tests.filter(t => t.studentId === student.id);
            const completedStudentTests = studentTests.filter(t => t.status === 'Completed');
            const upcomingStudentTests = studentTests.filter(t => t.status === 'Upcoming');
            const absentStudentTests = studentTests.filter(t => t.status === 'Absent');

            if (studentTests.length === 0) {
                data.set(student.id, { avgScore: 0, strongestSubject: 'N/A', completedTests: 0, upcomingTests: 0, absentTests: 0 });
                return;
            }

            let avgScore = 0;
            let strongestSubject = 'N/A';
            
            if (completedStudentTests.length > 0) {
                const totalMarks = completedStudentTests.reduce((sum, t) => sum + (t.totalMarks || 0), 0);
                const totalObtained = completedStudentTests.reduce((sum, t) => sum + (t.marksObtained || 0), 0);
                avgScore = totalMarks > 0 ? Math.round((totalObtained / totalMarks) * 100) : 0;
        
                const scoresBySubject: { [key: string]: { total: number; count: number } } = {};
                completedStudentTests.forEach(t => {
                    if (t.marksObtained != null && t.totalMarks != null && t.totalMarks > 0) {
                        if (!scoresBySubject[t.subject]) scoresBySubject[t.subject] = { total: 0, count: 0 };
                        const percentage = (t.marksObtained / t.totalMarks) * 100;
                        scoresBySubject[t.subject].total += percentage;
                        scoresBySubject[t.subject].count += 1;
                    }
                });

                let maxAvg = 0;
                for (const subject in scoresBySubject) {
                    const avg = scoresBySubject[subject].total / scoresBySubject[subject].count;
                    if (avg > maxAvg) {
                        maxAvg = avg;
                        strongestSubject = subject;
                    }
                }
            }
            
            data.set(student.id, { avgScore, strongestSubject, completedTests: completedStudentTests.length, upcomingTests: upcomingStudentTests.length, absentTests: absentStudentTests.length });
        });
        return data;
    }, [activeStudents, tests]);

    const allSubjectsForFilter = useMemo(() => {
        const subjects = new Set<string>();
        tests.forEach(test => subjects.add(test.subject));
        return Array.from(subjects).sort();
    }, [tests]);

    const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setStudentFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    }, []);

    const clearFilters = useCallback(() => {
        setStudentFilters({ searchQuery: '', strongestSubject: '' });
    }, []);

    const filteredStudents = useMemo(() => {
        return activeStudents.filter(student => {
            const stats = studentPerformanceData.get(student.id);
            if (!stats) return true;

            if (studentFilters.searchQuery && !student.name.toLowerCase().includes(studentFilters.searchQuery.toLowerCase())) return false;
            if (studentFilters.strongestSubject && stats.strongestSubject !== studentFilters.strongestSubject) return false;

            return true;
        });
    }, [activeStudents, studentPerformanceData, studentFilters]);

    const selectedStudent = useMemo(() => {
        return students.find(s => s.id === selectedStudentId);
    }, [selectedStudentId, students]);

    const testsForSelectedStudent = useMemo(() => {
        if (!selectedStudentId) return [];
        return tests.filter(t => t.studentId === selectedStudentId);
    }, [selectedStudentId, tests]);

    const completedAndAbsentTests = useMemo(() => {
        return testsForSelectedStudent.filter(t => t.status === 'Completed' || t.status === 'Absent');
    }, [testsForSelectedStudent]);

    const stats = useMemo(() => {
        if (!selectedStudentId || !studentPerformanceData.has(selectedStudentId)) {
            return { avgScore: 0, strongestSubject: 'N/A', completedTests: 0, upcomingTests: 0, absentTests: 0 };
        }
        return studentPerformanceData.get(selectedStudentId)!;
    }, [selectedStudentId, studentPerformanceData]);


    const handleAddTest = () => {
        setEditingTest(null);
        setIsTestFormOpen(true);
    };

    const handleEditTest = (test: Test) => {
        setViewingTest(null);
        setEditingTest(test);
        setIsTestFormOpen(true);
    };

    const handleAddMarking = (test: Test) => {
        setViewingTest(null);
        setEditingTest(test);
        setIsTestFormOpen(true);
    };
    
    const handleDeleteAndCloseModal = (testId: string) => {
        onDeleteTest(testId);
        setViewingTest(null);
    };

    const handleCloseForm = () => {
        setIsTestFormOpen(false);
        setEditingTest(null);
    };

    const handleSelectStudent = (studentId: string) => {
        setSelectedStudentId(studentId);
    };
    
    const handleBackToList = () => {
        setSelectedStudentId(null);
    };

    const scoreData = useMemo(() => [
        { name: 'Score', value: stats.avgScore },
        { name: 'Remaining', value: 100 - stats.avgScore }
    ], [stats.avgScore]);


    return (
        <div>
            {!selectedStudent ? (
                // LIST VIEW
                <>
                    <p className="mt-2 mb-6 text-gray-600 dark:text-gray-400 max-w-4xl">
                        Analyze student test performance, track trends, and manage upcoming assessments. Select a student to begin.
                    </p>
                    
                    <ReportsFilterBar
                        filters={studentFilters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={clearFilters}
                        allSubjects={allSubjectsForFilter}
                    />

                    {filteredStudents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredStudents.map(student => {
                                const studentStats = studentPerformanceData.get(student.id);
                                if (!studentStats) return null;
                                return (
                                    <StudentTestReportCard
                                        key={student.id}
                                        student={student}
                                        stats={studentStats}
                                        onSelect={() => handleSelectStudent(student.id)}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                            <h3 className="text-xl font-semibold">No students match your filters.</h3>
                            <p>Try clearing the filters to see all students.</p>
                        </div>
                    )}
                </>
            ) : (
                // DETAIL VIEW
                <div>
                    <div className="mb-8 flex justify-between items-center">
                        <button
                            onClick={handleBackToList}
                            className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-brand-blue transition-colors"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                            Back to All Students
                        </button>
                        <button
                            onClick={handleAddTest}
                            className="bg-brand-blue text-white h-10 px-4 rounded-md hover:bg-blue-600 transition-colors text-sm font-semibold flex-shrink-0"
                        >
                            + Add Test Record
                        </button>
                    </div>

                    <div className="space-y-12">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold">Detailed Report for <span className="text-brand-blue">{selectedStudent.name}</span></h2>
                        </div>
                        
                        <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-8">
                            <div className="relative w-48 h-48 flex-shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={scoreData}
                                            dataKey="value"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="70%"
                                            outerRadius="100%"
                                            startAngle={90}
                                            endAngle={450}
                                            stroke="none"
                                        >
                                            <Cell fill={getScoreColor(stats.avgScore)} />
                                            <Cell fill="var(--light-bg)" className="dark:!fill-[var(--dark-bg)]" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <p className="text-4xl font-bold text-gray-800 dark:text-white">{stats.avgScore}<span className="text-xl">%</span></p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg Score</p>
                                </div>
                            </div>

                             <div className="grid grid-cols-2 gap-6 w-full">
                                <StatCard icon={StarIcon} iconColor="text-yellow-500" bgColor="bg-yellow-100" darkBgColor="dark:bg-yellow-500/20" title="Strongest Subject" value={stats.strongestSubject} />
                                <StatCard icon={CheckCircleIcon} iconColor="text-green-500" bgColor="bg-green-100" darkBgColor="dark:bg-green-500/20" title="Completed Tests" value={stats.completedTests} />
                                <StatCard icon={CalendarIcon} iconColor="text-blue-500" bgColor="bg-blue-100" darkBgColor="dark:bg-blue-500/20" title="Upcoming Tests" value={stats.upcomingTests} />
                                <StatCard icon={XCircleIcon} iconColor="text-red-500" bgColor="bg-red-100" darkBgColor="dark:bg-red-500/20" title="Absent Tests" value={stats.absentTests} />
                            </div>
                        </div>
                        
                        <TestSchedule tests={testsForSelectedStudent} onTestSelect={setViewingTest} />
                        <ScoreTrendChart completedTests={completedAndAbsentTests.filter(t => t.status === 'Completed')} />
                        <MistakeAnalytics tests={completedAndAbsentTests.filter(t => t.status === 'Completed')} />
                        <CompletedTestsTable tests={completedAndAbsentTests} onTestSelect={setViewingTest} onEditTest={handleEditTest} onDeleteTest={onDeleteTest} />
                    </div>
                </div>
            )}
            
            {isTestFormOpen && selectedStudent && (
                <TestForm
                    student={selectedStudent}
                    studentSubjects={allStudentSubjects[selectedStudent.id]?.subjects || []}
                    test={editingTest}
                    onSave={onSaveTest}
                    onCancel={handleCloseForm}
                    allMistakeTypes={allMistakeTypes}
                />
            )}
            
            {viewingTest && selectedStudent && (
                <TestDetailModal
                    test={viewingTest}
                    student={selectedStudent}
                    onClose={() => setViewingTest(null)}
                    onAddMarking={handleAddMarking}
                    onEdit={handleEditTest}
                    onDelete={handleDeleteAndCloseModal}
                />
            )}
        </div>
    );
};

export default ReportsPage;