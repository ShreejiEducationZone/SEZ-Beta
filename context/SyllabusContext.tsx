import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
// FIX: Import getDocument to fetch subjectAreas configuration.
import { getCollection, setDocument, getDocument } from '../firebase';
// FIX: Import AreaDefinition type.
import { SubjectData, SyllabusProgress, ProgressEntry, SheetColumn, AreaDefinition } from '../types';
import { useData } from './DataContext';

interface SyllabusContextType {
    allStudentSubjects: { [key: string]: { studentId: string; subjects: SubjectData[] } };
    syllabusProgress: SyllabusProgress[];
    // FIX: Add subjectAreas to the context type.
    subjectAreas: { [key: string]: AreaDefinition[] };
    isLoading: boolean;
    handleSaveSubjects: (studentId: string, subjects: SubjectData[]) => Promise<void>;
    handleUpdateSyllabusNode: (studentId: string, subject: string, nodeNo: string | number, updates: { isCompleted?: boolean; notesToAdd?: ProgressEntry[]; noteIndicesToDelete?: number[] }) => Promise<void>;
    // FIX: Add handleSaveSubjectAreas to the context type.
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
    // FIX: Add state for subjectAreas.
    const [subjectAreas, setSubjectAreas] = useState<{ [key: string]: AreaDefinition[] }>({});
    const [isLoading, setIsLoading] = useState(false);
    
    const { currentUser, showToast } = useData();

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) {
                setAllStudentSubjects({});
                setSyllabusProgress([]);
                // FIX: Reset subjectAreas on logout.
                setSubjectAreas({});
                return;
            }
            setIsLoading(true);
            try {
                // FIX: Fetch subjectAreas configuration along with other syllabus data.
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
                
                // FIX: Set subjectAreas state from fetched data.
                if (subjectAreasDoc && (subjectAreasDoc as any).areasBySubject) {
                    setSubjectAreas((subjectAreasDoc as any).areasBySubject);
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

    // FIX: Add handler function for saving subject areas.
    const handleSaveSubjectAreas = useCallback(async (areas: { [key: string]: AreaDefinition[] }) => {
        try {
            await setDocument("configuration", "subjectAreas", { areasBySubject: areas });
            setSubjectAreas(areas);
            showToast('Subject areas saved.', 'success');
        } catch (error: any) {
            showToast(`Failed to save subject areas: ${error.message}`, 'error');
            throw error;
        }
    }, [showToast]);

    const value = { allStudentSubjects, syllabusProgress, isLoading, handleSaveSubjects, handleUpdateSyllabusNode, subjectAreas, handleSaveSubjectAreas };

    return <SyllabusContext.Provider value={value}>{children}</SyllabusContext.Provider>;
};

export const useSyllabus = () => {
    const context = useContext(SyllabusContext);
    if (context === undefined) {
        throw new Error('useSyllabus must be used within a SyllabusProvider');
    }
    return context;
};