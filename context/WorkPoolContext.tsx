import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { getCollection, setDocument, deleteDocument, runBatch } from '../firebase';
import { WorkItem, Doubt, Test, Student } from '../types';
import { useData } from './DataContext';
import { useSheet } from './SheetContext';
import { useSyllabus } from './SyllabusContext';
import WorkForm from '../components/WorkForm';
import TestForm from '../components/TestForm';
import DoubtForm from '../components/DoubtForm';

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
    openWorkForm: (student: Student, workItem?: Partial<WorkItem>) => void;
    openTestForm: (student: Student, test?: Partial<Test>) => void;
    openDoubtForm: (student: Student, doubt?: Partial<Doubt>) => void;
}

const WorkPoolContext = createContext<WorkPoolContextType | undefined>(undefined);

export const WorkPoolProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [workItems, setWorkItems] = useState<WorkItem[]>([]);
    const [doubts, setDoubts] = useState<Doubt[]>([]);
    const [tests, setTests] = useState<Test[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [workFormData, setWorkFormData] = useState<{ student: Student, workItem?: Partial<WorkItem> } | null>(null);
    const [testFormData, setTestFormData] = useState<{ student: Student, test?: Partial<Test> } | null>(null);
    const [doubtFormData, setDoubtFormData] = useState<{ student: Student, doubt?: Partial<Doubt> } | null>(null);


    const { currentUser, showToast, allMistakeTypes } = useData();
    const { handleSaveSheetProgress } = useSheet();
    const { allStudentSubjects, subjectAreas } = useSyllabus();

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
        const isNewItem = !previousWorkItem;
        const isCompletingSheetTask = workItem.status === 'Completed' && previousWorkItem?.status !== 'Completed' && workItem.source === 'sheets' && workItem.sheetTaskIds?.length;
        
        const isNewDoubtTask = isNewItem && workItem.source === 'doubt' && workItem.linkedDoubtId;
        const doubtToUpdate = isNewDoubtTask ? doubts.find(d => d.id === workItem.linkedDoubtId && d.status === 'Open') : null;

        try {
            if (doubtToUpdate) {
                const updatedDoubt = { ...doubtToUpdate, status: 'Tasked' as const };
                await runBatch([
                    { type: 'set', path: `workItems/${workItem.id}`, data: workItem },
                    { type: 'set', path: `doubts/${updatedDoubt.id}`, data: updatedDoubt }
                ]);
                setWorkItems(prev => [...prev.filter(w => w.id !== workItem.id), workItem]);
                setDoubts(prev => prev.map(d => d.id === updatedDoubt.id ? updatedDoubt : d));
            } else {
                await setDocument("workItems", workItem.id, workItem);
                setWorkItems(prev => {
                    const exists = prev.some(w => w.id === workItem.id);
                    if (exists) return prev.map(w => w.id === workItem.id ? workItem : w);
                    return [...prev, workItem];
                });
            }

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
    }, [workItems, doubts, showToast, handleSaveSheetProgress, setDoubts]);


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

    // --- Global Form Handlers ---
    const openWorkForm = (student: Student, workItem?: Partial<WorkItem>) => setWorkFormData({ student, workItem });
    const closeWorkForm = () => setWorkFormData(null);
    const openTestForm = (student: Student, test?: Partial<Test>) => setTestFormData({ student, test });
    const closeTestForm = () => setTestFormData(null);
    const openDoubtForm = (student: Student, doubt?: Partial<Doubt>) => setDoubtFormData({ student, doubt });
    const closeDoubtForm = () => setDoubtFormData(null);


    const value: WorkPoolContextType = {
        workItems, setWorkItems, doubts, tests, isLoading,
        handleSaveWorkItem, handleDeleteWorkItem,
        handleSaveDoubt, handleDeleteDoubt,
        handleSaveTest, handleDeleteTest,
        openWorkForm, openTestForm, openDoubtForm
    };

    return (
        <WorkPoolContext.Provider value={value}>
            {children}
            {workFormData && (
                <WorkForm
                    student={workFormData.student}
                    subjects={allStudentSubjects[workFormData.student.id]?.subjects || []}
                    workItem={workFormData.workItem}
                    workItems={workItems}
                    onSave={handleSaveWorkItem}
                    onCancel={closeWorkForm}
                />
            )}
            {testFormData && (
                <TestForm
                    student={testFormData.student}
                    studentSubjects={allStudentSubjects[testFormData.student.id]?.subjects || []}
                    test={testFormData.test as Test | null}
                    onSave={handleSaveTest}
                    onCancel={closeTestForm}
                    allMistakeTypes={allMistakeTypes}
                    subjectAreas={subjectAreas}
                />
            )}
            {doubtFormData && (
                <DoubtForm
                    student={doubtFormData.student}
                    subjects={allStudentSubjects[doubtFormData.student.id]?.subjects || []}
                    workItems={workItems.filter(w => w.studentId === doubtFormData.student.id)}
                    doubt={doubtFormData.doubt as Doubt | undefined}
                    onSave={handleSaveDoubt}
                    onCancel={closeDoubtForm}
                />
            )}
        </WorkPoolContext.Provider>
    );
};

export const useWorkPool = () => {
    const context = useContext(WorkPoolContext);
    if (context === undefined) {
        throw new Error('useWorkPool must be used within a WorkPoolProvider');
    }
    return context;
};