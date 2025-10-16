import React, { useState, useMemo, useEffect } from 'react';
import { SubjectData, AreaDefinition } from '../../types';
import DeleteIcon from '../icons/DeleteIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import isEqual from 'lodash.isequal';

interface AreaSettingsProps {
    subjectAreas: { [key: string]: AreaDefinition[] };
    onSaveSubjectAreas: (areas: { [key: string]: AreaDefinition[] }) => void;
    allStudentSubjects: { [key: string]: { studentId: string; subjects: SubjectData[] } };
}

const AreaSettings: React.FC<AreaSettingsProps> = ({ subjectAreas, onSaveSubjectAreas, allStudentSubjects }) => {
    const [localAreas, setLocalAreas] = useState(subjectAreas);
    const [activeSubject, setActiveSubject] = useState<string | null>(null);
    const [newAreaForms, setNewAreaForms] = useState<Record<string, { title: string; description: string }>>({});

    useEffect(() => {
        setLocalAreas(subjectAreas);
    }, [subjectAreas]);

    const allSubjects = useMemo(() => {
        const subjectsSet = new Set<string>();
        // FIX: Explicitly type the 'data' parameter to resolve TypeScript inference issue.
        Object.values(allStudentSubjects).forEach((data: { subjects: SubjectData[] }) => {
            if (data && data.subjects) {
              data.subjects.forEach(s => subjectsSet.add(s.subject));
            }
        });
        const sortedSubjects = Array.from(subjectsSet).sort();
        return sortedSubjects;
    }, [allStudentSubjects]);
    
    useEffect(() => {
        if (allSubjects.length > 0 && !activeSubject) {
            setActiveSubject(allSubjects[0]);
        }
    }, [allSubjects, activeSubject]);

    const isDirty = useMemo(() => !isEqual(subjectAreas, localAreas), [subjectAreas, localAreas]);
    
    const handleFormChange = (subject: string, field: 'title' | 'description', value: string) => {
        setNewAreaForms(prev => ({
            ...prev,
            [subject]: { ...(prev[subject] || { title: '', description: '' }), [field]: value }
        }));
    };

    const handleAddArea = (subject: string) => {
        const newArea = newAreaForms[subject];
        if (!newArea || !newArea.title.trim() || !newArea.description.trim()) {
            alert("Please provide both an area title and description.");
            return;
        }

        const currentAreas = localAreas[subject] || [];
        if (currentAreas.some(a => a.title.toLowerCase() === newArea.title.trim().toLowerCase())) {
            alert("This area title already exists for this subject.");
            return;
        }

        const updatedAreas = {
            ...localAreas,
            [subject]: [...currentAreas, { title: newArea.title.trim(), description: newArea.description.trim() }].sort((a, b) => a.title.localeCompare(b.title))
        };
        setLocalAreas(updatedAreas);
        
        // Reset form for that subject
        setNewAreaForms(prev => ({
            ...prev,
            [subject]: { title: '', description: '' }
        }));
    };

    const handleDeleteArea = (subject: string, titleToDelete: string) => {
        const updatedSubjectAreas = (localAreas[subject] || []).filter(a => a.title !== titleToDelete);
        const updatedAreas = { ...localAreas };
        if (updatedSubjectAreas.length > 0) {
            updatedAreas[subject] = updatedSubjectAreas;
        } else {
            delete updatedAreas[subject];
        }
        setLocalAreas(updatedAreas);
    };

    const handleSave = () => onSaveSubjectAreas(localAreas);
    const handleReset = () => setLocalAreas(subjectAreas);

    return (
        <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-8">Manage Subject Areas</h2>

            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                {allSubjects.length > 0 ? allSubjects.map(subject => {
                    const areasForSubject = localAreas[subject] || [];
                    const isExpanded = activeSubject === subject;
                    const newAreaData = newAreaForms[subject] || { title: '', description: '' };

                    return (
                        <div key={subject}>
                            <button
                                onClick={() => setActiveSubject(isExpanded ? null : subject)}
                                className="w-full flex justify-between items-center p-4 text-left hover:bg-muted"
                                aria-expanded={isExpanded}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold text-foreground">{subject}</span>
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-border text-muted-foreground">{areasForSubject.length} areas</span>
                                </div>
                                <ChevronDownIcon className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {isExpanded && (
                                <div className="p-4 space-y-4 bg-muted/30">
                                    {areasForSubject.length > 0 && (
                                        <div className="space-y-2 max-h-60 overflow-y-auto thin-scrollbar pr-2">
                                            {areasForSubject.map(area => (
                                                <div key={area.title} className="group flex justify-between items-start bg-background p-3 rounded-md border border-border">
                                                    <div>
                                                        <p className="font-semibold text-sm text-foreground">{area.title}</p>
                                                        <p className="text-sm text-muted-foreground">{area.description}</p>
                                                    </div>
                                                    <button onClick={() => handleDeleteArea(subject, area.title)} className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-full flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <DeleteIcon />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="pt-4 border-t border-border">
                                        <h3 className="text-sm font-semibold text-foreground mb-2">Add New Area to {subject}</h3>
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={newAreaData.title}
                                                onChange={(e) => handleFormChange(subject, 'title', e.target.value)}
                                                placeholder="New Area Title (e.g., Algebra)"
                                                className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                                            />
                                            <textarea
                                                value={newAreaData.description}
                                                onChange={(e) => handleFormChange(subject, 'description', e.target.value)}
                                                placeholder="Description for this area..."
                                                rows={2}
                                                className="w-full p-3 rounded-lg border border-border bg-background"
                                            />
                                            <button onClick={() => handleAddArea(subject)} className="w-full h-10 px-4 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20">Add Area</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }) : (
                    <p className="text-center text-muted-foreground p-8">No subjects found. Add subjects via the 'Subject Manager' page first.</p>
                )}
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
export default AreaSettings;