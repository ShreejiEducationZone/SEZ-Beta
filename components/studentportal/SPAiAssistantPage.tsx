import React, { useMemo } from 'react';
import { Student } from '../../types';
import { useData } from '../../context/DataContext';
import StudentAiChat from '../StudentAiChat';

interface SPAiAssistantPageProps {
    student: Student;
    onBack: () => void;
}

const SPAiAssistantPage: React.FC<SPAiAssistantPageProps> = ({ student, onBack }) => {
    const { 
        allStudentSubjects, 
        syllabusProgress, 
        workItems, 
        doubts, 
        tests, 
        attendanceRecords, 
    } = useData();

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
