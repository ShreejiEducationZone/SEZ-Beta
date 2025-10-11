import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { getCollection, setDocument, deleteDocument, runBatch } from '../firebase';
import { WorkItem, Doubt, Test } from '../types';
import { useData } from './DataContext';
import { useSheet } from './SheetContext';

interface WorkPoolContextType {
    workItems: WorkItem[];
    doubts: Doubt[];
    tests: Test[];
    setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
    isLoading: boolean;
    handleSaveWorkItem: (workItem: WorkItem, showToastNotification?: boolean) => Promise<void>;
    handleDeleteWorkItem: (workItemId: string) => Promise<void>;
    handleSaveDoubt: (doubt: Doubt) => Promise<void>;
    handleDeleteDoubt: (doubtId: string) => Promise<void>;
    handleSaveTest: (test: Test) => Promise<void>;
    handleDeleteTest: (testId: string) => Promise<void>;
}

const WorkPoolContext = createContext<WorkPoolContextType | undefined>(undefined);

export const WorkPoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [workItems, setWorkItems] = useState<WorkItem[]>([]);
    const [doubts, setDoubts] = useState<Doubt[]>([]);
    const [tests, setTests] = useState<Test[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const { currentUser, showToast } = useData();
    const { handleSaveSheetProgress } = useSheet();

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) {
                setWorkItems([]);
                setDoubts([]);
                setTests([]);
                return;
            }

            setIsLoading(true);
            try {
                const [workData, doubtsData, testsData] = await Promise.all([
                    getCollection("workItems"),
                    getCollection("doubts"),
                    getCollection("tests"),
                ]);
                
                const studentId = currentUser.studentId;
                const isAdmin = currentUser.role === 'admin';

                setWorkItems(isAdmin ? workData as WorkItem[] : (workData as WorkItem[]).filter(w => w.studentId === studentId));
                setDoubts(isAdmin ? doubtsData as Doubt[] : (doubtsData as Doubt[]).filter(d => d.studentId === studentId));
                setTests(isAdmin ? testsData as Test[] : (testsData as Test[]).filter(t => t.studentId === studentId));

            } catch (error) {
                console.error("Failed to fetch academic data:", error);
                showToast("Could not load academic data.", 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentUser, showToast]);
    
    // --- Work Item Handlers ---
    const handleSaveWorkItem = useCallback(async (workItem: WorkItem, showToastNotification = true) => {
        const previousWorkItem = workItems.find(w => w.id === workItem.id);
        const isCompletingSheetTask = workItem.status === 'Completed' && previousWorkItem?.status !== 'Completed' && workItem.source === 'sheets' && workItem.sheetTaskIds?.length;
        
        try {
            await setDocument("workItems", workItem.id, workItem);
            setWorkItems(prev => {
                const exists = prev.some(w => w.id === workItem.id);
                if (exists) return prev.map(w => w.id === workItem.id ? workItem : w);
                return [...prev, workItem];
            });

            if (isCompletingSheetTask) {
                const progressId = `${workItem.studentId}__${workItem.subject}__${workItem.chapterNo}`;
                const changes = new Map<string, Record<string, boolean>>();
                const taskUpdates: Record<string, boolean> = {};
                workItem.sheetTaskIds!.forEach(id => { taskUpdates[id] = true; });
                changes.set(progressId, taskUpdates);
                await handleSaveSheetProgress(changes);
            }

            if (showToastNotification) {
                showToast('Work item saved successfully!', 'success');
            }
        } catch (error: any) {
            console.error("Error saving work item:", error);
            showToast(`Failed to save work item: ${error.message}`, 'error');
            throw error;
        }
    }, [workItems, showToast, handleSaveSheetProgress]);

    const handleDeleteWorkItem = useCallback(async (workItemId: string) => {
        try {
            await deleteDocument("workItems", workItemId);
            setWorkItems(prev => prev.filter(w => w.id !== workItemId));
            showToast('Work item deleted.', 'success');
        } catch (error: any) {
            console.error("Error deleting work item:", error);
            showToast(`Failed to delete work item: ${error.message}`, 'error');
        }
    }, [showToast]);

    // --- Doubt Handlers ---
    const handleSaveDoubt = useCallback(async (doubt: Doubt) => {
        try {
            await setDocument("doubts", doubt.id, doubt);
            setDoubts(prev => {
                const exists = prev.some(d => d.id === doubt.id);
                if (exists) return prev.map(d => d.id === doubt.id ? doubt : d);
                return [...prev, doubt];
            });
            showToast('Doubt saved successfully!', 'success');
        } catch (error: any) {
            console.error("Error saving doubt:", error);
            showToast(`Failed to save doubt: ${error.message}`, 'error');
        }
    }, [showToast]);

    const handleDeleteDoubt = useCallback(async (doubtId: string) => {
        try {
            const writes: { type: 'delete', path: string }[] = [];
            const linkedWorkItem = workItems.find(item => item.linkedDoubtId === doubtId && item.source === 'doubt');
            if (linkedWorkItem) writes.push({ type: 'delete', path: `workItems/${linkedWorkItem.id}` });
            writes.push({ type: 'delete', path: `doubts/${doubtId}` });
            
            await runBatch(writes);
            
            setDoubts(prev => prev.filter(d => d.id !== doubtId));
            if (linkedWorkItem) {
                setWorkItems(prev => prev.filter(w => w.id !== linkedWorkItem.id));
            }
            showToast('Doubt deleted successfully.', 'success');
        } catch (error: any) {
            console.error("Error deleting doubt:", error);
            showToast(`Failed to delete doubt: ${error.message}`, 'error');
        }
    }, [workItems, setWorkItems, showToast]);
    
    // --- Test Handlers ---
    const handleSaveTest = useCallback(async (test: Test) => {
        try {
            await setDocument("tests", test.id, test);
            setTests(prev => {
                const exists = prev.some(t => t.id === test.id);
                if (exists) return prev.map(t => t.id === test.id ? test : t);
                return [...prev, test];
            });
            showToast('Test record saved.', 'success');
        } catch (error: any) {
            console.error("Error saving test:", error);
            showToast(`Failed to save test: ${error.message}`, 'error');
        }
    }, [showToast]);

    const handleDeleteTest = useCallback(async (testId: string) => {
        try {
            await deleteDocument("tests", testId);
            setTests(prev => prev.filter(t => t.id !== testId));
            showToast('Test record deleted.', 'success');
        } catch (error: any) {
            console.error("Error deleting test:", error);
            showToast(`Failed to delete test: ${error.message}`, 'error');
        }
    }, [showToast]);

    const value: WorkPoolContextType = {
        workItems, setWorkItems, doubts, tests, isLoading,
        handleSaveWorkItem, handleDeleteWorkItem,
        handleSaveDoubt, handleDeleteDoubt,
        handleSaveTest, handleDeleteTest
    };

    return <WorkPoolContext.Provider value={value}>{children}</WorkPoolContext.Provider>;
};

export const useWorkPool = () => {
    const context = useContext(WorkPoolContext);
    if (context === undefined) {
        throw new Error('useWorkPool must be used within a WorkPoolProvider');
    }
    return context;
};