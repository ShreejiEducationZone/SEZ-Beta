import React, { useState, useMemo } from 'react';
// FIX: Import useSyllabus to get allStudentSubjects
import { useSyllabus } from '../context/SyllabusContext';
import { Student, SubjectData, Board } from '../types';
import VideoLibraryDrawer from './VideoLibraryDrawer'; // This component is now a full page
import { FaChevronLeft } from 'react-icons/fa';
import FolderCard from './FolderCard';
import FolderIcon from './icons/FolderIcon';
// FIX: Import useStudent to get students data
import { useStudent } from '../context/StudentContext';


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

const boardColorClasses: Record<Board, string> = {
    CBSE: 'text-orange-500',
    ICSE: 'text-green-600',
    GSEB: 'text-gray-500',
    Cambridge: 'text-blue-600',
    IB: 'text-pink-600',
};

const VideoLibraryPage: React.FC = () => {
    // FIX: Get syllabus data from useSyllabus hook
    const { allStudentSubjects } = useSyllabus();
    // FIX: Get students from useStudent hook
    const { students } = useStudent();
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
                    Back to All Libraries
                </button>
                <div className="flex items-center gap-4 mb-6">
                    <FolderIcon className="w-12 h-12 text-primary" />
                    <h2 className="text-3xl font-bold text-foreground">{selectedSchool.school}</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
                    {selectedSchool.groups.map(group => (
                        <FolderCard 
                            key={group.id}
                            name={`${group.board} - G${group.grade}`}
                            details={`${group.studentCount} student(s)`}
                            onClick={() => setSelectedGroup(group)}
                            colorClass={boardColorClasses[group.board]}
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
                A shared library of educational videos organized by curriculum. Select a library to begin.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
                <FolderCard
                    name="Universal Library"
                    details="General videos"
                    onClick={() => setSelectedGroup('universal')}
                    colorClass="text-accent"
                />
                {schoolLibraryGroups.map(schoolGroup => (
                    <FolderCard
                        key={schoolGroup.school}
                        name={schoolGroup.school}
                        details={`${schoolGroup.studentCount} student(s)`}
                        onClick={() => setSelectedSchool(schoolGroup)}
                    />
                ))}
            </div>
            {schoolLibraryGroups.length === 0 && (
                <div className="mt-8 text-center py-16 text-muted-foreground bg-muted/50 rounded-lg">
                    <h3 className="text-xl font-semibold">No schools found.</h3>
                    <p>Add students to see their school libraries here.</p>
                </div>
            )}
        </div>
    );
};

export default VideoLibraryPage;