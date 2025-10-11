import React, { useMemo } from 'react';
import { useSyllabus } from '../context/SyllabusContext';
import { useWorkPool } from '../context/WorkPoolContext';
import { useDoubtBox } from '../context/DoubtBoxContext';
import { useReports } from '../context/ReportsContext';
import { Student, WorkItem, Doubt, Test } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import LoopholeDetailCard from './LoopholeDetailCard';
import SparklesIcon from './icons/SparklesIcon';

interface AnalyticsDetailViewProps {
    student: Student;
    onBack: () => void;
}

const AnalyticsDetailView: React.FC<AnalyticsDetailViewProps> = ({ student, onBack }) => {
    const { allStudentSubjects } = useSyllabus();
    const { workItems } = useWorkPool();
    const { doubts } = useDoubtBox();
    const { tests } = useReports();

    const loopholes = useMemo(() => {
        const studentId = student.id;
        const studentSubjects = allStudentSubjects[studentId]?.subjects || [];
        const dataByChapter = new Map();

        studentSubjects.forEach(subject => {
            subject.chapters.forEach(chapter => {
                const key = `${subject.subject}__${chapter.no}`;
                dataByChapter.set(key, { subject: subject.subject, chapterNo: chapter.no, chapterName: chapter.name, workItems: [], doubts: [], tests: [] });
            });
        });

        workItems.filter(w => w.studentId === studentId).forEach(w => {
            const key = `${w.subject}__${w.chapterNo}`;
            if (dataByChapter.has(key)) dataByChapter.get(key).workItems.push(w);
        });
        doubts.filter(d => d.studentId === studentId && d.chapterNo).forEach(d => {
            const key = `${d.subject}__${d.chapterNo}`;
            if (dataByChapter.has(key)) dataByChapter.get(key).doubts.push(d);
        });
        tests.filter(t => t.studentId === studentId).forEach(t => {
            t.chapters.forEach(c => {
                 const subjectInfo = studentSubjects.find(s => s.chapters.some(chap => chap.no === c.no));
                 if(subjectInfo) {
                    const key = `${subjectInfo.subject}__${c.no}`;
                    if (dataByChapter.has(key)) dataByChapter.get(key).tests.push(t);
                 }
            });
        });

        const identifiedLoopholes = [];
        const WORK_THRESHOLD = 2; // At least 2 work items
        const DOUBT_THRESHOLD = 1; // More than 1 doubt
        const SCORE_THRESHOLD = 60;

        for (const data of dataByChapter.values()) {
            const completedTests = data.tests.filter(t => t.status === 'Completed' && t.marksObtained != null && t.totalMarks != null && t.totalMarks > 0);
            let avgScore = -1;
            if (completedTests.length > 0) {
                const totalScore = completedTests.reduce((sum, t) => sum + (t.marksObtained / t.totalMarks), 0);
                avgScore = Math.round((totalScore / completedTests.length) * 100);
            }

            const hasHighActivity = data.workItems.length >= WORK_THRESHOLD || data.doubts.length > DOUBT_THRESHOLD;
            const hasLowPerformance = avgScore !== -1 && avgScore < SCORE_THRESHOLD;

            if (hasHighActivity && hasLowPerformance) {
                identifiedLoopholes.push({ ...data, avgScore });
            }
        }
        return identifiedLoopholes.sort((a, b) => a.avgScore - b.avgScore);
    }, [student, allStudentSubjects, workItems, doubts, tests]);

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4">
                <ChevronLeftIcon className="h-5 w-5" />
                Back to All Students
            </button>
             <div className="mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">{student.name}'s Analysis</h2>
                        <p className="text-muted-foreground">{student.board} • Grade {student.grade}</p>
                    </div>
                </div>
            </div>

            {loopholes.length > 0 ? (
                <div className="space-y-6">
                    {loopholes.map(loophole => (
                        <LoopholeDetailCard key={`${loophole.subject}-${loophole.chapterNo}`} data={loophole} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-muted-foreground bg-card rounded-2xl border border-border">
                    <SparklesIcon className="h-16 w-16 mx-auto text-success" />
                    <h3 className="mt-4 text-2xl font-bold text-foreground">Excellent Progress!</h3>
                    <p className="mt-2 max-w-md mx-auto">I couldn't find any significant learning loops for {student.name} based on the current data. Keep up the great work!</p>
                </div>
            )}
        </div>
    );
};

export default AnalyticsDetailView;