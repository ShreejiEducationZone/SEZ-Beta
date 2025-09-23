
import React, { useState } from 'react';
import { MistakeTypeDefinition } from '../../types';
import { MISTAKE_TYPES } from '../../constants';
import DeleteIcon from '../icons/DeleteIcon';

interface MistakeTypeSettingsProps {
    customMistakeTypes: MistakeTypeDefinition[];
    onSaveMistakeTypes: (types: MistakeTypeDefinition[]) => void;
}

const MistakeTypeSettings: React.FC<MistakeTypeSettingsProps> = ({ customMistakeTypes, onSaveMistakeTypes }) => {
    const [types, setTypes] = useState(customMistakeTypes);
    const [newType, setNewType] = useState({ title: '', description: '' });

    const handleAdd = () => {
        const title = newType.title.trim();
        const description = newType.description.trim();
        if (title && description && !types.some(t => t.title.toLowerCase() === title.toLowerCase()) && !MISTAKE_TYPES.some(t => t.title.toLowerCase() === title.toLowerCase())) {
            setTypes([...types, { title, description }]);
            setNewType({ title: '', description: '' });
        } else {
            alert("Mistake type title must be unique and non-empty, and a description must be provided.");
        }
    };

    const handleDelete = (titleToDelete: string) => {
        setTypes(types.filter(t => t.title !== titleToDelete));
    };

    const handleSave = () => {
        onSaveMistakeTypes(types);
        alert('Custom mistake types have been saved.');
    };
    
    const handleReset = () => {
        setTypes(customMistakeTypes);
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Manage Mistake Types</h2>
            
            <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-sm p-6 space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Default Types (Cannot be changed)</h3>
                    <div className="space-y-2">
                        {MISTAKE_TYPES.map(type => (
                            <div key={type.title} className="bg-gray-100 dark:bg-gray-700/50 p-3 rounded-md">
                                <p className="font-semibold">{type.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{type.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-4 mb-2">Your Custom Types</h3>
                    <div className="space-y-2">
                        {types.map(type => (
                            <div key={type.title} className="bg-gray-50 dark:bg-dark-bg p-3 rounded-md">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">{type.title}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{type.description}</p>
                                    </div>
                                    <button onClick={() => handleDelete(type.title)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full flex-shrink-0 ml-2"><DeleteIcon /></button>
                                </div>
                            </div>
                        ))}
                         {types.length === 0 && <p className="text-sm text-gray-500 italic">No custom types added yet.</p>}
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Add New Type</h3>
                    <input
                        type="text"
                        value={newType.title}
                        onChange={(e) => setNewType(prev => ({...prev, title: e.target.value}))}
                        placeholder="New Mistake Title"
                        className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
                    />
                    <textarea
                        value={newType.description}
                        onChange={(e) => setNewType(prev => ({...prev, description: e.target.value}))}
                        placeholder="Description..."
                        rows={2}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
                    />
                    <button onClick={handleAdd} className="w-full h-10 px-4 rounded-md bg-brand-blue/80 text-white hover:bg-brand-blue text-sm font-semibold">Add New Type</button>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={handleReset} className="py-2 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 font-semibold">Reset</button>
                    <button onClick={handleSave} className="h-10 px-4 rounded-md bg-brand-blue text-white hover:bg-blue-600 text-sm font-semibold">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default MistakeTypeSettings;
