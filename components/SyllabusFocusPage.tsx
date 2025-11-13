import React, { useState, useMemo, FC, useCallback } from 'react';
import { Student, SubjectData, SyllabusProgress, SyllabusNode, ProgressEntry, WorkItem, Doubt, Test } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import AddNoteModal from './AddNoteModal';
import MilestoneItem from './MilestoneItem';
import { useSyllabus } from '../context/SyllabusContext';
import { useWorkPool } from '../context/WorkPoolContext';

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
    const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
    const [isSaving, setIsSaving] = useState(false);

    const { handleBatchUpdateSyllabusProgress } = useSyllabus();
    const { openWorkForm, openTestForm, openDoubtForm } = useWorkPool();


    const getRootChapterForNode = (nodeNo: string | number): SyllabusNode | null => {
        const subjectData = studentSubjects.find(s => s.subject === activeSubject);
        if (!subjectData) return null;
        const rootNo = String(nodeNo).split('.')[0];
        return subjectData.chapters.find(c => String(c.no) === rootNo) || null;
    };


    // FIX: Update node type to include 'level' property.
    const handleAssignWork = (node: SyllabusNode & { level: number }) => {
        const rootChapter = getRootChapterForNode(node.no);
        if (!rootChapter) return;
        const partialWorkItem: Partial<WorkItem> = {
            title: `Work for: ${node.name}`,
            subject: activeSubject,
            chapterNo: rootChapter.no,
            chapterName: rootChapter.name,
            topic: node.level > 1 ? `${node.no} ${node.name}` : undefined,
            nodePath: String(node.no),
            description: `Complete the work related to "${node.name}".`,
            source: 'syllabus',
            status: 'Assign'
        };
        openWorkForm(student, partialWorkItem);
    };
    
    // FIX: Update node type to include 'level' property for consistency.
    const handleScheduleTest = (node: SyllabusNode & { level: number }) => {
        const rootChapter = getRootChapterForNode(node.no);
        if (!rootChapter) return;
        const partialTest: Partial<Test> = {
            title: `Test on: ${node.name}`,
            subject: activeSubject,
            chapters: [{ no: rootChapter.no, name: rootChapter.name }],
            status: 'Upcoming'
        };
        openTestForm(student, partialTest);
    };

    // FIX: Update node type to include 'level' property.
    const handleLogDoubt = (node: SyllabusNode & { level: number }) => {
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
    };


    const progressMap = useMemo(() => {
        const map = new Map<string, SyllabusProgress>();
        syllabusProgress.forEach(p => map.set(`${p.subject}-${p.nodeNo}`, p));
        return map;
    }, [syllabusProgress]);

    const flattenedSyllabusBySubject = useMemo(() => flattenSyllabus(studentSubjects), [studentSubjects]);

    const handleToggleCompletion = useCallback((node: SyllabusNode) => {
        const progressId = `${student.id}-${activeSubject}-${node.no}`;
        const originalProgress = progressMap.get(`${activeSubject}-${node.no}`);
        const originalStatus = originalProgress?.isCompleted || false;

        setPendingChanges(prev => {
            const newChanges = new Map(prev);
            if (newChanges.has(progressId)) {
                newChanges.delete(progressId);
            } else {
                newChanges.set(progressId, !originalStatus);
            }
            return newChanges;
        });
    }, [student.id, activeSubject, progressMap]);

    const handleSave = async () => {
        if (pendingChanges.size === 0) return;
        setIsSaving(true);
        try {
            await handleBatchUpdateSyllabusProgress(pendingChanges);
            setPendingChanges(new Map());
        } catch (error) {
            // Error is handled by context's toast
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDiscard = () => {
        setPendingChanges(new Map());
    };

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
                <button
                    onClick={onBack}
                    className="mb-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-muted px-3 text-sm font-semibold text-muted-foreground ring-offset-background transition-colors hover:bg-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:px-4"
                    aria-label="Back to all students"
                >
                    <ChevronLeftIcon className="h-5 w-5" />
                    <span className="hidden md:inline">Back to All Students</span>
                </button>
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

                <div className="mt-4 pt-2 relative max-h-[60vh] overflow-y-auto thin-scrollbar pr-4 -mr-4">
                     {/* Vertical Timeline Line */}
                    <div className="absolute top-0 left-[7px] w-0.5 h-full bg-border -z-10"></div>
                    
                    {subjectData?.nodes.map(node => {
                        const progressId = `${student.id}-${activeSubject}-${node.no}`;
                        const progress = progressMap.get(`${activeSubject}-${node.no}`);
                        
                        const isCompleted = pendingChanges.has(progressId)
                            ? pendingChanges.get(progressId)!
                            : progress?.isCompleted || false;

                        return (
                            <MilestoneItem 
                                key={node.no} 
                                node={node} 
                                isCompleted={isCompleted} 
                                progress={progress}
                                onToggle={handleToggleCompletion}
                                onOpenNoteModal={setNodeForNote}
                                onDeleteNote={handleDeleteNote}
                                onAssignWork={handleAssignWork}
                                onScheduleTest={handleScheduleTest}
                                onLogDoubt={handleLogDoubt}
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

            {pendingChanges.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
                    <div className="bg-card/80 backdrop-blur-xl border border-border rounded-full shadow-soft-lg p-2 flex items-center justify-between">
                        <p className="text-sm font-semibold pl-4 text-foreground">{pendingChanges.size} unsaved change{pendingChanges.size > 1 ? 's' : ''}</p>
                        <div className="flex gap-2">
                            <button onClick={handleDiscard} className="h-9 px-4 rounded-full text-sm font-semibold text-muted-foreground hover:bg-muted">Discard</button>
                            <button onClick={handleSave} disabled={isSaving} className="h-9 px-4 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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