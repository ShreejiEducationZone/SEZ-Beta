import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import StudentSubjectCard from './StudentSubjectCard';
import SubjectManagerDrawer from './SubjectManagerDrawer';
import { useData } from '../context/DataContext';

const SubjectManagerPage: React.FC = () => {
    const { students, allStudentSubjects, handleSaveSubjects } = useData();
    const [showArchived, setShowArchived] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const displayedStudents = useMemo(() => {
        return students.filter(student => student.isArchived === showArchived);
    }, [students, showArchived]);

    const handleSelect = (student: Student) => {
        setSelectedStudent(student);
    };

    const handleCloseDrawer = () => {
        setSelectedStudent(null);
    };

    return (
        <div>
            <p className="mt-2 mb-6 text-muted-foreground max-w-3xl">
                A central place to define subjects and curriculum for each student. Click on a student to manage their syllabus. You can use the AI assistant, import a CSV, or enter data manually.
            </p>

            <div className="flex items-center mb-6">
                <input
                    type="checkbox"
                    id="showArchivedSubjects"
                    checked={showArchived}
                    onChange={() => setShowArchived(!showArchived)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="showArchivedSubjects" className="ml-2 block text-sm text-muted-foreground">
                    Show Archived Students
                </label>
            </div>
            
            {displayedStudents.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {displayedStudents.map(student => {
                        const subjects = allStudentSubjects[student.id]?.subjects || [];
                        return (
                            <StudentSubjectCard
                                key={student.id}
                                student={student}
                                subjects={subjects}
                                onSelect={() => handleSelect(student)}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <h3 className="text-xl font-semibold">No {showArchived ? 'archived' : 'active'} students found.</h3>
                    <p>Try viewing {showArchived ? 'active' : 'archived'} students.</p>
                </div>
            )}

            {selectedStudent && (
                <SubjectManagerDrawer
                    student={selectedStudent}
                    studentSubjects={allStudentSubjects[selectedStudent.id]?.subjects}
                    onSave={handleSaveSubjects}
                    onClose={handleCloseDrawer}
                />
            )}
        </div>
    );
};

export default SubjectManagerPage;