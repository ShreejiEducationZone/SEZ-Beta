
import React, { useMemo } from 'react';
import { Student } from '../../types';
import { useSyllabus } from '../../context/SyllabusContext';
import { useWorkPool } from '../../context/WorkPoolContext';
import { useAttendance } from '../../context/AttendanceContext';
import ParentAiChat from './ParentAiChat';

interface PPAiAssistantPageProps {
    student: Student;
    onBack?: () => void;
}

const PPAiAssistantPage: React.FC<PPAiAssistantPageProps> = ({ student, onBack }) => {
    const { allStudentSubjects, syllabusProgress } = useSyllabus();
    const { workItems, doubts, tests } = useWorkPool();
    const { attendanceRecords } = useAttendance();

    const studentData = useMemo(() => {
        return {
            subjects: allStudentSubjects[student.id]?.subjects || [],
            progress: syllabusProgress.filter(p => p.studentId === student.id),
            work: workItems.filter(w => w.studentId === student.id),
            doubts: doubts.filter(d => d.studentId === student.id),
            tests: tests.filter(t => t.studentId === student.id),
            attendance: attendanceRecords.filter(a => a.studentId === student.id),
        };
    }, [student.id, allStudentSubjects, syllabusProgress, workItems, doubts, tests, attendanceRecords]);

    return (
        <div className="h-full w-full">
            <ParentAiChat 
                student={student}
                studentData={studentData}
                onBack={onBack}
            />
        </div>
    );
};

export default PPAiAssistantPage;