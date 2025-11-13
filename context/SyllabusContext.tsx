import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { getCollection, setDocument, getDocument, runBatch } from '../firebase';
import { SubjectData, SyllabusProgress, ProgressEntry, SheetColumn, AreaDefinition } from '../types';
import { useData } from './DataContext';

interface SyllabusContextType {
    allStudentSubjects: { [key: string]: { studentId: string; subjects: SubjectData[] } };
    syllabusProgress: SyllabusProgress[];
    isLoading: boolean;
    handleSaveSubjects: (studentId: string, subjects: SubjectData[]) => Promise<void>;
    handleUpdateSyllabusNode: (studentId: string, subject: string, nodeNo: string | number, updates: { isCompleted?: boolean; notesToAdd?: ProgressEntry[]; noteIndicesToDelete?: number[] }) => Promise<void>;
    handleBatchUpdateSyllabusProgress: (changes: Map<string, boolean>) => Promise<void>;
    subjectAreas: { [key: string]: AreaDefinition[] };
    handleSaveSubjectAreas: (areas: { [key: string]: AreaDefinition[] }) => Promise<void>;
}

const SyllabusContext = createContext<SyllabusContextType | undefined>(undefined);

const DEFAULT_SHEET_COLUMNS: SheetColumn[] = [
    { id: 'reading', name: 'Reading' },
    { id: 'videos', name: 'Videos' },
    { id: 'notes', name: 'Notes' },
    { id: 'exercise', name: 'Exercise' },
    { id: 'test', name: 'Test' },
];

