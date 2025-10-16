import React, { useState, useMemo, useCallback } from 'react';
import { Student, SubjectData, Test, MistakeTypeDefinition, AreaDefinition, WorkItem } from '../types';
import TestDetailModal from './TestDetailModal';
import ScoreTrendChart from './ScoreTrendChart';
import TestSchedule from './TestSchedule';
import ReportsFilterBar from './ReportsFilterBar';
import StudentTestReportCard from './StudentTestReportCard';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import MistakeAnalytics from './MistakeAnalytics';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StarIcon from './icons/StarIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import CalendarIcon from './icons/CalendarIcon';
import XCircleIcon from './icons/XCircleIcon';
import OverallStrengthsWeaknesses from './OverallStrengthsWeaknesses';
// FIX: Import specific context hooks
import { useSyllabus } from '../context/SyllabusContext';
// FIX: Import useStudent to get students data
import { useStudent } from '../context/StudentContext';
import { FaPlus } from 'react-icons/fa';
import { useWorkPool } from '../context/WorkPoolContext';

const getScoreColor = (score: number) => {
    if (score >= 80) return 'hsl(var(--success))';
    if (score >= 60) return 'hsl(var(--warning))';
    return 'hsl(var(--danger))';
};

const StatCard: React.FC<{icon: React.ElementType, iconBgClass: string, iconClass: string, title: string, value: string | number}> = ({ icon: Icon, iconBgClass, iconClass, title, value }) => (
    <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
        <div className={`p-3 rounded-full ${iconBgClass}`}>
            <Icon className={`h-6 w-6 ${iconClass}`} />
        </div>
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground truncate" title={String(value)}>{value}</p>
        </div>
    </div>
);

