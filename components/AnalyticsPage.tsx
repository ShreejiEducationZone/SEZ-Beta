import React, { useState, useMemo } from 'react';
import { useStudent } from '../context/StudentContext';
import { useSyllabus } from '../context/SyllabusContext';
import { useWorkPool } from '../context/WorkPoolContext';
import { useDoubtBox } from '../context/DoubtBoxContext';
import { useReports } from '../context/ReportsContext';
import { Student, WorkItem, Doubt, Test } from '../types';
import StudentAnalyticsCard from './StudentAnalyticsCard';
import AnalyticsDetailView from './AnalyticsDetailView';

// Helper function to perform analysis for a single student
const analyzeStudent = (student, allStudentSubjects, workItems, doubts, tests) => {
    const studentId = student.id;
    const studentSubjects = allStudentSubjects[studentId]?.subjects || [];
    const dataByChapter = new Map();

    studentSubjects.forEach(subject => {
        subject.chapters.forEach(chapter => {
            const key = `${subject.subject}__${chapter.no}`;
            dataByChapter.set(key, {
                subject: subject.subject, chapterNo: chapter.no, chapterName: chapter.name,
                workItems: [], doubts: [], tests: []
            });
        });
    });

    workItems.filter(w => w.studentId === studentId).forEach(workItem => {
        const key = `${workItem.subject}__${workItem.chapterNo}`;
        if (dataByChapter.has(key)) dataByChapter.get(key).workItems.push(workItem);
    });

    doubts.filter(d => d.studentId === studentId && d.chapterNo).forEach(doubt => {
        const key = `${doubt.subject}__${doubt.chapterNo}`;
        if (dataByChapter.has(key)) dataByChapter.get(key).doubts.push(doubt);
    });

    tests.filter(t => t.studentId === studentId).forEach(test => {
        test.chapters.forEach(chapter => {
            const studentSubject = studentSubjects.find(s => s.chapters.some(c => c.no === chapter.no));
            if (studentSubject) {
                const key = `${studentSubject.subject}__${chapter.no}`;
                if (dataByChapter.has(key)) dataByChapter.get(key).tests.push(test);
            }
        });
    });

    let focusAreaCount = 0;
    const WORK_THRESHOLD = 2;
    const DOUBT_THRESHOLD = 1;
    const SCORE_THRESHOLD = 60;

    for (const data of dataByChapter.values()) {
        const completedTests = data.tests.filter(t => t.status === 'Completed' && t.marksObtained != null && t.totalMarks != null && t.totalMarks > 0);
        let avgScore = -1;
        if (completedTests.length > 0) {
            const totalScore = completedTests.reduce((sum, t) => sum + (t.marksObtained / t.totalMarks), 0);
            avgScore = (totalScore / completedTests.length) * 100;
        }

        const hasHighActivity = data.workItems.length >= WORK_THRESHOLD || data.doubts.length > DOUBT_THRESHOLD;
        const hasLowPerformance = avgScore !== -1 && avgScore < SCORE_THRESHOLD;

        if (hasHighActivity && hasLowPerformance) {
            focusAreaCount++;
        }
    }
    return focusAreaCount;
};

const AnalyticsPage: React.FC = () => {
    const { students } = useStudent();
    const { allStudentSubjects } = useSyllabus();
    const { workItems } = useWorkPool();
    const { doubts } = useDoubtBox();
    const { tests } = useReports();
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const activeStudents = useMemo(() => students.filter(s => !s.isArchived), [students]);

    const allStudentsAnalysis = useMemo(() => {
        return activeStudents.map(student => ({
            student,
            focusAreaCount: analyzeStudent(student, allStudentSubjects, workItems, doubts, tests)
        }));
    }, [activeStudents, allStudentSubjects, workItems, doubts, tests]);

    if (selectedStudent) {
        return <AnalyticsDetailView student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
    }

    return (
        <div>
            <p className="mt-2 mb-6 text-muted-foreground max-w-3xl">
                Identify learning loops where students are struggling. This tool analyzes work history, doubts, and test scores to highlight specific topics that need attention.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allStudentsAnalysis.map(({ student, focusAreaCount }) => (
                    <StudentAnalyticsCard
                        key={student.id}
                        student={student}
                        focusAreaCount={focusAreaCount}
                        onSelect={() => setSelectedStudent(student)}
                    />
                ))}
            </div>
        </div>
    );
};

export default AnalyticsPage;
