import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { getCollection, runBatch } from '../firebase';
import { SheetProgress } from '../types';
import { useData } from './DataContext';

interface SheetContextType {
    sheetProgress: SheetProgress[];
    setSheetProgress: React.Dispatch<React.SetStateAction<SheetProgress[]>>;
    isLoading: boolean;
    handleSaveSheetProgress: (changes: Map<string, Record<string, boolean>>) => Promise<void>;
}

const SheetContext = createContext<SheetContextType | undefined>(undefined);

export const SheetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [sheetProgress, setSheetProgress] = useState<SheetProgress[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const { currentUser, showToast } = useData();

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) {
                setSheetProgress([]);
                return;
            }
            setIsLoading(true);
            try {
                const data = await getCollection("sheetProgress");
                const studentId = currentUser.studentId;
                const isAdmin = currentUser.role === 'admin';
                setSheetProgress(isAdmin ? data as SheetProgress[] : (data as SheetProgress[]).filter(p => p.studentId === studentId));
            } catch (error) {
                showToast("Could not load sheet progress.", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [currentUser, showToast]);

    const handleSaveSheetProgress = useCallback(async (changes: Map<string, Record<string, boolean>>) => {
        if (changes.size === 0) {
            showToast("No changes to save.", "info");
            return;
        }
    
        const writes: { type: 'set', path: string, data: any }[] = [];
        const updatedProgressItems: SheetProgress[] = [];
    
        changes.forEach((tasks, progressId) => {
            const [studentId, subject, chapterNo] = progressId.split('__');
            const existingProgress = sheetProgress.find(p => p.id === progressId);
            const existingTasks = existingProgress?.tasks || {};
            const newTasks = { ...existingTasks, ...tasks };
            const newProgressItem: SheetProgress = { id: progressId, studentId, subject, chapterNo, tasks: newTasks };
            writes.push({ type: 'set', path: `sheetProgress/${progressId}`, data: newProgressItem });
            updatedProgressItems.push(newProgressItem);
        });
    
        try {
            await runBatch(writes);
            setSheetProgress(prev => {
                const newProgressMap = new Map(updatedProgressItems.map(p => [p.id, p]));
                const otherProgress = prev.filter(p => !newProgressMap.has(p.id));
                return [...otherProgress, ...updatedProgressItems];
            });
            showToast(`Progress for ${changes.size} item(s) saved!`, 'success');
        } catch (error: any) {
            console.error("Error saving sheet progress:", error);
            showToast(`Failed to save progress: ${error.message}`, 'error');
            throw error;
        }
    }, [showToast, sheetProgress]);

    const value = { sheetProgress, setSheetProgress, isLoading, handleSaveSheetProgress };

    return <SheetContext.Provider value={value}>{children}</SheetContext.Provider>;
};

export const useSheet = () => {
    const context = useContext(SheetContext);
    if (context === undefined) {
        throw new Error('useSheet must be used within a SheetProvider');
    }
    return context;
};
