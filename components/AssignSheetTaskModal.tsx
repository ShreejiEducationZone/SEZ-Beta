import React, { useState, useMemo, FC } from 'react';
// FIX: Import specific context hooks
import { useData } from '../context/DataContext';
import { useWorkPool } from '../context/WorkPoolContext';
import { Student, SyllabusNode, SheetColumn, WorkItem, WorkPriority } from '../types';
import { WORK_PRIORITIES } from '../constants';
import InputField from './form/InputField';
import SelectField from './form/SelectField';

interface AssignSheetTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student;
    subject: string;
    chapter: SyllabusNode;
    columns: SheetColumn[];
    workItems: WorkItem[];
}

const AssignSheetTaskModal: FC<AssignSheetTaskModalProps> = ({ isOpen, onClose, student, subject, chapter, columns, workItems }) => {
    // FIX: Get data from specific context hooks
    const { handleSaveWorkItem } = useWorkPool();
    const { showToast } = useData();
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState<WorkPriority>('Medium');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const { pendingTaskIds, completedTaskIds } = useMemo(() => {
        const pending = new Set<string>();
        const completed = new Set<string>();
        workItems
            .filter(item => 
                item.studentId === student.id &&
                item.subject === subject &&
                String(item.chapterNo) === String(chapter.no) &&
                item.source === 'sheets' &&
                item.sheetTaskIds
            )
            .forEach(item => {
                if (item.status === 'Completed') {
                    item.sheetTaskIds!.forEach(id => completed.add(id));
                } else { // 'Assign' or 'Pending'
                    item.sheetTaskIds!.forEach(id => pending.add(id));
                }
            });
        return { pendingTaskIds: pending, completedTaskIds: completed };
    }, [workItems, student.id, subject, chapter.no]);


    if (!isOpen) return null;

    const handleAssign = async () => {
        if (!selectedTaskId) {
            setError('Please select one task to assign.');
            return;
        }
        if (!dueDate) {
            setError('Please set a due date.');
            return;
        }
        setError('');
        setIsSaving(true);

        const selectedTaskObject = columns.find(c => c.id === selectedTaskId);
        if (!selectedTaskObject) return;

        const newWorkItem: WorkItem = {
            id: `w_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            studentId: student.id,
            title: `Sheet Task: ${selectedTaskObject.name} for Ch ${chapter.no}`,
            subject: subject,
            chapterNo: chapter.no,
            chapterName: chapter.name,
            description: `Please complete the "${selectedTaskObject.name}" task for this chapter.`,
            dueDate: dueDate,
            status: 'Assign',
            priority: priority,
            dateCreated: new Date().toISOString().split('T')[0],
            source: 'sheets',
            sheetTasks: [selectedTaskObject.name],
            sheetTaskIds: [selectedTaskObject.id],
        };

        try {
            await handleSaveWorkItem(newWorkItem);
            showToast(`Assigned sheet task to ${student.name}.`, 'success');
            onClose();
        } catch (err) {
            showToast('Failed to assign task. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card/90 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0">
                    <h3 className="text-xl font-bold text-foreground">Assign Sheet Task</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        For {student.name} - Chapter {chapter.no}: {chapter.name}
                    </p>
                </header>

                <main className="flex-grow my-4 space-y-4 overflow-y-auto thin-scrollbar pr-2 -mr-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Select one task to assign:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                             {columns.map(col => {
                                const isPending = pendingTaskIds.has(col.id);
                                const isCompleted = completedTaskIds.has(col.id);
                                const isDisabled = isPending || isCompleted;
                                let statusText = '';
                                if (isPending) statusText = '(Assigned)';
                                if (isCompleted) statusText = '(Completed)';

                                return (
                                    <label 
                                        key={col.id} 
                                        title={isDisabled ? `This task is already ${statusText.toLowerCase().replace(/[()]/g, '')}.` : ''}
                                        className={`block p-3 rounded-lg border ${
                                            isDisabled
                                                ? 'bg-muted/50 border-border opacity-60 cursor-not-allowed' 
                                                : 'border-border bg-background has-[:checked]:bg-primary/10 has-[:checked]:border-primary/50 cursor-pointer'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            <input
                                                type="radio"
                                                name="sheet-task"
                                                value={col.id}
                                                checked={selectedTaskId === col.id}
                                                onChange={() => !isDisabled && setSelectedTaskId(col.id)}
                                                disabled={isDisabled}
                                                className="h-4 w-4 text-primary focus:ring-primary mt-1 flex-shrink-0"
                                            />
                                            <div className="flex-grow">
                                                <span className="font-medium text-foreground">{col.name}</span>
                                                {statusText && <span className="block text-xs font-semibold text-muted-foreground">{statusText}</span>}
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField type="date" label="Due Date" name="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                        <SelectField label="Priority" name="priority" value={priority} onChange={e => setPriority(e.target.value as WorkPriority)} options={WORK_PRIORITIES} />
                    </div>
                    {error && <p className="text-sm text-danger">{error}</p>}
                </main>

                <footer className="mt-6 flex justify-end space-x-3 flex-shrink-0">
                    <button onClick={onClose} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold">Cancel</button>
                    <button onClick={handleAssign} disabled={isSaving} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:bg-muted disabled:cursor-wait min-w-[120px]">
                        {isSaving ? 'Assigning...' : 'Assign Task'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AssignSheetTaskModal;