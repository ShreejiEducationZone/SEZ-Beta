import React, { useState, useMemo, FC, useCallback } from 'react';
import { Student, SubjectData, SyllabusProgress, SyllabusNode, ProgressEntry } from '../../types';
import { useSyllabus } from '../../context/SyllabusContext';
import AddNoteModal from '../AddNoteModal';
import SPMilestoneItem from './SPMilestoneItem';
import { VscChecklist } from 'react-icons/vsc';

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
}

const SPSyllabusProgressPage: FC<SPSyllabusProgressPageProps> = ({ student }) => {
    const { allStudentSubjects, syllabusProgress, handleUpdateSyllabusNode } = useSyllabus();
    
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
        <>
            <h1 className="text-3xl font-bold mb-2">My Syllabus</h1>
            <p className="text-muted-foreground mb-6">Track your progress through each subject.</p>

            <div className="border-b border-border mb-6">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {studentSubjects.map(subject => (
                        <button key={subject.subject} onClick={() => setActiveSubject(subject.subject)} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeSubject === subject.subject ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                            {subject.subject}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="relative max-h-[calc(100vh-20rem)] overflow-y-auto thin-scrollbar pr-2 -mr-2">
                 {/* Vertical Timeline Line */}
                <div className="absolute top-0 left-[12px] w-0.5 h-full bg-border -z-10"></div>
                
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

            {nodeForNote && (
                <AddNoteModal 
                    node={nodeForNote} 
                    onClose={() => setNodeForNote(null)} 
                    onSave={handleSaveNote} 
                />
            )}
        </>
    );
};

export default SPSyllabusProgressPage;