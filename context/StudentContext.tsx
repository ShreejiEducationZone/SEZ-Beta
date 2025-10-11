import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { getCollection, setDocument, deleteDocument, runBatch } from '../firebase';
import { Student } from '../types';
import { useData } from './DataContext'; // Dependency for showToast and clearing related data

interface StudentContextType {
    students: Student[];
    isLoadingStudents: boolean;
    handleSaveStudent: (studentData: Student) => Promise<void>;
    handleArchiveStudent: (id: string) => Promise<void>;
    handleDeleteStudent: (student: Student, relatedData: { [key: string]: { id: string }[] }) => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(true);
    
    const { showToast } = useData();

    useEffect(() => {
        const fetchStudents = async () => {
            setIsLoadingStudents(true);
            try {
                const studentsData = await getCollection("students");
                setStudents(studentsData as Student[]);
            } catch (error) {
                console.error("Failed to load students:", error);
                showToast("Could not load student directory.", 'error');
            } finally {
                setIsLoadingStudents(false);
            }
        };
        fetchStudents();
    }, [showToast]);

    const handleSaveStudent = useCallback(async (studentData: Student): Promise<void> => {
        try {
            await setDocument("students", studentData.id, studentData);
            setStudents(prev => {
                const exists = prev.some(s => s.id === studentData.id);
                if (exists) return prev.map(s => s.id === studentData.id ? studentData : s);
                return [...prev, studentData];
            });
            showToast(`Student "${studentData.name}" saved successfully!`, 'success');
        } catch (error: any) {
            console.error("Error saving student:", error);
            showToast(`Failed to save student: ${error.message}`, 'error');
            throw error;
        }
    }, [showToast]);

    const handleArchiveStudent = useCallback(async (id: string) => {
        try {
            const student = students.find(s => s.id === id);
            if (student) {
                const updatedStudent = { ...student, isArchived: !student.isArchived };
                await setDocument("students", id, updatedStudent);
                setStudents(prev => prev.map(s => s.id === id ? updatedStudent : s));
                showToast(`Student "${student.name}" has been ${updatedStudent.isArchived ? 'archived' : 'unarchived'}.`, 'success');
            }
        } catch (error: any) {
            console.error("Error archiving student:", error);
            showToast(`Failed to update student status: ${error.message}`, 'error');
        }
    }, [students, showToast]);

    const handleDeleteStudent = useCallback(async (studentToDelete: Student, relatedData: { [key: string]: { id: string }[] }) => {
        if (!studentToDelete) {
            showToast("Student not found for deletion.", 'error');
            return;
        }

        try {
            const writes: { type: 'delete', path: string }[] = [];
            
            // Add student document itself to be deleted
            writes.push({ type: 'delete', path: `students/${studentToDelete.id}` });
            
            // Add related documents from other collections
            const collections = ['studentSubjects', 'faceDescriptors', 'syllabusProgress', 'workItems', 'doubts', 'tests', 'attendance', 'sheetProgress'];
            
            collections.forEach(collection => {
                // Find all items for this student in the collection and add a delete operation for each.
                // The related data is passed in, but we can also just use the studentId. Let's use the ID for robustness.
                 const itemsToDelete = relatedData[collection] || [];
                 itemsToDelete.forEach(item => {
                    writes.push({ type: 'delete', path: `${collection}/${item.id}` });
                 });
            });
            
            // Special handling for collections where the doc ID is the student ID
            ['studentSubjects', 'faceDescriptors'].forEach(collection => {
                // Check if an item exists with student ID as document ID, if so, add delete op
                if (relatedData[collection]?.some(item => item.id === studentToDelete.id)) {
                    // Check to avoid duplicates if already added
                    if (!writes.some(w => w.path === `${collection}/${studentToDelete.id}`)) {
                        writes.push({ type: 'delete', path: `${collection}/${studentToDelete.id}` });
                    }
                }
            });


            await runBatch(writes);

            // Update local student state
            setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));

            showToast(`Successfully deleted ${studentToDelete.name} and all their data.`, 'success');
        } catch (error: any) {
            console.error("Error deleting student and their data:", error);
            showToast(`Failed to delete student: ${error.message}`, 'error');
        }
    }, [showToast]);

    const value = { students, isLoadingStudents, handleSaveStudent, handleArchiveStudent, handleDeleteStudent };

    return <StudentContext.Provider value={value as StudentContextType}>{children}</StudentContext.Provider>;
};

export const useStudent = () => {
    const context = useContext(StudentContext);
    if (context === undefined) {
        throw new Error('useStudent must be used within a StudentProvider');
    }
    return context;
};
