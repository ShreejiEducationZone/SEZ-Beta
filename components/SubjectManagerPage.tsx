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

    return (
        <div>
            <p className="mt-2 mb-6 text-gray-600 dark:text-gray-400 max-w-3xl">
                A central place to define subjects and chapters for each student. Click on a student to manage their curriculum.
            </p>

            <div className="flex items-center mb-6">
                <input
                    type="checkbox"
                    id="showArchivedSubjects"
                    checked={showArchived}
                    onChange={() => setShowArchived(!showArchived)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="showArchivedSubjects" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Show Archived Students
                </label>
            </div>
            
            {displayedStudents.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {displayedStudents.map(student => (
                        <StudentSubjectCard
                            key={student.id}
                            student={student}
                            subjects={allStudentSubjects[student.id]?.subjects || []}
                            onSelect={() => setSelectedStudent(student)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                    <h3 className="text-xl font-semibold">No {showArchived ? 'archived' : 'active'} students found.</h3>
                    <p>Try viewing {showArchived ? 'active' : 'archived'} students.</p>
                </div>
            )}

            {selectedStudent && (
                <SubjectManagerDrawer
                    student={selectedStudent}
                    studentSubjects={allStudentSubjects[selectedStudent.id]?.subjects}
                    onSave={handleSaveSubjects}
                    onClose={() => setSelectedStudent(null)}
                />
            )}
        </div>
    );
};

export default SubjectManagerPage;
