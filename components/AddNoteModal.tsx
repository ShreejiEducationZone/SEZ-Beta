import React, { useState } from 'react';
import { SyllabusNode } from '../types';

interface AddNoteModalProps {
    node: SyllabusNode & { level: number };
    onClose: () => void;
    onSave: (note: string) => void;
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({ node, onClose, onSave }) => {
    const [note, setNote] = useState('');

    const handleSave = () => {
        if (note.trim()) {
            onSave(note.trim());
        } else {
            alert("Note cannot be empty.");
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-note-title"
        >
            <div 
                className="bg-card/80 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl p-6 w-full max-w-lg"
                onClick={e => e.stopPropagation()}
            >
                <div>
                    <h3 id="add-note-title" className="text-xl font-bold text-foreground">
                        Add Note
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        For: {node.no}. {node.name}
                    </p>
                </div>
                
                <div className="mt-4">
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Type your note here..."
                        rows={5}
                        className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50"
                        autoFocus
                    />
                </div>

                <div className="mt-6 flex justify-end space-x-3">
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
                        Save Note
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddNoteModal;