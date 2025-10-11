import React, { createContext, useContext, ReactNode } from 'react';
import { Doubt } from '../types';
import { useWorkPool } from './WorkPoolContext';

interface DoubtBoxContextType {
    doubts: Doubt[];
    isLoading: boolean;
    handleSaveDoubt: (doubt: Doubt) => Promise<void>;
    handleDeleteDoubt: (doubtId: string) => Promise<void>;
}

const DoubtBoxContext = createContext<DoubtBoxContextType | undefined>(undefined);

// This provider is now a pass-through. The actual logic lives in WorkPoolProvider.
export const DoubtBoxProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    return <>{children}</>;
};

// This hook now selects data from the consolidated Academic/WorkPool context.
export const useDoubtBox = (): DoubtBoxContextType => {
    const { doubts, isLoading, handleSaveDoubt, handleDeleteDoubt } = useWorkPool();
    return { doubts, isLoading, handleSaveDoubt, handleDeleteDoubt };
};