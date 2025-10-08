
import React, { useState, useMemo, FC, useCallback } from 'react';
import { Student, SubjectData, SyllabusProgress, SyllabusNode, ProgressEntry } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import AddNoteModal from './AddNoteModal';
import MilestoneItem from './MilestoneItem';

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

interface SyllabusFocusPageProps {
    student: Student;
    studentSubjects: SubjectData[];
    syllabusProgress: SyllabusProgress[];
    onUpdateNode: (studentId: string, subject: string, nodeNo: string | number, updates: { isCompleted?: boolean; notesToAdd?: ProgressEntry[]; noteIndicesToDelete?: number[] }) => Promise<void>;
    onBack: () => void;
}

const SyllabusFocusPage: FC<SyllabusFocusPageProps> = ({ student, studentSubjects, syllabusProgress, onUpdateNode, onBack }) => {
    const [activeSubject, setActiveSubject] = useState<string>(studentSubjects[0]?.subject || '');
    const [nodeForNote, setNodeForNote] = useState<(SyllabusNode & { level: number }) | null>(null);

    const progressMap = useMemo(() => {
        const map = new Map<string, SyllabusProgress>();
        syllabusProgress.forEach(p => map.set(`${p.subject}-${p.nodeNo}`, p));
        return map;
    }, [syllabusProgress]);

    const flattenedSyllabusBySubject = useMemo(() => flattenSyllabus(studentSubjects), [studentSubjects]);

    const handleToggleCompletion = useCallback(async (node: SyllabusNode, isCompleted: boolean) => {
        const today = new Date().toISOString().split('T')[0];
        const note = isCompleted ? `Completed on ${today}` : `Marked as incomplete on ${today}`;
        await onUpdateNode(student.id, activeSubject, node.no, { isCompleted, notesToAdd: [{ date: today, note }] });
    }, [student.id, activeSubject, onUpdateNode]);

    const handleSaveNote = useCallback(async (note: string) => {
        if (!nodeForNote) return;
        const today = new Date().toISOString().split('T')[0];
        await onUpdateNode(student.id, activeSubject, nodeForNote.no, { notesToAdd: [{ date: today, note }] });
        setNodeForNote(null);
    }, [student.id, activeSubject, nodeForNote, onUpdateNode]);
    
    const handleDeleteNote = useCallback(async (node: SyllabusNode, noteIndex: number) => {
        await onUpdateNode(student.id, activeSubject, node.no, { noteIndicesToDelete: [noteIndex] });
    }, [student.id, activeSubject, onUpdateNode]);

    const subjectData = flattenedSyllabusBySubject.find(s => s.subject === activeSubject);

    return (
        <>
            <div>
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4"><ChevronLeftIcon className="h-5 w-5" />Back to All Students</button>
            </div>
            <div className="bg-card rounded-2xl shadow-soft border border-border p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">{student.name}'s Progress</h2>
                        <p className="text-muted-foreground">{student.board} • Grade {student.grade}</p>
                    </div>
                </div>

                <div className="border-b border-border">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        {studentSubjects.map(subject => (
                            <button key={subject.subject} onClick={() => setActiveSubject(subject.subject)} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeSubject === subject.subject ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                                {subject.subject}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-6 relative max-h-[60vh] overflow-y-auto thin-scrollbar pr-4 -mr-4">
                     {/* Vertical Timeline Line */}
                    <div className="absolute top-0 left-[7px] w-0.5 h-full bg-border -z-10"></div>
                    
                    {subjectData?.nodes.map(node => {
                        const progress = progressMap.get(`${activeSubject}-${node.no}`);
                        const isCompleted = progress?.isCompleted || false;
                        return (
                            <MilestoneItem 
                                key={node.no} 
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
                         <div className="text-center py-16 text-muted-foreground">
                            <h3 className="text-lg font-semibold">No syllabus defined for {activeSubject}.</h3>
                            <p>Go to the Subject Manager to add chapters and topics.</p>
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
        </>
    );
};

export default SyllabusFocusPage;
