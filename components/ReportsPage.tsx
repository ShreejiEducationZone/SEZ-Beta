import React, { useState, useMemo } from 'react';
import { Student, SubjectData, Test } from '../types';
import TestForm from './TestForm';
import TestDetailModal from './TestDetailModal';
import ScoreTrendChart from './ScoreTrendChart';
import UpcomingTests from './UpcomingTests';
import CompletedTestsTable from './CompletedTestsTable';

interface ReportsPageProps {
    students: Student[];
    allStudentSubjects: { [key: string]: { studentId: string; subjects: SubjectData[] } };
    tests: Test[];
    onSaveTest: (test: Test) => void;
    onDeleteTest: (testId: string) => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ students, allStudentSubjects, tests, onSaveTest, onDeleteTest }) => {
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [isTestFormOpen, setIsTestFormOpen] = useState(false);
    const [editingTest, setEditingTest] = useState<Test | null>(null);
    const [viewingTest, setViewingTest] = useState<Test | null>(null);
    
    const activeStudents = useMemo(() => students.filter(s => !s.isArchived), [students]);

    const selectedStudent = useMemo(() => {
        return students.find(s => s.id === selectedStudentId);
    }, [selectedStudentId, students]);

    const testsForSelectedStudent = useMemo(() => {
        if (!selectedStudentId) return [];
        return tests.filter(t => t.studentId === selectedStudentId);
    }, [selectedStudentId, tests]);

    const completedTests = useMemo(() => {
        return testsForSelectedStudent.filter(t => t.status === 'Completed');
    }, [testsForSelectedStudent]);

    const upcomingTests = useMemo(() => {
        return testsForSelectedStudent.filter(t => t.status === 'Upcoming');
    }, [testsForSelectedStudent]);

    const stats = useMemo(() => {
        const totalTests = testsForSelectedStudent.length;
        if (completedTests.length === 0) {
            return { avgScore: 0, strongestSubject: 'N/A', totalTests };
        }
        
        const totalMarks = completedTests.reduce((sum, t) => sum + (t.totalMarks || 0), 0);
        const totalObtained = completedTests.reduce((sum, t) => sum + (t.marksObtained || 0), 0);
        const avgScore = totalMarks > 0 ? Math.round((totalObtained / totalMarks) * 100) : 0;
        
        const scoresBySubject: { [key: string]: { total: number; count: number } } = {};
        completedTests.forEach(t => {
            if (t.marksObtained != null && t.totalMarks != null && t.totalMarks > 0) {
                if (!scoresBySubject[t.subject]) scoresBySubject[t.subject] = { total: 0, count: 0 };
                const percentage = (t.marksObtained / t.totalMarks) * 100;
                scoresBySubject[t.subject].total += percentage;
                scoresBySubject[t.subject].count += 1;
            }
        });

        let strongestSubject = 'N/A';
        let maxAvg = 0;
        for (const subject in scoresBySubject) {
            const avg = scoresBySubject[subject].total / scoresBySubject[subject].count;
            if (avg > maxAvg) {
                maxAvg = avg;
                strongestSubject = subject;
            }
        }
        
        return { avgScore, strongestSubject, totalTests };
    }, [completedTests, testsForSelectedStudent]);

    const handleAddTest = () => {
        setEditingTest(null);
        setIsTestFormOpen(true);
    };

    const handleEditTest = (test: Test) => {
        setEditingTest(test);
        setIsTestFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsTestFormOpen(false);
        setEditingTest(null);
    };

    return (
        <div>
            <p className="mt-2 mb-6 text-gray-600 dark:text-gray-400 max-w-4xl">
                Analyze student test performance, track trends, and manage upcoming assessments. Select a student to begin.
            </p>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex-grow">
                     <label htmlFor="student-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Student</label>
                    <select
                        id="student-select"
                        value={selectedStudentId}
                        onChange={e => setSelectedStudentId(e.target.value)}
                        className="mt-1 block w-full sm:w-72 h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-brand-blue"
                    >
                        <option value="">-- Select a Student --</option>
                        {activeStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                {selectedStudent && (
                    <button
                        onClick={handleAddTest}
                        className="bg-brand-blue text-white h-10 px-4 rounded-md hover:bg-blue-600 transition-colors text-sm font-semibold flex-shrink-0"
                    >
                        + Add Test Record
                    </button>
                )}
            </div>

            {selectedStudent ? (
                <div className="space-y-12">
                    {/* Stats Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-sm text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Average Score</p>
                            <p className="text-2xl font-bold">{stats.avgScore}%</p>
                        </div>
                        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-sm text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Strongest Subject</p>
                            <p className="text-2xl font-bold">{stats.strongestSubject}</p>
                        </div>
                        <div className="bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-sm text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Tests Logged</p>
                            <p className="text-2xl font-bold">{stats.totalTests}</p>
                        </div>
                    </div>
                    
                    {/* Main Content */}
                    <UpcomingTests tests={upcomingTests} onTestSelect={setViewingTest} />
                    <ScoreTrendChart completedTests={completedTests} />
                    <CompletedTestsTable tests={completedTests} onTestSelect={setViewingTest} onEditTest={handleEditTest} onDeleteTest={onDeleteTest} />

                </div>
            ) : (
                <div className="text-center py-16 bg-light-card dark:bg-dark-card rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300">Please select a student to view their test reports.</h3>
                    <p className="text-gray-500 dark:text-gray-400">Once selected, you can add new test records and view their performance data.</p>
                </div>
            )}
            
            {isTestFormOpen && selectedStudent && (
                <TestForm
                    student={selectedStudent}
                    studentSubjects={allStudentSubjects[selectedStudent.id]?.subjects || []}
                    test={editingTest}
                    onSave={onSaveTest}
                    onCancel={handleCloseForm}
                />
            )}
            
            {viewingTest && selectedStudent && (
                <TestDetailModal
                    test={viewingTest}
                    student={selectedStudent}
                    onClose={() => setViewingTest(null)}
                />
            )}
        </div>
    );
};

export default ReportsPage;
