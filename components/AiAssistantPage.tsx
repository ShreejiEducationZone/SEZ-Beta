import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Student } from '../types';
import AdminAiChat from './AdminAiChat';
import StudentAiChat from './StudentAiChat';
import PlaceholderAvatar from './PlaceholderAvatar';
import ChevronRightIcon from './icons/ChevronRightIcon';

const AiAssistantPage: React.FC = () => {
    const [mode, setMode] = useState<'selection' | 'admin' | 'student'>('selection');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { 
        students, 
        allStudentSubjects, 
        chapterProgress, 
        workItems, 
        doubts, 
        tests, 
        attendanceRecords, 
    } = useData();

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
            progress: chapterProgress.filter(p => p.studentId === selectedStudent.id),
            work: workItems.filter(w => w.studentId === selectedStudent.id),
            doubts: doubts.filter(d => d.studentId === selectedStudent.id),
            tests: tests.filter(t => t.studentId === selectedStudent.id),
            attendance: attendanceRecords.filter(a => a.studentId === selectedStudent.id),
        };
    }, [selectedStudent, allStudentSubjects, chapterProgress, workItems, doubts, tests, attendanceRecords]);

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
            <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Select a student for a personalized AI, or continue as an administrator for a full overview.</p>
            
            <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-lg">
                <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search for a student..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 px-4 pl-12 rounded-full border border-gray-300 dark:border-gray-600 bg-light-bg dark:bg-dark-bg focus:ring-2 focus:ring-brand-blue"
                    />
                </div>

                <div className="max-h-[45vh] overflow-y-auto thin-scrollbar pr-2 -mr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.length > 0 ? filteredStudents.map(student => (
                        <div 
                            key={student.id} 
                            onClick={() => handleSelectStudent(student)}
                            className="flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-blue-50 dark:hover:bg-blue-900/20 group"
                        >
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 border-2 border-white dark:border-gray-600">
                                {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                            </div>
                            <div className="flex-grow min-w-0">
                                <h3 className="font-bold text-gray-800 dark:text-white truncate">{student.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Grade {student.grade} • {student.board}
                                </p>
                            </div>
                            <ChevronRightIcon className="h-6 w-6 text-gray-400 group-hover:text-brand-blue transition-colors flex-shrink-0" />
                        </div>
                    )) : (
                        <div className="col-span-full text-center py-10 text-gray-500">
                            <p>No students found matching your search.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 text-center">
                 <button 
                    onClick={handleSelectAdmin}
                    className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-gray-800 text-white font-semibold hover:bg-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white transition-colors"
                >
                    Continue as Administrator
                    <ChevronRightIcon className="h-5 w-5"/>
                </button>
            </div>
        </div>
    );
};

export default AiAssistantPage;