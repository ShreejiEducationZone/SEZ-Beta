
import React, { useState, useMemo, useEffect } from 'react';
import { SubjectData } from '../../types';
import SelectField from '../form/SelectField';
import DeleteIcon from '../icons/DeleteIcon';

interface AreaSettingsProps {
    subjectAreas: { [key: string]: string[] };
    onSaveSubjectAreas: (areas: { [key: string]: string[] }) => void;
    allStudentSubjects: { [key: string]: { studentId: string; subjects: SubjectData[] } };
}

const AreaSettings: React.FC<AreaSettingsProps> = ({ subjectAreas, onSaveSubjectAreas, allStudentSubjects }) => {
    const [areas, setAreas] = useState(subjectAreas);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [newArea, setNewArea] = useState('');

    const allSubjects = useMemo(() => {
        const subjectsSet = new Set<string>();
        Object.values(allStudentSubjects).forEach(data => {
            if (data && data.subjects) {
              data.subjects.forEach(s => subjectsSet.add(s.subject));
            }
        });
        return Array.from(subjectsSet).sort();
    }, [allStudentSubjects]);

    useEffect(() => {
        if(allSubjects.length > 0 && !selectedSubject) {
            setSelectedSubject(allSubjects[0]);
        }
    }, [allSubjects, selectedSubject]);

    const handleAddArea = () => {
        if (!selectedSubject || !newArea.trim()) {
            alert("Please select a subject and enter an area name.");
            return;
        }
        const currentAreas = areas[selectedSubject] || [];
        if (currentAreas.map(a => a.toLowerCase()).includes(newArea.trim().toLowerCase())) {
            alert("This area already exists for the selected subject.");
            return;
        }
        const updatedAreas = {
            ...areas,
            [selectedSubject]: [...currentAreas, newArea.trim()].sort()
        };
        setAreas(updatedAreas);
        setNewArea('');
    };

    const handleDeleteArea = (areaToDelete: string) => {
        const updatedSubjectAreas = (areas[selectedSubject] || []).filter(a => a !== areaToDelete);
        const updatedAreas = { ...areas };
        if (updatedSubjectAreas.length > 0) {
            updatedAreas[selectedSubject] = updatedSubjectAreas;
        } else {
            delete updatedAreas[selectedSubject];
        }
        setAreas(updatedAreas);
    };

    const handleSave = () => {
        onSaveSubjectAreas(areas);
        alert('Subject areas saved successfully.');
    };

    const handleReset = () => {
        setAreas(subjectAreas);
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Manage Subject Areas</h2>
            <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-sm p-6 space-y-6">
                <div>
                    <SelectField 
                        label="Select Subject to Manage" 
                        name="subject" 
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        options={allSubjects}
                    />
                </div>
                {selectedSubject ? (
                    <>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Areas for {selectedSubject}</h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto thin-scrollbar pr-2">
                                {(areas[selectedSubject] || []).map(area => (
                                    <div key={area} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700/50 p-3 rounded-md">
                                        <p className="font-medium">{area}</p>
                                        <button onClick={() => handleDeleteArea(area)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full">
                                            <DeleteIcon />
                                        </button>
                                    </div>
                                ))}
                                {(areas[selectedSubject] || []).length === 0 && <p className="text-sm text-gray-500 italic">No areas defined for this subject yet.</p>}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                             <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Add New Area to {selectedSubject}</h3>
                             <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newArea}
                                    onChange={(e) => setNewArea(e.target.value)}
                                    placeholder="e.g. Calculation, Grammar"
                                    className="flex-grow h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
                                />
                                <button onClick={handleAddArea} className="h-10 px-4 rounded-md bg-brand-blue/80 text-white hover:bg-brand-blue text-sm font-semibold">Add</button>
                             </div>
                        </div>
                    </>
                ) : (
                    <p className="text-center text-gray-500">No subjects defined. Please add subjects in the 'Subject Manager' page first.</p>
                )}
                 <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={handleReset} className="py-2 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 font-semibold">Reset</button>
                    <button onClick={handleSave} className="h-10 px-4 rounded-md bg-brand-blue text-white hover:bg-blue-600 text-sm font-semibold">Save Changes</button>
                </div>
            </div>
        </div>
    );
};
export default AreaSettings;