export const SyllabusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [allStudentSubjects, setAllStudentSubjects] = useState<{ [key: string]: { studentId: string; subjects: SubjectData[] } }>({});
    const [syllabusProgress, setSyllabusProgress] = useState<SyllabusProgress[]>([]);
    const [subjectAreas, setSubjectAreas] = useState<{ [key: string]: AreaDefinition[] }>({});
    const [isLoading, setIsLoading] = useState(false);
    
    const { currentUser, showToast } = useData();

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) {
                setAllStudentSubjects({});
                setSyllabusProgress([]);
                setSubjectAreas({});
                return;
            }
            setIsLoading(true);
            try {
                const [subjectsData, syllabusProgressData, subjectAreasDoc] = await Promise.all([
                    getCollection("studentSubjects"),
                    getCollection("syllabusProgress"),
                    getDocument("configuration", "subjectAreas"),
                ]);
                
                const studentId = currentUser.studentId;
                const isAdmin = currentUser.role === 'admin';

                const subjectsMap = (subjectsData as any[]).reduce((acc, doc) => {
                    if (isAdmin || doc.id === studentId) {
                        acc[doc.id] = { studentId: doc.id, subjects: doc.subjects || [] };
                    }
                    return acc;
                }, {});
                setAllStudentSubjects(subjectsMap);

                setSyllabusProgress(isAdmin ? syllabusProgressData as SyllabusProgress[] : (syllabusProgressData as SyllabusProgress[]).filter(p => p.studentId === studentId));
                
                if (subjectAreasDoc && (subjectAreasDoc as any).areas) {
                    setSubjectAreas((subjectAreasDoc as any).areas);
                } else {
                    setSubjectAreas({});
                }

            } catch (error) {
                console.error("Failed to fetch syllabus data:", error);
                showToast("Could not load syllabus data.", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [currentUser, showToast]);
    
    const handleSaveSubjects = useCallback(async (studentId: string, subjects: SubjectData[]) => {
        try {
            await setDocument("studentSubjects", studentId, { studentId, subjects });
            setAllStudentSubjects(prev => ({ ...prev, [studentId]: { studentId, subjects } }));
            showToast('Subjects saved successfully!', 'success');
        } catch (error: any) {
            console.error("Error saving subjects:", error);
            showToast(`Failed to save subjects: ${error.message}`, 'error');
            throw error;
        }
    }, [showToast]);

    const handleUpdateSyllabusNode = useCallback(async (studentId: string, subject: string, nodeNo: string | number, updates: { isCompleted?: boolean; notesToAdd?: ProgressEntry[]; noteIndicesToDelete?: number[] }) => {
        const progressId = `${studentId}-${subject}-${nodeNo}`;
        const existingProgress = syllabusProgress.find(p => p.id === progressId);
        let updatedProgress: SyllabusProgress;

        if (existingProgress) {
            updatedProgress = JSON.parse(JSON.stringify(existingProgress));
        } else {
            updatedProgress = { id: progressId, studentId, subject, nodeNo, isCompleted: false, entries: [] };
        }

        if (updates.isCompleted !== undefined) updatedProgress.isCompleted = updates.isCompleted;
        
        let currentEntries = updatedProgress.entries || [];
        if (updates.noteIndicesToDelete?.length) {
            currentEntries = currentEntries.filter((_, index) => !updates.noteIndicesToDelete!.includes(index));
        }
        if (updates.notesToAdd?.length) currentEntries.push(...updates.notesToAdd);
        updatedProgress.entries = currentEntries;

        try {
            await setDocument("syllabusProgress", updatedProgress.id, updatedProgress);
            setSyllabusProgress(prev => {
                const exists = prev.some(p => p.id === updatedProgress.id);
                if (exists) return prev.map(p => (p.id === updatedProgress.id ? updatedProgress : p));
                return [...prev, updatedProgress];
            });
        } catch (error: any) {
            showToast(`Failed to save progress: ${error.message}`, 'error');
            throw error;
        }
    }, [syllabusProgress, showToast]);

    const handleBatchUpdateSyllabusProgress = useCallback(async (changes: Map<string, boolean>) => {
        if (changes.size === 0) return;

        const writes: { type: 'set', path: string, data: SyllabusProgress }[] = [];
        const updatedItems: SyllabusProgress[] = [];

        for (const [progressId, isCompleted] of changes.entries()) {
            const [studentId, subject, nodeNo] = progressId.split('-');
            const existing = syllabusProgress.find(p => p.id === progressId);
            const updatedItem: SyllabusProgress = {
                ...(existing || { id: progressId, studentId, subject, nodeNo, entries: [] }),
                isCompleted,
            };
            
            writes.push({ type: 'set', path: `syllabusProgress/${progressId}`, data: updatedItem });
            updatedItems.push(updatedItem);
        }

        try {
            await runBatch(writes);
            setSyllabusProgress(prev => {
                const updatedMap = new Map(updatedItems.map(item => [item.id, item]));
                const newItems = updatedItems.filter(item => !prev.some(p => p.id === item.id));
                let newPrev = prev.map(item => updatedMap.get(item.id) || item);
                return [...newPrev, ...newItems];
            });
            showToast(`${writes.length} item(s) updated.`, 'success');
        } catch (error: any) {
            showToast(`Error saving changes: ${error.message}`, 'error');
            throw error;
        }
    }, [syllabusProgress, showToast]);

    const handleSaveSubjectAreas = useCallback(async (areas: { [key: string]: AreaDefinition[] }) => {
        try {
            await setDocument("configuration", "subjectAreas", { areas });
            setSubjectAreas(areas);
            showToast('Subject areas saved.', 'success');
        } catch (error: any) {
            showToast(`Failed to save areas: ${error.message}`, 'error');
            throw error;
        }
    }, [showToast]);

    const value = { 
        allStudentSubjects, 
        syllabusProgress, 
        isLoading, 
        handleSaveSubjects, 
        handleUpdateSyllabusNode, 
        handleBatchUpdateSyllabusProgress,
        subjectAreas,
        handleSaveSubjectAreas
    };

    return <SyllabusContext.Provider value={value as SyllabusContextType}>{children}</SyllabusContext.Provider>;
};

export const useSyllabus = () => {
    const context = useContext(SyllabusContext);
    if (context === undefined) {
        throw new Error('useSyllabus must be used within a SyllabusProvider');
    }
    return context;
};