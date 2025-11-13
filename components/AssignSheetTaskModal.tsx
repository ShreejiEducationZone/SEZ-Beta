import React, { useMemo, FC } from 'react';
import { SheetColumn, WorkItem, Student, SyllabusNode } from '../types';

interface SelectSheetTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTaskSelect: (task: SheetColumn) => void;
    student: Student;
    subject: string;
    node: SyllabusNode;
    columns: SheetColumn[];
    workItems: WorkItem[];
}

const SelectSheetTaskModal: FC<SelectSheetTaskModalProps> = ({ isOpen, onClose, onTaskSelect, student, subject, node, columns, workItems }) => {
    
    const { pendingTaskIds, completedTaskIds } = useMemo(() => {
        const pending = new Set<string>();
        const completed = new Set<string>();
        workItems
            .filter(item => 
                item.studentId === student.id &&
                item.subject === subject &&
                item.nodePath === String(node.no) &&
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
    }, [workItems, student.id, subject, node.no]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card/90 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header>
                    <h3 className="text-xl font-bold text-foreground">Which task to assign?</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        For {student.name} - {node.no}: {node.name}
                    </p>
                </header>

                <main className="my-4 space-y-2 max-h-64 overflow-y-auto thin-scrollbar pr-2 -mr-2">
                    {columns.map(col => {
                        const isPending = pendingTaskIds.has(col.id);
                        const isCompleted = completedTaskIds.has(col.id);
                        const isDisabled = isPending || isCompleted;
                        let statusText = '';
                        if (isPending) statusText = 'Assigned';
                        if (isCompleted) statusText = 'Completed';

                        return (
                            <button
                                key={col.id}
                                onClick={() => !isDisabled && onTaskSelect(col)}
                                disabled={isDisabled}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                                    isDisabled
                                        ? 'bg-muted/50 border-border opacity-60 cursor-not-allowed'
                                        : 'border-border bg-background hover:bg-primary/10 hover:border-primary/50'
                                }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-foreground">{col.name}</span>
                                    {statusText && <span className="text-xs font-semibold text-muted-foreground">{statusText}</span>}
                                </div>
                            </button>
                        );
                    })}
                </main>

                <footer className="mt-6 flex justify-end">
                    <button onClick={onClose} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold">Cancel</button>
                </footer>
            </div>
        </div>
    );
};

export default SelectSheetTaskModal;