const ReportsPage: React.FC = () => {
    const { allStudentSubjects } = useSyllabus();
    const { students } = useStudent();
    const { tests, handleSaveTest, handleDeleteTest, workItems, openWorkForm, openTestForm } = useWorkPool();
    
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [viewingTest, setViewingTest] = useState<Test | null>(null);
    const [studentFilters, setStudentFilters] = useState({ searchQuery: '' });

    const activeStudents = useMemo(() => students.filter(s => !s.isArchived), [students]);

    const studentPerformanceData = useMemo(() => {
        const data = new Map<string, { avgScore: number; completedTests: number; upcomingTests: number; absentTests: number; }>();
        activeStudents.forEach(student => {
            const studentTests = tests.filter(t => t.studentId === student.id);
            const completedStudentTests = studentTests.filter(t => t.status === 'Completed');
            let avgScore = 0;
            if (completedStudentTests.length > 0) {
                const totalMarks = completedStudentTests.reduce((sum, t) => sum + (t.totalMarks || 0), 0);
                const totalObtained = completedStudentTests.reduce((sum, t) => sum + (t.marksObtained || 0), 0);
                avgScore = totalMarks > 0 ? Math.round((totalObtained / totalMarks) * 100) : 0;
            }
            data.set(student.id, { avgScore, completedTests: completedStudentTests.length, upcomingTests: studentTests.filter(t => t.status === 'Upcoming').length, absentTests: studentTests.filter(t => t.status === 'Absent').length });
        });
        return data;
    }, [activeStudents, tests]);

    const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setStudentFilters(prev => ({ ...prev, [e.target.name]: e.target.value })), []);
    const clearFilters = useCallback(() => setStudentFilters({ searchQuery: '' }), []);

    const filteredStudents = useMemo(() => {
        return activeStudents.filter(student => {
            if (studentFilters.searchQuery && !student.name.toLowerCase().includes(studentFilters.searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [activeStudents, studentFilters]);

    const selectedStudent = useMemo(() => students.find(s => s.id === selectedStudentId), [selectedStudentId, students]);
    const studentSubjectsForSelected = useMemo(() => selectedStudentId ? allStudentSubjects[selectedStudentId]?.subjects : [], [selectedStudentId, allStudentSubjects]);
    const testsForSelectedStudent = useMemo(() => selectedStudentId ? tests.filter(t => t.studentId === selectedStudentId) : [], [selectedStudentId, tests]);
    const completedAndAbsentTests = useMemo(() => testsForSelectedStudent.filter(t => t.status === 'Completed' || t.status === 'Absent'), [testsForSelectedStudent]);
    const stats = useMemo(() => (selectedStudentId && studentPerformanceData.has(selectedStudentId)) ? studentPerformanceData.get(selectedStudentId)! : { avgScore: 0, completedTests: 0, upcomingTests: 0, absentTests: 0 }, [selectedStudentId, studentPerformanceData]);

    const handleAssignTestAsWork = (test: Test) => {
        if (!selectedStudent) return;
        const alreadyExists = workItems.some(w => w.source === 'test' && w.linkedTestId === test.id);
        if (alreadyExists) {
            alert("A work item for this test has already been created.");
            return;
        }
    
        const workItemToCreate: Partial<WorkItem> = {
            title: `Test Prep: ${test.title}`,
            subject: test.subject,
            chapterNo: test.chapters[0]?.no || 'N/A',
            chapterName: test.chapters[0]?.name || 'Multiple',
            description: `Prepare for the test "${test.title}" scheduled on ${test.testDate}.\nSyllabus includes: ${test.chapters.map(c => c.name).join(', ')}.`,
            dueDate: test.testDate,
            priority: test.priority,
            source: 'test',
            linkedTestId: test.id,
            status: 'Assign',
        };
        
        setViewingTest(null);
        openWorkForm(selectedStudent, workItemToCreate);
    };

    const handleAddTest = () => { if(selectedStudent) openTestForm(selectedStudent); };
    const handleEditTest = (test: Test) => { if(selectedStudent) { setViewingTest(null); openTestForm(selectedStudent, test); } };
    const handleAddMarking = (test: Test) => { if(selectedStudent) { setViewingTest(null); openTestForm(selectedStudent, test); } };
    const handleDeleteAndCloseModal = (testId: string) => { handleDeleteTest(testId); setViewingTest(null); };
    const handleSelectStudent = (studentId: string) => setSelectedStudentId(studentId);
    const handleBackToList = () => setSelectedStudentId(null);
    const scoreData = useMemo(() => [{ name: 'Score', value: stats.avgScore }, { name: 'Remaining', value: 100 - stats.avgScore }], [stats.avgScore]);

    return (
        <div>
            {!selectedStudent ? (
                <>
                    <p className="mt-2 mb-6 text-muted-foreground max-w-4xl">Analyze student test performance, track trends, and manage upcoming assessments. Select a student to begin.</p>
                    <ReportsFilterBar filters={studentFilters} onFilterChange={handleFilterChange} onClearFilters={clearFilters} />
                    {filteredStudents.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredStudents.map(student => {
                                const studentStats = studentPerformanceData.get(student.id);
                                if (!studentStats) return null;
                                return <StudentTestReportCard key={student.id} student={student} stats={studentStats} onSelect={() => handleSelectStudent(student.id)} />;
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-muted-foreground"><h3 className="text-xl font-semibold">No students match your filters.</h3><p>Try clearing the filters to see all students.</p></div>
                    )}
                </>
            ) : (
                <div>
                    <div className="mb-8 flex justify-between items-center">
                        <button onClick={handleBackToList} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
                            <ChevronLeftIcon className="h-5 w-5" />Back to All Students
                        </button>
                        <button 
                            onClick={handleAddTest} 
                            className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold"
                        >
                           <FaPlus className="h-4 w-4" /> Add Test Record
                        </button>
                    </div>
                    <div className="space-y-12">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold">Detailed Report for <span className="text-primary">{selectedStudent.name}</span></h2>
                        </div>
                        <div className="bg-card p-6 rounded-2xl shadow-soft border border-border flex flex-col md:flex-row items-center gap-8">
                            <div className="relative w-48 h-48 flex-shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={scoreData} dataKey="value" cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={450} stroke="none">
                                            <Cell fill={getScoreColor(stats.avgScore)} />
                                            <Cell fill="hsl(var(--muted))" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <p className="text-4xl font-bold text-foreground">{stats.avgScore}<span className="text-xl">%</span></p>
                                    <p className="text-sm text-muted-foreground">Avg Score</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
                                <StatCard icon={CheckCircleIcon} iconBgClass="bg-success-muted" iconClass="text-success" title="Completed Tests" value={stats.completedTests} />
                                <StatCard icon={CalendarIcon} iconBgClass="bg-primary/10" iconClass="text-primary" title="Upcoming Tests" value={stats.upcomingTests} />
                                <StatCard icon={XCircleIcon} iconBgClass="bg-danger-muted" iconClass="text-danger" title="Absent Tests" value={stats.absentTests} />
                            </div>
                        </div>
                        <OverallStrengthsWeaknesses tests={completedAndAbsentTests.filter(t => t.status === 'Completed')} studentSubjects={studentSubjectsForSelected} />
                        <TestSchedule 
                            tests={testsForSelectedStudent}
                            workItems={workItems}
                            onTestSelect={setViewingTest}
                            onEditTest={handleEditTest}
                            onDeleteTest={handleDeleteTest}
                            onAddMarking={handleAddMarking}
                            onAssignTestAsWork={handleAssignTestAsWork}
                        />
                        <ScoreTrendChart completedTests={completedAndAbsentTests.filter(t => t.status === 'Completed')} onTestSelect={setViewingTest} />
                        <MistakeAnalytics tests={completedAndAbsentTests.filter(t => t.status === 'Completed')} />
                    </div>
                </div>
            )}
            {viewingTest && selectedStudent && <TestDetailModal test={viewingTest} student={selectedStudent} studentSubjects={studentSubjectsForSelected} onClose={() => setViewingTest(null)} onAddMarking={handleAddMarking} onEdit={handleEditTest} onDelete={handleDeleteAndCloseModal} />}
        </div>
    );
};

export default ReportsPage;
