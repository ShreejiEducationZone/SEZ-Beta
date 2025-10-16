import React, { useState, useMemo, FC, useEffect } from 'react';
import { Student, SubjectData, SyllabusNode, SheetProgress, SheetColumn, WorkItem } from '../types';
import { useSyllabus } from '../context/SyllabusContext';
import { useSheet } from '../context/SheetContext';
import { useWorkPool } from '../context/WorkPoolContext';
import { FaChevronLeft, FaPlus } from 'react-icons/fa';
import ManageSheetColumnsModal from './ManageSheetColumnsModal';
import WrenchScrewdriverIcon from './icons/WrenchScrewdriverIcon';
import UnsavedChangesAlert from './UnsavedChangesAlert';
import SelectSheetTaskModal from './AssignSheetTaskModal';
import Checkbox from './form/Checkbox';

interface StudentSheetPageProps {
    student: Student;
    onBack: () => void;
}

const DEFAULT_COLUMNS: SheetColumn[] = [
    { id: 'reading', name: 'Reading' },
    { id: 'videos', name: 'Videos' },
    { id: 'notes', name: 'Notes' },
    { id: 'exercise', name: 'Exercise' },
    { id: 'test', name: 'Test' },
];

const StudentSheetPage: FC<StudentSheetPageProps> = ({ student, onBack }) => {
    const { allStudentSubjects, handleSaveSubjects } = useSyllabus();
    const { sheetProgress, handleSaveSheetProgress } = useSheet();
    const { workItems, openWorkForm } = useWorkPool();
    const studentSubjects = useMemo(() => allStudentSubjects[student.id]?.subjects || [], [allStudentSubjects, student.id]);
    
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
    const [chapterForTaskSelection, setChapterForTaskSelection] = useState<SyllabusNode | null>(null);

    useEffect(() => {
        if (studentSubjects.length > 0 && !selectedSubject) {
            setSelectedSubject(studentSubjects[0].subject);
        }
    }, [studentSubjects, selectedSubject]);

    const selectedSubjectData = useMemo(() => {
        return studentSubjects.find(s => s.subject === selectedSubject);
    }, [studentSubjects, selectedSubject]);

    const columnsToRender = useMemo(() => {
        return selectedSubjectData?.sheetColumns && selectedSubjectData.sheetColumns.length > 0
            ? selectedSubjectData.sheetColumns
            : DEFAULT_COLUMNS;
    }, [selectedSubjectData]);
    
    const initialProgress = useMemo(() => {
        const map = new Map<string, Record<string, boolean>>();
        sheetProgress
            .filter(p => p.studentId === student.id)
            .forEach(p => {
                map.set(p.id, p.tasks);
            });
        return map;
    }, [sheetProgress, student.id]);

    const [pendingChanges, setPendingChanges] = useState<Map<string, Record<string, boolean>>>(new Map());
    const [isSaving, setIsSaving] = useState(false);
    
    const handleCheckboxChange = (chapterNo: string | number, columnId: string) => {
        const progressId = `${student.id}__${selectedSubject}__${chapterNo}`;
        
        const currentTasks = pendingChanges.get(progressId) 
            || initialProgress.get(progressId) 
            || {};
        
        const newTasks = { ...currentTasks, [columnId]: !currentTasks[columnId] };
        
        setPendingChanges(prev => new Map(prev).set(progressId, newTasks));
    };

    const handleSaveProgress = async () => {
        setIsSaving(true);
        try {
            await handleSaveSheetProgress(pendingChanges);
            setPendingChanges(new Map());
        } catch (error) {
            console.error("Save failed in component", error);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDiscardChanges = () => {
        setPendingChanges(new Map());
    };

    const handleSaveColumns = async (newColumns: SheetColumn[]) => {
        if (!selectedSubjectData) return;
        
        const updatedSubjects = studentSubjects.map(s => 
            s.subject === selectedSubject 
            ? { ...s, sheetColumns: newColumns }
            : s
        );

        try {
            await handleSaveSubjects(student.id, updatedSubjects);
            setIsColumnModalOpen(false);
        } catch (error) {
            console.error("Failed to save custom columns:", error);
        }
    };
    
    const handleTaskSelected = (task: SheetColumn) => {
        if (!chapterForTaskSelection) return;

        const partialWorkItem: Partial<WorkItem> = {
            title: `Sheet Task: ${task.name} for Ch ${chapterForTaskSelection.no}`,
            subject: selectedSubject,
            chapterNo: chapterForTaskSelection.no,
            chapterName: chapterForTaskSelection.name,
            description: `Please complete the "${task.name}" task for this chapter.`,
            source: 'sheets',
            sheetTasks: [task.name],
            sheetTaskIds: [task.id],
            status: 'Assign',
        };
        
        setChapterForTaskSelection(null); 
        openWorkForm(student, partialWorkItem);
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                    <FaChevronLeft /> Back to Student List
                </button>
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-foreground truncate">Progress Sheet: {student.name}</h1>
                </div>
                 <div className="w-24 flex-shrink-0"></div>
            </div>
            
            <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
                <header className="p-4 flex justify-between items-center border-b border-border bg-muted/30">
                     {studentSubjects.length > 0 ? (
                        <select
                            value={selectedSubject}
                            onChange={(e) => {
                                if (pendingChanges.size > 0) {
                                    setShowUnsavedWarning(true);
                                    return;
                                }
                                setSelectedSubject(e.target.value);
                            }}
                            className="h-10 px-3 rounded-lg border border-border bg-background font-semibold text-lg focus:ring-2 focus:ring-primary/50"
                            aria-label="Select subject"
                        >
                            {studentSubjects.map(s => <option key={s.subject} value={s.subject}>{s.subject}</option>)}
                        </select>
                    ) : (
                        <div className="font-semibold text-lg text-foreground">No Subjects Available</div>
                    )}
                     <button
                        onClick={() => setIsColumnModalOpen(true)}
                        className="flex items-center gap-2 h-10 px-4 rounded-lg bg-muted text-muted-foreground hover:bg-border text-sm font-semibold"
                    >
                        <WrenchScrewdriverIcon className="h-4 w-4" />
                        Customize Columns
                    </button>
                </header>

                <div className="max-h-[calc(100vh-20rem)] overflow-auto thin-scrollbar">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm">
                            <tr className="border-b border-border">
                                <th scope="col" className="px-6 py-4 font-semibold text-foreground bg-card/80 backdrop-blur-sm min-w-[300px]">Chapter</th>
                                {columnsToRender.map(col => (
                                    <th key={col.id} scope="col" className="px-6 py-4 font-semibold text-foreground text-center min-w-[120px]">
                                        {col.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {selectedSubjectData && selectedSubjectData.chapters.length > 0 ? (
                                selectedSubjectData.chapters.map((chapter: SyllabusNode) => {
                                    const progressId = `${student.id}__${selectedSubjectData.subject}__${chapter.no}`;
                                    const tasks = pendingChanges.get(progressId) || initialProgress.get(progressId) || {};
                                    return (
                                        <tr 
                                            key={progressId} 
                                            onDoubleClick={() => setChapterForTaskSelection(chapter)}
                                            className="group hover:bg-muted/30 cursor-pointer"
                                            title="Double-click to assign tasks"
                                        >
                                            <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap bg-card group-hover:bg-muted/30 transition-colors">
                                                {chapter.no}. {chapter.name}
                                            </td>
                                            {columnsToRender.map(col => (
                                                <td key={col.id} className="px-6 py-4 text-center">
                                                    <div className="flex justify-center">
                                                        <Checkbox
                                                            checked={!!tasks[col.id]}
                                                            onChange={() => handleCheckboxChange(chapter.no, col.id)}
                                                        />
                                                    </div>
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={columnsToRender.length + 1} className="text-center py-16 text-muted-foreground">
                                        <h3 className="text-xl font-bold">No Chapters Defined</h3>
                                        <p>Go to the Subject Manager to add chapters for this subject.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {pendingChanges.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
                    <div className="bg-card/80 backdrop-blur-xl border border-border rounded-full shadow-soft-lg p-2 flex items-center justify-between">
                        <p className="text-sm font-semibold pl-4 text-foreground">{pendingChanges.size} unsaved change{pendingChanges.size > 1 ? 's' : ''}</p>
                        <div className="flex gap-2">
                            <button onClick={handleDiscardChanges} className="h-9 px-4 rounded-full text-sm font-semibold text-muted-foreground hover:bg-muted">Discard</button>
                            <button onClick={handleSaveProgress} disabled={isSaving} className="h-9 px-4 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isColumnModalOpen && (
                <ManageSheetColumnsModal
                    isOpen={isColumnModalOpen}
                    onClose={() => setIsColumnModalOpen(false)}
                    onSave={handleSaveColumns}
                    initialColumns={columnsToRender}
                    subjectName={selectedSubject}
                />
            )}
            
            <UnsavedChangesAlert 
                isOpen={showUnsavedWarning}
                onClose={() => setShowUnsavedWarning(false)}
            />

            {chapterForTaskSelection && selectedSubjectData && (
                <SelectSheetTaskModal
                    isOpen={!!chapterForTaskSelection}
                    onClose={() => setChapterForTaskSelection(null)}
                    onTaskSelect={handleTaskSelected}
                    student={student}
                    subject={selectedSubjectData.subject}
                    chapter={chapterForTaskSelection}
                    columns={columnsToRender}
                    workItems={workItems}
                />
            )}
        </div>
    );
};

export default StudentSheetPage;
