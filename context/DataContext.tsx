import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode, useMemo } from 'react';
import { getDocument, setDocument } from '../firebase';
import { Student, MistakeTypeDefinition, AreaDefinition } from '../types';
import { Toast } from '../components/Toast';
import { MISTAKE_TYPES } from '../constants';

// User type for authentication
export interface User {
    id: string;
    email: string;
    role: 'admin' | 'student';
    name: string;
    studentId?: string; // Link to student object if role is student
    avatarUrl?: string | null;
    password?: string;
}

// Define context shape
interface DataContextType {
    customMistakeTypes: MistakeTypeDefinition[];
    branches: string[];
    isAppReady: boolean;
    darkMode: boolean;
    toasts: Toast[];
    currentUser: User | null;

    // Auth Handlers
    login: (identifier: string, pass: string, students: Student[]) => Promise<void>;
    logout: () => void;
    
    // Config Handlers
    handleSaveCustomMistakeTypes: (types: MistakeTypeDefinition[]) => Promise<void>;
    handleSaveBranches: (branches: string[]) => Promise<void>;
    
    setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
    showToast: (message: string, type?: Toast['type']) => void;
    removeToast: (id: number) => void;

    // derived state
    allMistakeTypes: MistakeTypeDefinition[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [customMistakeTypes, setCustomMistakeTypes] = useState<MistakeTypeDefinition[]>([]);
    const [branches, setBranches] = useState<string[]>([]);
    
    const [isAppReady, setIsAppReady] = useState(false);
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        try {
            const item = window.localStorage.getItem('sez-currentUser');
            return item ? JSON.parse(item) : null;
        } catch (error) {
            return null;
        }
    });

    const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
        const newToast: Toast = { id: Date.now(), message, type };
        setToasts(prev => [...prev, newToast]);
    }, []);

    const login = useCallback(async (identifier: string, pass: string, students: Student[]) => {
        const adminUser: User & { password?: string } = {
            id: 'admin01',
            email: 'sez@admin.com',
            password: 'pass12345',
            role: 'admin',
            name: 'Administrator',
            avatarUrl: 'https://i.pravatar.cc/150?u=admin'
        };

        if (identifier.toLowerCase() === adminUser.email.toLowerCase()) {
            if (adminUser.password === pass) {
                const { password, ...userSessionData } = adminUser;
                setCurrentUser(userSessionData);
                window.localStorage.setItem('sez-currentUser', JSON.stringify(userSessionData));
                return;
            } else {
                throw new Error('Invalid password for administrator.');
            }
        }

        const studentToLogin = students.find(s => s.name.toLowerCase() === identifier.toLowerCase());

        if (studentToLogin) {
            if (studentToLogin.password === pass) {
                const userSessionData: User = {
                    id: `user-${studentToLogin.id}`,
                    email: studentToLogin.email || '',
                    role: 'student',
                    name: studentToLogin.name,
                    studentId: studentToLogin.id,
                    avatarUrl: studentToLogin.avatarUrl
                };
                setCurrentUser(userSessionData);
                window.localStorage.setItem('sez-currentUser', JSON.stringify(userSessionData));
                return;
            } else {
                throw new Error('Invalid password for this student.');
            }
        }
        
        throw new Error('User not found. Please check the name or email.');

    }, []);
    
    const logout = useCallback(() => {
        setCurrentUser(null);
        window.localStorage.removeItem('sez-currentUser');
        // Child contexts will clear their own data upon seeing currentUser is null
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // Effect 1: Initial App Load (fetches config, not user-specific data)
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [mistakeTypesDoc, branchesDoc] = await Promise.all([
                    getDocument("configuration", "mistakeTypes"),
                    getDocument("configuration", "branches"),
                ]);
                
                if (mistakeTypesDoc && Array.isArray((mistakeTypesDoc as any).types)) {
                    setCustomMistakeTypes((mistakeTypesDoc as any).types);
                } else setCustomMistakeTypes([]);

                if (branchesDoc && Array.isArray((branchesDoc as any).names)) {
                    setBranches((branchesDoc as any).names);
                } else setBranches([]);

            } catch (error) {
                console.error("Failed to load initial app config:", error);
                showToast("Could not connect to the server.", 'error');
            } finally {
                setIsAppReady(true);
            }
        };
        
        loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    const handleSaveCustomMistakeTypes = useCallback(async (types: MistakeTypeDefinition[]) => {
        try {
            const uniqueTypes = types.filter((type, index, self) => index === self.findIndex((t) => t.title.trim().toLowerCase() === type.title.trim().toLowerCase()));
            await setDocument("configuration", "mistakeTypes", { types: uniqueTypes });
            setCustomMistakeTypes(uniqueTypes);
            showToast('Custom mistake types saved.', 'success');
        } catch (error: any) {
            showToast(`Failed to save mistake types: ${error.message}`, 'error');
        }
    }, [showToast]);

    const handleSaveBranches = useCallback(async (newBranches: string[]) => {
        try {
            await setDocument("configuration", "branches", { names: newBranches });
            setBranches(newBranches);
            showToast('Branches updated successfully.', 'success');
        } catch (error: any) {
            showToast(`Failed to save branches: ${error.message}`, 'error');
            throw error;
        }
    }, [showToast]);

    const allMistakeTypes = useMemo(() => {
        const combined = new Map<string, MistakeTypeDefinition>();
        MISTAKE_TYPES.forEach(type => combined.set(type.title.toLowerCase(), type));
        customMistakeTypes.forEach(type => combined.set(type.title.toLowerCase(), type));
        return Array.from(combined.values());
    }, [customMistakeTypes]);

    const value = {
        customMistakeTypes, branches, isAppReady, darkMode, toasts, allMistakeTypes,
        currentUser, login, logout,
        handleSaveCustomMistakeTypes, handleSaveBranches,
        setDarkMode, showToast, removeToast
    };

    return <DataContext.Provider value={value as DataContextType}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};