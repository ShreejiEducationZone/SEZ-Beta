import React, { useState, useMemo, useCallback } from 'react';
import { Student } from '../types';
import StudentSubjectCard from './StudentSubjectCard';
import SubjectManagerDrawer from './SubjectManagerDrawer';
import { useSyllabus } from '../context/SyllabusContext';
import { useStudent } from '../context/StudentContext';
import { useData } from '../context/DataContext';
import FilterBar from './FilterBar';

const SubjectManagerPage: React.FC = () => {
    const { allStudentSubjects, handleSaveSubjects } = useSyllabus();
    const { students } = useStudent();
    const { branches } = useData();

    const [showArchived, setShowArchived] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    
    const [filters, setFilters] = useState({ board: '', grade: '', batch: '', branch: '' });
    const [searchQuery, setSearchQuery] = useState('');

    const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({ board: '', grade: '', batch: '', branch: '' });
        setSearchQuery('');
    }, []);

    const displayedStudents = useMemo(() => {
        return students.filter(student => {
            if (student.isArchived !== showArchived) return false;
            if (filters.board && student.board !== filters.board) return false;
            if (filters.grade && student.grade.toString() !== filters.grade) return false;
            if (filters.batch && student.batch !== filters.batch) return false;
            if (filters.branch && student.branch !== filters.branch) return false;
            if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        });
    }, [students, showArchived, filters, searchQuery]);

    const handleSelect = (student: Student) => {
        setSelectedStudent(student);
    };

    const handleCloseDrawer = () => {
        setSelectedStudent(null);
    };

    return (
        <div>
            <FilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                branchOptions={branches}
            />

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
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    <p>Try adjusting your search or filters.</p>
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