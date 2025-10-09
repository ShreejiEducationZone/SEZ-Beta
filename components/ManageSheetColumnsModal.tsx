import React, { useState, useEffect } from 'react';
import { SheetColumn } from '../types';
import InputField from './form/InputField';
import DeleteIcon from './icons/DeleteIcon';
import PlusIcon from './icons/PlusIcon';
import { toTitleCase } from '../utils/stringUtils';

interface ManageSheetColumnsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (columns: SheetColumn[]) => void;
    initialColumns: SheetColumn[];
    subjectName: string;
}

const ManageSheetColumnsModal: React.FC<ManageSheetColumnsModalProps> = ({ isOpen, onClose, onSave, initialColumns, subjectName }) => {
    const [columns, setColumns] = useState<SheetColumn[]>([]);
    const [newColumnName, setNewColumnName] = useState('');

    useEffect(() => {
        // Deep copy to avoid mutating props
        setColumns(JSON.parse(JSON.stringify(initialColumns)));
    }, [initialColumns]);

    if (!isOpen) return null;

    const handleColumnNameChange = (id: string, newName: string) => {
        setColumns(current => current.map(col => col.id === id ? { ...col, name: newName } : col));
    };

    const handleDeleteColumn = (id: string) => {
        setColumns(current => current.filter(col => col.id !== id));
    };

    const handleAddNewColumn = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = toTitleCase(newColumnName.trim());
        if (!trimmedName) return;

        const isDuplicate = columns.some(col => col.name.toLowerCase() === trimmedName.toLowerCase());
        if (isDuplicate) {
            alert(`A column named "${trimmedName}" already exists.`);
            return;
        }

        const newColumn: SheetColumn = {
            id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: trimmedName,
        };
        setColumns(current => [...current, newColumn]);
        setNewColumnName('');
    };

    const handleSave = () => {
        // Filter out any columns with empty names before saving
        const validColumns = columns.filter(col => col.name.trim() !== '');
        onSave(validColumns);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-columns-title"
        >
            <div 
                className="bg-card/80 dark:bg-card/70 backdrop-blur-lg rounded-2xl border border-border shadow-soft-xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex-shrink-0">
                    <h3 id="manage-columns-title" className="text-xl font-bold text-foreground">
                        Customize Sheet Columns
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        For: {subjectName}
                    </p>
                </header>

                <main className="flex-grow my-4 space-y-4 overflow-y-auto thin-scrollbar pr-2 -mr-4">
                    <p className="text-xs text-muted-foreground italic">Changes made here will apply to this subject for this student only.</p>
                    
                    {columns.map((col, index) => (
                        <div key={col.id} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={col.name}
                                onChange={(e) => handleColumnNameChange(col.id, e.target.value)}
                                placeholder={`Column ${index + 1} Name`}
                                className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                            />
                            <button 
                                onClick={() => handleDeleteColumn(col.id)}
                                className="p-2 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10"
                                aria-label={`Delete column ${col.name}`}
                            >
                                <DeleteIcon className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                    {columns.length === 0 && (
                        <p className="text-center py-8 text-muted-foreground">No columns defined. Add one below to get started.</p>
                    )}
                </main>
                
                <form onSubmit={handleAddNewColumn} className="flex-shrink-0 pt-4 border-t border-border space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">Add New Column</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newColumnName}
                            onChange={(e) => setNewColumnName(e.target.value)}
                            placeholder="New column name..."
                            className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                        />
                        <button 
                            type="submit"
                            className="h-10 px-4 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 flex-shrink-0"
                            aria-label="Add new column"
                        >
                            <PlusIcon className="h-5 w-5" />
                        </button>
                    </div>
                </form>

                <footer className="mt-6 flex-shrink-0 flex justify-end space-x-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSave}
                        className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-colors"
                    >
                        Save Changes
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ManageSheetColumnsModal;