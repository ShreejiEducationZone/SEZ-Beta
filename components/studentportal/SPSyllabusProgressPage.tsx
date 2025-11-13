import React, { useState, useMemo, FC, useCallback } from 'react';
import { Student, SubjectData, SyllabusProgress, SyllabusNode, ProgressEntry, Doubt } from '../types';
import { useSyllabus } from '../../context/SyllabusContext';
import { useWorkPool } from '../../context/WorkPoolContext';
import AddNoteModal from '../AddNoteModal';
import SPMilestoneItem from './SPMilestoneItem';
import { VscChecklist } from 'react-icons/vsc';
import { StudentPage } from '../StudentPortal';
import SPHeader from './SPHeader';

const flattenSyllabus = (subjects: SubjectData[]): { subject: string, nodes: (SyllabusNode & { level: number })[] }[] => {
    return subjects.map(subject => {
        const flattenedNodes: (SyllabusNode & { level: number })[] = [];
        const recurse = (nodes: SyllabusNode[], level: number) => {
            nodes.forEach(node => {
                flattenedNodes.push({ ...node, level });
                if (node.children) {
                    recurse(node.children, level + 1);
                }
            });
        };
        recurse(subject.chapters, 1);
        return { subject: subject.subject, nodes: flattenedNodes };
    });
};

interface SPSyllabusProgressPageProps {
    student: Student;
    onNavigate: (page: StudentPage) => void;
}

const SPSyllabusProgressPage: FC<SPSyllabusProgressPageProps> = ({ student, onNavigate }) => {
    const { allStudentSubjects, syllabusProgress, handleUpdateSyllabusNode } = useSyllabus();
    const { openDoubtForm } = useWorkPool();
    
    const studentSubjects = useMemo(() => allStudentSubjects[student.id]?.subjects || [], [allStudentSubjects, student.id]);
    
    const [activeSubject, setActiveSubject] = useState<string>(studentSubjects[0]?.subject || '');
    const [nodeForNote, setNodeForNote] = useState<(SyllabusNode & { level: number }) | null>(null);

    const progressMap = useMemo(() => {
        const map = new Map<string, SyllabusProgress>();
        syllabusProgress.forEach(p => {
            if (p.studentId === student.id) {
                map.set(`${p.subject}-${p.nodeNo}`, p);
            }
        });
        return map;
    }, [syllabusProgress, student.id]);

    const flattenedSyllabusBySubject = useMemo(() => flattenSyllabus(studentSubjects), [studentSubjects]);

    const getRootChapterForNode = useCallback((nodeNo: string | number): SyllabusNode | null => {
        const subjectData = studentSubjects.find(s => s.subject === activeSubject);
        if (!subjectData) return null;
        const rootNo = String(nodeNo).split('.')[0];
        return subjectData.chapters.find(c => String(c.no) === rootNo) || null;
    }, [studentSubjects, activeSubject]);

    const handleLogDoubt = useCallback((node: SyllabusNode & { level: number }) => {
        const rootChapter = getRootChapterForNode(node.no);
        if (!rootChapter) return;
        const partialDoubt: Partial<Doubt> = {
            subject: activeSubject,
            chapterNo: rootChapter.no,
            chapterName: rootChapter.name,
            topic: node.level > 1 ? `${node.no} ${node.name}` : undefined,
            nodePath: String(node.no),
            origin: 'During Reading'
        };
        openDoubtForm(student, partialDoubt);
    }, [activeSubject, getRootChapterForNode, openDoubtForm, student]);

    const handleToggleCompletion = useCallback(async (node: SyllabusNode, isCompleted: boolean) => {
        const today = new Date().toISOString().split('T')[0];
        const note = isCompleted ? `Marked as completed.` : `Marked as incomplete.`;
        await handleUpdateSyllabusNode(student.id, activeSubject, node.no, { isCompleted, notesToAdd: [{ date: today, note }] });
    }, [student.id, activeSubject, handleUpdateSyllabusNode]);

    const handleSaveNote = useCallback(async (note: string) => {
        if (!nodeForNote) return;
        const today = new Date().toISOString().split('T')[0];
        await handleUpdateSyllabusNode(student.id, activeSubject, nodeForNote.no, { notesToAdd: [{ date: today, note }] });
        setNodeForNote(null);
    }, [student.id, activeSubject, nodeForNote, handleUpdateSyllabusNode]);
    
    const handleDeleteNote = useCallback(async (node: SyllabusNode, noteIndex: number) => {
        await handleUpdateSyllabusNode(student.id, activeSubject, node.no, { noteIndicesToDelete: [noteIndex] });
    }, [student.id, activeSubject, handleUpdateSyllabusNode]);

    const subjectData = flattenedSyllabusBySubject.find(s => s.subject === activeSubject);

    return (
        <div>
            {/* Header and Tabs (non-scrolling part) */}
            <div>
                <SPHeader title="My Syllabus" student={student} onBack={() => onNavigate('dashboard')} />
                <p className="text-sm sm:text-base text-muted-foreground mb-4 -mt-4 px-4 sm:px-0">Track your progress through each subject.</p>

                <div className="flex flex-wrap pb-2 gap-2 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                    {studentSubjects.map(subject => (
                        <button
                            key={subject.subject}
                            onClick={() => setActiveSubject(subject.subject)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                                activeSubject === subject.subject 
                                ? 'bg-primary text-primary-foreground border-primary shadow-md' 
                                : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                            }`}
                        >
                            {subject.subject}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline Content */}
            <div>
                <div className="relative pt-4">
                    {/* Vertical Timeline Line */}
                    <div className="absolute top-4 left-[12px] w-0.5 h-full bg-border -z-10"></div>
                    
                    {subjectData?.nodes.map(node => {
                        const progress = progressMap.get(`${activeSubject}-${node.no}`);
                        const isCompleted = progress?.isCompleted || false;
                        return (
                            <SPMilestoneItem 
                                key={`${node.no}-${node.name}`} 
                                node={node} 
                                isCompleted={isCompleted} 
                                progress={progress}
                                onToggle={handleToggleCompletion}
                                onOpenNoteModal={setNodeForNote}
                                onDeleteNote={handleDeleteNote}
                                onLogDoubt={handleLogDoubt}
                            />
                        );
                    })}
                    {(!subjectData || subjectData.nodes.length === 0) && (
                         <div className="text-center py-20 text-muted-foreground bg-muted/30 rounded-2xl flex flex-col items-center justify-center">
                            <VscChecklist className="h-16 w-16 mb-4 opacity-50"/>
                            <h3 className="text-xl font-semibold">No syllabus defined</h3>
                            <p>Ask your mentor to add a syllabus for {activeSubject || 'this subject'}.</p>
                        </div>
                    )}
                </div>
            </div>

            {nodeForNote && (
                <AddNoteModal 
                    node={nodeForNote} 
                    onClose={() => setNodeForNote(null)} 
                    onSave={handleSaveNote} 
                />
            )}
        </div>
    );
};

export default SPSyllabusProgressPage;