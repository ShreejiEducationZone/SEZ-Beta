import React, { useState, useMemo } from 'react';
import { useStudent } from '../context/StudentContext';
import { useSyllabus } from '../context/SyllabusContext';
import { useWorkPool } from '../context/WorkPoolContext';
import { Student } from '../types';
import StudentAnalyticsCard from './StudentAnalyticsCard'; // Re-purposed to StudentActivityCard
import AnalyticsDetailView from './AnalyticsDetailView'; // Re-purposed to ActivityTimelineView

const AnalyticsPage: React.FC = () => {
    const { students } = useStudent();
    const { syllabusProgress } = useSyllabus();
    const { workItems, doubts, tests } = useWorkPool();
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const activeStudents = useMemo(() => students.filter(s => !s.isArchived), [students]);

    const allStudentsAnalysis = useMemo(() => {
        return activeStudents.map(student => {
            const studentActivities = [
                ...syllabusProgress.filter(p => p.studentId === student.id && p.entries.length > 0),
                ...workItems.filter(w => w.studentId === student.id),
                ...doubts.filter(d => d.studentId === student.id),
                ...tests.filter(t => t.studentId === student.id),
            ];
            
            return {
                student,
                totalActivities: studentActivities.length,
            };
        });
    }, [activeStudents, syllabusProgress, workItems, doubts, tests]);

    if (selectedStudent) {
        return <AnalyticsDetailView student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
    }

    return (
        <div>
            <p className="mt-2 mb-6 text-muted-foreground max-w-3xl">
                Select a student to view their complete activity timeline, including syllabus progress, work, doubts, and tests, all organized chronologically.
            </p>
            {allStudentsAnalysis.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {allStudentsAnalysis.map(({ student, totalActivities }) => (
                        <StudentAnalyticsCard
                            key={student.id}
                            student={student}
                            focusAreaCount={totalActivities} 
                            onSelect={() => setSelectedStudent(student)}
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 text-muted-foreground">
                    <h3 className="text-xl font-bold text-foreground">No active students found.</h3>
                    <p>Add a student in the 'Students' directory to see their activity here.</p>
                </div>
            )}
        </div>
    );
};

export default AnalyticsPage;
