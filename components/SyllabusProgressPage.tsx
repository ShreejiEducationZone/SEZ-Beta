import React, { useState, useMemo, useCallback } from 'react';
import { Student, SubjectData, ChapterProgress } from '../types';
import StudentProgressCard from './StudentProgressCard';
import SyllabusTimelineDrawer from './SyllabusTimelineDrawer';
import SyllabusFilterBar from './SyllabusFilterBar';
import { useData } from '../context/DataContext';

const SyllabusProgressPage: React.FC = () => {
    const { students, allStudentSubjects, chapterProgress, handleSaveChapterProgress } = useData();

    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [filters, setFilters] = useState({ board: '', grade: '', batch: '', subject: '' });
    const [searchQuery, setSearchQuery] = useState('');

    const allSubjects = useMemo(() => {
        const subjectsSet = new Set<string>();
        Object.values(allStudentSubjects).forEach((studentSubjects: { subjects: SubjectData[] }) => {
            studentSubjects.subjects.forEach(subject => subjectsSet.add(subject.subject));
        });
        return Array.from(subjectsSet).sort();
    }, [allStudentSubjects]);

    const progressData = useMemo(() => {
        const dataMap = new Map<string, { overallPercentage: number, subjectProgress: any[], lastUpdate: string | null }>();
        
        students.forEach(student => {
            const subjectsForStudent = allStudentSubjects[student.id]?.subjects || [];
            const progressForStudent = chapterProgress.filter(p => p.studentId === student.id);
            
            let totalChapters = 0;
            let totalCompletedChapters = 0;
            let lastUpdate: string | null = null;
            
            subjectsForStudent.forEach(subject => {
                totalChapters += subject.chapters.length;
            });

            progressForStudent.forEach(p => {
                if (p.entries.some(e => e.type === 'finish')) {
                    totalCompletedChapters++;
                }
                p.entries.forEach(e => {
                    if (!lastUpdate || new Date(e.date) > new Date(lastUpdate)) {
                        lastUpdate = e.date;
                    }
                });
            });

            const overallPercentage = totalChapters > 0 ? Math.round((totalCompletedChapters / totalChapters) * 100) : 0;

            const subjectProgress = subjectsForStudent.map(subject => {
                const total = subject.chapters.length;
                const completed = progressForStudent.filter(p => p.subject === subject.subject && p.entries.some(e => e.type === 'finish')).length;
                return { subject: subject.subject, completed, total };
            });

            dataMap.set(student.id, { overallPercentage, subjectProgress, lastUpdate });
        });
        return dataMap;
    }, [students, allStudentSubjects, chapterProgress]);

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            if (student.isArchived !== showArchived) return false;
            if (filters.board && student.board !== filters.board) return false;
            if (filters.grade && student.grade.toString() !== filters.grade) return false;
            if (filters.batch && student.batch !== filters.batch) return false;
            if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (filters.subject) {
                const studentSubjects = allStudentSubjects[student.id]?.subjects.map(s => s.subject) || [];
                if (!studentSubjects.includes(filters.subject)) return false;
            }
            return true;
        });
    }, [students, filters, searchQuery, allStudentSubjects, showArchived]);

    const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({ board: '', grade: '', batch: '', subject: '' });
        setSearchQuery('');
    }, []);

    return (
        <div>
             <p className="mt-2 mb-6 text-gray-600 dark:text-gray-400 max-w-3xl">
                Track academic progress for each student. Click on a student to view their detailed chapter-wise timeline.
            </p>
            <SyllabusFilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                allSubjects={allSubjects}
            />
            <div className="flex items-center mb-6">
                <input
                    type="checkbox"
                    id="showArchivedSyllabus"
                    checked={showArchived}
                    onChange={() => setShowArchived(!showArchived)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="showArchivedSyllabus" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Show Archived Students
                </label>
            </div>
            {filteredStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredStudents.map(student => {
                        const data = progressData.get(student.id);
                        if (!data) return null;
                        return (
                            <StudentProgressCard
                                key={student.id}
                                student={student}
                                overallPercentage={data.overallPercentage}
                                subjectProgress={data.subjectProgress}
                                lastUpdate={data.lastUpdate}
                                onViewTimeline={() => setSelectedStudent(student)}
                            />
                        );
                    })}
                </div>
            ) : (
                 <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                    <h3 className="text-xl font-semibold">No {showArchived ? 'archived' : 'active'} students found.</h3>
                    <p>Try adjusting your search or filters.</p>
                </div>
            )}
            {selectedStudent && (
                <SyllabusTimelineDrawer
                    student={selectedStudent}
                    studentSubjects={allStudentSubjects[selectedStudent.id]?.subjects || []}
                    chapterProgress={chapterProgress}
                    onSave={handleSaveChapterProgress}
                    onClose={() => setSelectedStudent(null)}
                />
            )}
        </div>
    );
};

export default SyllabusProgressPage;
