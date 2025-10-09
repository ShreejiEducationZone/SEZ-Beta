import React, { useState, useMemo, FC, useEffect } from 'react';
import { Student, SubjectData, SyllabusNode, SheetProgress, SheetColumn } from '../types';
import { useData } from '../context/DataContext';
import { FaChevronLeft, FaPlus } from 'react-icons/fa';
import ManageSheetColumnsModal from './ManageSheetColumnsModal';
import WrenchScrewdriverIcon from './icons/WrenchScrewdriverIcon';
import UnsavedChangesAlert from './UnsavedChangesAlert';
import AssignSheetTaskModal from './AssignSheetTaskModal';

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
    const { allStudentSubjects, sheetProgress, handleSaveSheetProgress, handleSaveSubjects } = useData();
    const studentSubjects = useMemo(() => allStudentSubjects[student.id]?.subjects || [], [allStudentSubjects, student.id]);
    
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
    const [assigningTaskForChapter, setAssigningTaskForChapter] = useState<SyllabusNode | null>(null);

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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                    <FaChevronLeft /> Back to Student List
                </button>
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-foreground truncate">Progress Sheet: {student.name}</h1>
                </div>
                 <button 
                    onClick={handleSaveProgress}
                    disabled={pendingChanges.size === 0 || isSaving}
                    className="h-10 px-6 rounded-lg bg-primary text-primary-foreground font-semibold disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                >
                    {isSaving ? 'Saving...' : `Save (${pendingChanges.size})`}
                </button>
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
                                            onDoubleClick={() => setAssigningTaskForChapter(chapter)}
                                            className="group hover:bg-muted/30 cursor-pointer"
                                            title="Double-click to assign tasks"
                                        >
                                            <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap bg-card group-hover:bg-muted/30 transition-colors">
                                                {chapter.no}. {chapter.name}
                                            </td>
                                            {columnsToRender.map(col => (
                                                <td key={col.id} className="px-6 py-4 text-center">
                                                    <input 
                                                        type="checkbox"
                                                        checked={!!tasks[col.id]}
                                                        onChange={() => handleCheckboxChange(chapter.no, col.id)}
                                                        className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                        aria-label={`${col.name} for ${chapter.name}`}
                                                    />
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

            {assigningTaskForChapter && selectedSubjectData && (
                <AssignSheetTaskModal
                    isOpen={!!assigningTaskForChapter}
                    onClose={() => setAssigningTaskForChapter(null)}
                    student={student}
                    subject={selectedSubjectData.subject}
                    chapter={assigningTaskForChapter}
                    columns={columnsToRender}
                />
            )}
        </div>
    );
};

export default StudentSheetPage;