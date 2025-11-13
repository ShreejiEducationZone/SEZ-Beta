import React, { useState, useMemo, useCallback } from 'react';
import { Student, SubjectData, SyllabusProgress, SyllabusNode } from './types';
import StudentProgressCard from './components/StudentProgressCard';
import SyllabusFocusPage from './components/SyllabusFocusPage';
import SyllabusFilterBar from './components/SyllabusFilterBar';
import { useSyllabus } from './context/SyllabusContext';
import { useStudent } from './context/StudentContext';

const countNodes = (nodes: SyllabusNode[]): number => {
    let count = nodes.length;
    for (const node of nodes) {
        if (node.children) {
            count += countNodes(node.children);
        }
    }
    return count;
};

const SyllabusProgressPage: React.FC = () => {
    const { allStudentSubjects, syllabusProgress, handleUpdateSyllabusNode } = useSyllabus();
    const { students } = useStudent();

    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [filters, setFilters] = useState({ board: '', grade: '', batch: '', subject: '' });
    const [searchQuery, setSearchQuery] = useState('');

    const allSubjectsForFilter = useMemo(() => {
        const subjectsSet = new Set<string>();
        Object.values(allStudentSubjects).forEach((studentSubjects: { subjects: SubjectData[] }) => {
            studentSubjects.subjects.forEach(subject => subjectsSet.add(subject.subject));
        });
        return Array.from(subjectsSet).sort();
    }, [allStudentSubjects]);

    const progressData = useMemo(() => {
        const dataMap = new Map<string, { overallPercentage: number, subjectProgress: any[], lastUpdate: string | null }>();
        
        students.forEach(student => {
            const studentSubjectsData = allStudentSubjects[student.id]?.subjects || [];
            
            let totalNodes = 0;
            let lastUpdate: string | null = null;
            
            const allNodesForStudent = new Set<string>();
            const addNodesToSet = (nodes: SyllabusNode[]) => {
                nodes.forEach(node => {
                    allNodesForStudent.add(String(node.no));
                    if (node.children) addNodesToSet(node.children);
                });
            };

            studentSubjectsData.forEach(subject => {
                addNodesToSet(subject.chapters);
            });
            totalNodes = allNodesForStudent.size;

            const completedNodesForStudent = syllabusProgress.filter(p => p.studentId === student.id && p.isCompleted);
            const completedNodesCount = completedNodesForStudent.length;
            
            completedNodesForStudent.forEach(p => {
                p.entries.forEach(e => {
                    if (!lastUpdate || new Date(e.date) > new Date(lastUpdate)) {
                        lastUpdate = e.date;
                    }
                });
            });

            const overallPercentage = totalNodes > 0 ? Math.round((completedNodesCount / totalNodes) * 100) : 0;

            const subjectProgress = studentSubjectsData.map(subject => {
                const chapterNodes = new Set<string>();
                const addNodesToChapterSet = (nodes: SyllabusNode[]) => {
                    nodes.forEach(node => {
                        chapterNodes.add(String(node.no));
                        if (node.children) {
                            addNodesToChapterSet(node.children);
                        }
                    });
                };
                addNodesToChapterSet(subject.chapters);
                const total = chapterNodes.size;

                const completed = completedNodesForStudent.filter(p => p.subject === subject.subject).length;
                return { subject: subject.subject, completed, total };
            });

            dataMap.set(student.id, { overallPercentage, subjectProgress, lastUpdate });
        });
        return dataMap;
    }, [students, allStudentSubjects, syllabusProgress]);

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
    
    if (selectedStudent) {
        return (
            <SyllabusFocusPage
                student={selectedStudent}
                studentSubjects={allStudentSubjects[selectedStudent.id]?.subjects || []}
                syllabusProgress={syllabusProgress.filter(p => p.studentId === selectedStudent.id)}
                onUpdateNode={handleUpdateSyllabusNode}
                onBack={() => setSelectedStudent(null)}
            />
        )
    }

    return (
        <div>
             <p className="mt-2 mb-6 text-muted-foreground max-w-3xl">
                Track academic progress for each student. Click on a student to view their detailed chapter-wise timeline.
            </p>
            <SyllabusFilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                allSubjects={allSubjectsForFilter}
            />
            <div className="flex items-center mb-6">
                <input
                    type="checkbox"
                    id="showArchivedSyllabus"
                    checked={showArchived}
                    onChange={() => setShowArchived(!showArchived)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="showArchivedSyllabus" className="ml-2 block text-sm text-muted-foreground">
                    Show Archived Students
                </label>
            </div>
            {filteredStudents.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                 <div className="text-center py-16 text-muted-foreground">
                    <h3 className="text-xl font-bold text-foreground">No {showArchived ? 'archived' : 'active'} students found.</h3>
                    <p>Try adjusting your search or filters.</p>
                </div>
            )}
        </div>
    );
};

export default SyllabusProgressPage;