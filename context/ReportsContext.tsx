import React, { createContext, useContext, ReactNode } from 'react';
import { Test } from '../types';
import { useWorkPool } from './WorkPoolContext';

interface ReportsContextType {
    tests: Test[];
    isLoading: boolean;
    handleSaveTest: (test: Test) => Promise<void>;
    handleDeleteTest: (testId: string) => Promise<void>;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

// This provider is now a pass-through. The actual logic lives in WorkPoolProvider.
export const ReportsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    return <>{children}</>;
};

// This hook now selects data from the consolidated Academic/WorkPool context.
export const useReports = (): ReportsContextType => {
    const { tests, isLoading, handleSaveTest, handleDeleteTest } = useWorkPool();
    return { tests, isLoading, handleSaveTest, handleDeleteTest };
};