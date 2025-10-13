import React, { useMemo } from 'react';
import { Student } from '../../types';
import StudentAiChat from '../StudentAiChat';
// FIX: Import specific context hooks
import { useSyllabus } from '../../context/SyllabusContext';
import { useWorkPool } from '../../context/WorkPoolContext';
import { useDoubtBox } from '../../context/DoubtBoxContext';
import { useReports } from '../../context/ReportsContext';
import { useAttendance } from '../../context/AttendanceContext';

interface SPAiAssistantPageProps {
    student: Student;
    onBack: () => void;
}

const SPAiAssistantPage: React.FC<SPAiAssistantPageProps> = ({ student, onBack }) => {
    // FIX: Get data from specific context hooks
    const { allStudentSubjects, syllabusProgress } = useSyllabus();
    const { workItems } = useWorkPool();
    const { doubts } = useDoubtBox();
    const { tests } = useReports();
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
        <div className="h-full">
            <StudentAiChat 
                student={student}
                studentData={studentData}
                onBack={onBack} 
            />
        </div>
    );
};

export default SPAiAssistantPage;