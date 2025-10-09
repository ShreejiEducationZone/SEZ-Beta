import React, { useState, useMemo, FC, useCallback } from 'react';
import { Student, SubjectData, SyllabusNode, ProgressEntry, SyllabusProgress } from '../../types';
import { useData } from '../../context/DataContext';
import SelectField from '../form/SelectField';
import SPMilestoneItem from './SPMilestoneItem';
import AddNoteModal from '../AddNoteModal';
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
    const { allStudentSubjects, syllabusProgress, handleUpdateSyllabusNode, showToast } = useData();
    const studentSubjects = useMemo(() => allStudentSubjects[student.id]?.subjects || [], [allStudentSubjects, student.id]);
    
    const [activeSubject, setActiveSubject] = useState<string>(studentSubjects[0]?.subject || '');
    const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
    const [isSaving, setIsSaving] = useState(false);
    const [nodeForNote, setNodeForNote] = useState<(SyllabusNode & { level: number }) | null>(null);

    const flattenedSyllabusBySubject = useMemo(() => flattenSyllabus(studentSubjects), [studentSubjects]);

    const progressMap = useMemo(() => {
        const map = new Map<string, SyllabusProgress>();
        syllabusProgress.forEach(p => {
            if (p.studentId === student.id) {
                map.set(`${p.subject}-${p.nodeNo}`, p);
            }
        });
        return map;
    }, [syllabusProgress, student.id]);

    const handleToggleCompletion = (node: SyllabusNode, isCompleted: boolean) => {
        const changeKey = `${activeSubject}-${node.no}`;
        setPendingChanges(prev => new Map(prev).set(changeKey, isCompleted));
    };

    const handleSaveChanges = async () => {
        if (pendingChanges.size === 0) {
            showToast("No changes to save.", "info");
            return;
        }
        setIsSaving(true);
        const today = new Date().toISOString().split('T')[0];
        
        const updates = Array.from(pendingChanges.entries()).map(([key, isCompleted]) => {
            const [subject, nodeNo] = key.split('-');
            const note = isCompleted ? `Marked as completed.` : `Marked as incomplete.`;
            return handleUpdateSyllabusNode(student.id, subject, nodeNo, { isCompleted, notesToAdd: [{ date: today, note }] });
        });

        try {
            await Promise.all(updates);
            showToast(`Saved ${updates.length} progress update(s)!`, 'success');
            setPendingChanges(new Map());
        } catch (error) {
            showToast("An error occurred while saving.", "error");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleSaveNote = useCallback(async (note: string) => {
        if (!nodeForNote) return;
        const today = new Date().toISOString().split('T')[0];
        await handleUpdateSyllabusNode(student.id, activeSubject, nodeForNote.no, { notesToAdd: [{ date: today, note }] });
        setNodeForNote(null);
        showToast("Note added!", 'success');
    }, [student.id, activeSubject, nodeForNote, handleUpdateSyllabusNode, showToast]);
    
    const handleDeleteNote = useCallback(async (node: SyllabusNode, noteIndex: number) => {
        await handleUpdateSyllabusNode(student.id, activeSubject, node.no, { noteIndicesToDelete: [noteIndex] });
        showToast("Note deleted.", 'success');
    }, [student.id, activeSubject, handleUpdateSyllabusNode, showToast]);
    
    const subjectData = flattenedSyllabusBySubject.find(s => s.subject === activeSubject);

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">My Syllabus Progress</h1>
                    <p className="text-muted-foreground">Track your chapter-wise learning journey.</p>
                </div>
                 <button 
                    onClick={handleSaveChanges}
                    disabled={pendingChanges.size === 0 || isSaving}
                    className="h-10 px-6 rounded-lg bg-primary text-primary-foreground font-semibold disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed hover:bg-primary/90 transition-colors self-end sm:self-center"
                >
                    {isSaving ? 'Saving...' : `Save (${pendingChanges.size})`}
                </button>
            </div>
            
            <div className="bg-card rounded-2xl shadow-soft border border-border p-4 sm:p-6">
                <div className="max-w-xs mb-6">
                    <SelectField
                        label="Select Subject"
                        name="subject"
                        value={activeSubject}
                        onChange={e => setActiveSubject(e.target.value)}
                        options={studentSubjects.map(s => s.subject)}
                    />
                </div>
                <div className="relative max-h-[60vh] overflow-y-auto thin-scrollbar pr-2 -mr-4">
                    {subjectData && subjectData.nodes.length > 0 && <div className="absolute top-0 left-[9px] w-0.5 h-full bg-border -z-10"></div>}
                    
                    {subjectData?.nodes.map(node => {
                        const changeKey = `${activeSubject}-${node.no}`;
                        const progress = progressMap.get(changeKey);
                        const isCompleted = pendingChanges.has(changeKey) ? pendingChanges.get(changeKey)! : (progress?.isCompleted || false);
                        return (
                           <SPMilestoneItem 
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
                         <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center">
                            <VscChecklist className="h-16 w-16 mb-4 opacity-50"/>
                            <h3 className="text-lg font-semibold">No syllabus defined for {activeSubject}.</h3>
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

export default SPSyllabusProgressPage;