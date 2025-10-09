import React, { useState } from 'react';
import { Student, SyllabusNode, SheetColumn, WorkItem, WorkPriority } from '../types';
import { useData } from '../context/DataContext';
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
}

const AssignSheetTaskModal: React.FC<AssignSheetTaskModalProps> = ({ isOpen, onClose, student, subject, chapter, columns }) => {
    const { handleSaveWorkItem, showToast } = useData();
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState<WorkPriority>('Medium');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleToggleTask = (columnId: string) => {
        setSelectedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(columnId)) {
                newSet.delete(columnId);
            } else {
                newSet.add(columnId);
            }
            return newSet;
        });
    };

    const handleAssign = async () => {
        if (selectedTasks.size === 0) {
            setError('Please select at least one task to assign.');
            return;
        }
        if (!dueDate) {
            setError('Please set a due date.');
            return;
        }
        setError('');
        setIsSaving(true);

        const selectedTaskObjects = columns.filter(c => selectedTasks.has(c.id));
        const selectedTaskNames = selectedTaskObjects.map(c => c.name);
        const selectedTaskIds = selectedTaskObjects.map(c => c.id);

        const description = `Please complete the following for this chapter:\n${selectedTaskNames.map(name => `- ${name}`).join('\n')}`;

        const newWorkItem: WorkItem = {
            id: `w_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            studentId: student.id,
            title: `Sheet Tasks for Ch ${chapter.no}: ${chapter.name}`,
            subject: subject,
            chapterNo: chapter.no,
            chapterName: chapter.name,
            description: description,
            dueDate: dueDate,
            status: 'Assign',
            priority: priority,
            dateCreated: new Date().toISOString().split('T')[0],
            source: 'sheets',
            sheetTasks: selectedTaskNames,
            sheetTaskIds: selectedTaskIds,
        };

        try {
            await handleSaveWorkItem(newWorkItem);
            showToast(`Assigned sheet tasks to ${student.name}.`, 'success');
            onClose();
        } catch (err) {
            showToast('Failed to assign tasks. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card/90 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0">
                    <h3 className="text-xl font-bold text-foreground">Assign Sheet Tasks</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        For {student.name} - Chapter {chapter.no}: {chapter.name}
                    </p>
                </header>

                <main className="flex-grow my-4 space-y-4 overflow-y-auto thin-scrollbar pr-2 -mr-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Select tasks to assign:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {columns.map(col => (
                                <label key={col.id} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-background has-[:checked]:bg-primary/10 has-[:checked]:border-primary/50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedTasks.has(col.id)}
                                        onChange={() => handleToggleTask(col.id)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="font-medium">{col.name}</span>
                                </label>
                            ))}
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
                        {isSaving ? 'Assigning...' : 'Assign Tasks'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AssignSheetTaskModal;