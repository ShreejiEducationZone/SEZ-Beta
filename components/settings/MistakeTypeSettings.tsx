import React, { useState, useMemo, useEffect } from 'react';
import { MistakeTypeDefinition } from '../../types';
import { MISTAKE_TYPES } from '../../constants';
import DeleteIcon from '../icons/DeleteIcon';
import PlusIcon from '../icons/PlusIcon';
import isEqual from 'lodash.isequal';

interface MistakeTypeSettingsProps {
    customMistakeTypes: MistakeTypeDefinition[];
    onSaveMistakeTypes: (types: MistakeTypeDefinition[]) => void;
}

const MistakeTypeSettings: React.FC<MistakeTypeSettingsProps> = ({ customMistakeTypes, onSaveMistakeTypes }) => {
    const [localTypes, setLocalTypes] = useState(customMistakeTypes);
    const [newType, setNewType] = useState({ title: '', description: '' });
    const [isAdding, setIsAdding] = useState(false);
    
    useEffect(() => {
        setLocalTypes(customMistakeTypes);
    }, [customMistakeTypes]);

    const isDirty = useMemo(() => !isEqual(customMistakeTypes, localTypes), [customMistakeTypes, localTypes]);

    const allTypes = useMemo(() => {
        const defaultTypesWithFlag = MISTAKE_TYPES.map(t => ({ ...t, isDefault: true }));
        const customTypesWithFlag = localTypes.map(t => ({ ...t, isDefault: false }));
        return [...defaultTypesWithFlag, ...customTypesWithFlag];
    }, [localTypes]);

    const handleAdd = () => {
        const title = newType.title.trim();
        const description = newType.description.trim();
        if (title && description && !allTypes.some(t => t.title.toLowerCase() === title.toLowerCase())) {
            setLocalTypes(prev => [...prev, { title, description }]);
            setNewType({ title: '', description: '' });
            setIsAdding(false);
        } else {
            alert("Mistake type title must be unique and non-empty, and a description must be provided.");
        }
    };

    const handleDelete = (titleToDelete: string) => {
        setLocalTypes(localTypes.filter(t => t.title !== titleToDelete));
    };

    const handleSave = () => {
        onSaveMistakeTypes(localTypes);
    };
    
    const handleReset = () => {
        setLocalTypes(customMistakeTypes);
    }

    return (
        <div className="max-w-3xl">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">Manage Mistake Types</h2>
                {!isAdding && (
                     <button 
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20"
                    >
                        <PlusIcon className="h-4 w-4" /> Add
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="p-4 border border-border rounded-xl bg-primary/5 mb-6">
                    <h3 className="font-semibold text-foreground mb-2">New Custom Type</h3>
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={newType.title}
                            onChange={(e) => setNewType(prev => ({...prev, title: e.target.value}))}
                            placeholder="Mistake Title (e.g., Reading Error)"
                            className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                            autoFocus
                        />
                        <textarea
                            value={newType.description}
                            onChange={(e) => setNewType(prev => ({...prev, description: e.target.value}))}
                            placeholder="Description..."
                            rows={2}
                            className="w-full p-3 rounded-lg border border-border bg-background"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAdding(false)} className="h-9 px-4 rounded-lg bg-muted text-muted-foreground font-semibold hover:bg-border">Cancel</button>
                            <button onClick={handleAdd} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90">Add</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-border overflow-hidden">
                <div className="divide-y divide-border">
                    {allTypes.map(type => (
                        <div key={type.title} className="group flex justify-between items-start p-4 bg-muted/30 hover:bg-muted/60">
                            <div>
                                <p className="font-semibold text-sm text-foreground">{type.title}</p>
                                <p className="text-sm text-muted-foreground">{type.description}</p>
                            </div>
                            <div className="flex-shrink-0 ml-4">
                                {type.isDefault ? (
                                    <span className="text-xs font-semibold text-muted-foreground bg-border px-2 py-1 rounded-full">Default</span>
                                ) : (
                                    <button onClick={() => handleDelete(type.title)} className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DeleteIcon />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
             {isDirty && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
                    <div className="bg-card/80 backdrop-blur-xl border border-border rounded-full shadow-soft-lg p-2 flex items-center justify-between">
                        <p className="text-sm font-semibold pl-4 text-foreground">Unsaved changes</p>
                        <div className="flex gap-2">
                            <button onClick={handleReset} className="h-9 px-4 rounded-full text-sm font-semibold text-muted-foreground hover:bg-muted">Discard</button>
                            <button onClick={handleSave} className="h-9 px-4 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MistakeTypeSettings;