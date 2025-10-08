import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Student, SubjectData, Board } from '../types';
import VideoLibraryDrawer from './VideoLibraryDrawer'; // This component is now a full page
import { FaChevronLeft } from 'react-icons/fa';
import SchoolCard from './SchoolCard';
import LibraryCard from './LibraryCard';

export interface GroupData {
    id: string;
    school: string;
    board: Board;
    grade: string;
    studentCount: number;
    subjects: SubjectData[];
}

interface SchoolGroup {
    school: string;
    groups: GroupData[];
    studentCount: number;
    boardCount: number;
}

const VideoLibraryPage: React.FC = () => {
    const { students, allStudentSubjects } = useData();
    const [selectedGroup, setSelectedGroup] = useState<GroupData | 'universal' | null>(null);
    const [selectedSchool, setSelectedSchool] = useState<SchoolGroup | null>(null);

    const schoolLibraryGroups = useMemo<SchoolGroup[]>(() => {
        const studentsBySchool = new Map<string, Student[]>();
        students.filter(s => !s.isArchived).forEach(student => {
            if (!studentsBySchool.has(student.school)) {
                studentsBySchool.set(student.school, []);
            }
            studentsBySchool.get(student.school)!.push(student);
        });

        const result: SchoolGroup[] = [];

        for (const [school, schoolStudents] of studentsBySchool.entries()) {
            const groupsInSchool = new Map<string, { board: Board; grade: string; studentIds: Set<string>; subjects: Map<string, SubjectData> }>();
            const uniqueBoards = new Set<Board>();
            
            schoolStudents.forEach(student => {
                uniqueBoards.add(student.board);
                const groupId = `${student.board}-${student.grade}`;
                if (!groupsInSchool.has(groupId)) {
                    groupsInSchool.set(groupId, {
                        board: student.board,
                        grade: student.grade,
                        studentIds: new Set(),
                        subjects: new Map()
                    });
                }
                const group = groupsInSchool.get(groupId)!;
                group.studentIds.add(student.id);

                const studentSubjects = allStudentSubjects[student.id]?.subjects || [];
                studentSubjects.forEach(subject => {
                    if (!group.subjects.has(subject.subject)) {
                        group.subjects.set(subject.subject, subject);
                    }
                });
            });

            const schoolGroupData: GroupData[] = Array.from(groupsInSchool.entries()).map(([id, data]) => ({
                id: `${school}-${id}`,
                school,
                board: data.board,
                grade: data.grade,
                studentCount: data.studentIds.size,
                subjects: Array.from(data.subjects.values()).sort((a,b) => a.subject.localeCompare(b.subject))
            })).sort((a, b) => a.board.localeCompare(b.board) || a.grade.localeCompare(b.grade));

            if (schoolGroupData.length > 0) {
                 result.push({
                    school,
                    groups: schoolGroupData,
                    studentCount: schoolStudents.length,
                    boardCount: uniqueBoards.size
                });
            }
        }

        return result.sort((a, b) => a.school.localeCompare(b.school));
    }, [students, allStudentSubjects]);

    // If a group is selected, show the dedicated video focus page.
    if (selectedGroup) {
        return (
            <VideoLibraryDrawer 
                group={selectedGroup}
                onClose={() => setSelectedGroup(null)} // `onClose` now acts as a back button
            />
        );
    }

    // If a school is selected, show its curriculum groups.
    if (selectedSchool) {
        return (
            <div>
                <button onClick={() => setSelectedSchool(null)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <FaChevronLeft className="h-4 w-4" />
                    Back to All Schools
                </button>
                <h2 className="text-3xl font-bold text-foreground mb-6">{selectedSchool.school}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedSchool.groups.map(group => (
                        <LibraryCard 
                            key={group.id}
                            board={group.board}
                            grade={group.grade}
                            studentCount={group.studentCount}
                            subjectCount={group.subjects.length}
                            onClick={() => setSelectedGroup(group)}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Default view: Show Universal Library and all schools.
    return (
        <div>
            <p className="mt-2 mb-6 text-muted-foreground max-w-3xl">
                A shared library of educational videos organized by curriculum. Select a school or the universal library to begin.
            </p>
            <div className="space-y-8">
                <LibraryCard
                    isUniversal
                    onClick={() => setSelectedGroup('universal')}
                />
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">School Libraries</h2>
                    {schoolLibraryGroups.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {schoolLibraryGroups.map(schoolGroup => (
                                <SchoolCard
                                    key={schoolGroup.school}
                                    schoolName={schoolGroup.school}
                                    studentCount={schoolGroup.studentCount}
                                    boardCount={schoolGroup.boardCount}
                                    onClick={() => setSelectedSchool(schoolGroup)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-muted-foreground bg-muted/50 rounded-lg">
                            <h3 className="text-xl font-semibold">No schools found.</h3>
                            <p>Add students to see their school libraries here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoLibraryPage;