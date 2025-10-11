import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import AdminAiChat from './AdminAiChat';
import StudentAiChat from './StudentAiChat';
import PlaceholderAvatar from './PlaceholderAvatar';
import ChevronRightIcon from './icons/ChevronRightIcon';
// FIX: Import specific context hooks
import { useSyllabus } from '../context/SyllabusContext';
import { useWorkPool } from '../context/WorkPoolContext';
import { useDoubtBox } from '../context/DoubtBoxContext';
import { useReports } from '../context/ReportsContext';
import { useAttendance } from '../context/AttendanceContext';
// FIX: Import useStudent to get students data
import { useStudent } from '../context/StudentContext';

const AiAssistantPage: React.FC = () => {
    const [mode, setMode] = useState<'selection' | 'admin' | 'student'>('selection');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // FIX: Get data from specific context hooks
    const { allStudentSubjects, syllabusProgress } = useSyllabus();
    const { workItems } = useWorkPool();
    const { doubts } = useDoubtBox();
    const { tests } = useReports();
    const { attendanceRecords } = useAttendance();
    // FIX: Get students from useStudent hook
    const { students } = useStudent();

    const activeStudents = useMemo(() => students.filter(s => !s.isArchived), [students]);
    
    const filteredStudents = useMemo(() => {
        if (!searchQuery) {
            return activeStudents;
        }
        return activeStudents.filter(student => 
            student.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [activeStudents, searchQuery]);

    const studentData = useMemo(() => {
        if (!selectedStudent) return null;
        return {
            subjects: allStudentSubjects[selectedStudent.id]?.subjects || [],
            progress: syllabusProgress.filter(p => p.studentId === selectedStudent.id),
            work: workItems.filter(w => w.studentId === selectedStudent.id),
            doubts: doubts.filter(d => d.studentId === selectedStudent.id),
            tests: tests.filter(t => t.studentId === selectedStudent.id),
            attendance: attendanceRecords.filter(a => a.studentId === selectedStudent.id),
        };
    }, [selectedStudent, allStudentSubjects, syllabusProgress, workItems, doubts, tests, attendanceRecords]);

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
        setMode('student');
    };

    const handleSelectAdmin = () => {
        setSelectedStudent(null);
        setMode('admin');
    };

    const handleBack = () => {
        setSelectedStudent(null);
        setMode('selection');
    };

    if (mode === 'student' && selectedStudent && studentData) {
        return <StudentAiChat student={selectedStudent} studentData={studentData} onBack={handleBack} />;
    }

    if (mode === 'admin') {
        return <AdminAiChat onBack={handleBack} />;
    }

    // Selection Mode
    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-2">Choose an Assistant Mode</h2>
            <p className="text-center text-muted-foreground mb-8">Select a student for a personalized AI, or continue as an administrator for a full overview.</p>
            
            <div className="bg-card p-6 rounded-2xl shadow-soft-lg border border-border">
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search for a student..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 px-4 pl-12 rounded-full border border-border bg-background focus:ring-2 focus:ring-primary/50"
                    />
                </div>

                <div className="max-h-[45vh] overflow-y-auto thin-scrollbar pr-2 -mr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.length > 0 ? filteredStudents.map(student => (
                        <div 
                            key={student.id} 
                            onClick={() => handleSelectStudent(student)}
                            className="flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-muted/50 group"
                        >
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-muted flex-shrink-0 border-2 border-card">
                                {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                            </div>
                            <div className="flex-grow min-w-0">
                                <h3 className="font-bold text-foreground truncate">{student.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    Grade {student.grade} • {student.board}
                                </p>
                            </div>
                            <ChevronRightIcon className="h-6 w-6 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
                        </div>
                    )) : (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            <p>No students found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 text-center">
                 <button 
                    onClick={handleSelectAdmin}
                    className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-foreground text-background font-semibold hover:bg-foreground/80 transition-colors"
                >
                    Continue as Administrator
                    <ChevronRightIcon className="h-5 w-5"/>
                </button>
            </div>
        </div>
    );
};

export default AiAssistantPage;