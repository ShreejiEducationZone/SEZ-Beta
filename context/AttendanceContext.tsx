import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { getCollection, setDocument, deleteDocument, runBatch } from '../firebase';
import { FaceDescriptorData, AttendanceRecord, Holiday, AttendanceStatus } from '../types';
import { useData } from './DataContext';

interface AttendanceContextType {
    faceDescriptors: FaceDescriptorData[];
    attendanceRecords: AttendanceRecord[];
    holidays: Holiday[];
    isLoading: boolean;
    handleSaveFaceDescriptor: (descriptorData: FaceDescriptorData) => Promise<void>;
    handleSaveAttendanceRecord: (record: AttendanceRecord) => Promise<void>;
    handleSaveHoliday: (holiday: Holiday) => Promise<void>;
    handleDeleteHoliday: (holidayId: string) => Promise<void>;
    handleBatchUpdateAttendance: (studentIds: string[], date: string, status: AttendanceStatus, reason?: string) => Promise<void>;
    handleBatchSaveAttendanceRecords: (records: AttendanceRecord[]) => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [faceDescriptors, setFaceDescriptors] = useState<FaceDescriptorData[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const { currentUser, showToast } = useData();

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) {
                setFaceDescriptors([]);
                setAttendanceRecords([]);
                setHolidays([]);
                return;
            }

            setIsLoading(true);
            try {
                const [descriptorsData, attendanceData, holidaysData] = await Promise.all([
                    getCollection("faceDescriptors"),
                    getCollection("attendance"),
                    getCollection("holidays"),
                ]);

                const studentId = currentUser.studentId;
                const isAdmin = currentUser.role === 'admin';

                setFaceDescriptors(isAdmin ? descriptorsData as FaceDescriptorData[] : (descriptorsData as FaceDescriptorData[]).filter(d => d.id === studentId));
                setAttendanceRecords(isAdmin ? attendanceData as AttendanceRecord[] : (attendanceData as AttendanceRecord[]).filter(a => a.studentId === studentId));
                setHolidays(holidaysData as Holiday[]);
            } catch (error) {
                console.error("Failed to fetch attendance data:", error);
                showToast("Could not load attendance data.", 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentUser, showToast]);
    
    const handleSaveFaceDescriptor = useCallback(async (descriptorData: FaceDescriptorData) => {
        try {
            await setDocument("faceDescriptors", descriptorData.id, descriptorData);
            setFaceDescriptors(prev => {
                const exists = prev.some(d => d.id === descriptorData.id);
                if (exists) return prev.map(d => d.id === descriptorData.id ? descriptorData : d);
                return [...prev, descriptorData];
            });
        } catch (error: any) {
            console.error("Error saving face descriptor:", error);
            showToast(`Failed to save registration: ${error.message}`, 'error');
            throw error;
        }
    }, [showToast]);

    const handleSaveAttendanceRecord = useCallback(async (record: AttendanceRecord) => {
        try {
            await setDocument("attendance", record.id, record);
            setAttendanceRecords(prev => {
                const exists = prev.some(r => r.id === record.id);
                if (exists) return prev.map(r => r.id === record.id ? record : r);
                return [...prev, record];
            });
        } catch (error: any) {
            console.error("Error saving attendance record:", error);
            showToast(`Failed to save attendance: ${error.message}`, 'error');
        }
    }, [showToast]);
    
    const handleBatchUpdateAttendance = useCallback(async (studentIds: string[], date: string, status: AttendanceStatus, reason?: string) => {
        try {
            const writes = studentIds.map(studentId => {
                const recordId = `${studentId}_${date}`;
                const record: AttendanceRecord = { id: recordId, studentId, date, status, reason };
                return { type: 'set' as const, path: `attendance/${recordId}`, data: record };
            });
            await runBatch(writes);
            
            const newRecords = writes.map(w => w.data);
            const newRecordMap = new Map(newRecords.map(r => [r.id, r]));

            setAttendanceRecords(prev => {
                const otherRecords = prev.filter(r => !newRecordMap.has(r.id));
                return [...otherRecords, ...newRecords];
            });
        } catch (error: any) {
            console.error("Error batch updating attendance:", error);
            showToast(`Failed to update attendance: ${error.message}`, 'error');
        }
    }, [showToast]);
    
    const handleBatchSaveAttendanceRecords = useCallback(async (records: AttendanceRecord[]) => {
        if (records.length === 0) return;
        try {
            const writes = records.map(record => ({
                type: 'set' as const,
                path: `attendance/${record.id}`,
                data: record
            }));
            await runBatch(writes);
            
            const newRecordsMap = new Map(records.map(r => [r.id, r]));
            setAttendanceRecords(prev => {
                const otherRecords = prev.filter(r => !newRecordsMap.has(r.id));
                return [...otherRecords, ...records];
            });

            showToast(`${records.length} attendance record(s) saved.`, 'success');
        } catch (error: any) {
            console.error("Error batch saving attendance:", error);
            showToast(`Failed to save attendance: ${error.message}`, 'error');
            throw error;
        }
    }, [showToast]);

    const handleSaveHoliday = useCallback(async (holiday: Holiday) => {
        try {
            await setDocument("holidays", holiday.id, holiday);
            setHolidays(prev => {
                const exists = prev.some(h => h.id === holiday.id);
                if (exists) return prev.map(h => h.id === holiday.id ? holiday : h);
                return [...prev, holiday];
            });
            showToast("Holiday saved successfully!", "success");
        } catch (error: any) {
            showToast(`Failed to save holiday: ${error.message}`, "error");
        }
    }, [showToast]);

    const handleDeleteHoliday = useCallback(async (holidayId: string) => {
        try {
            await deleteDocument("holidays", holidayId);
            setHolidays(prev => prev.filter(h => h.id !== holidayId));
            showToast("Holiday deleted.", "success");
        } catch (error: any) {
            showToast(`Failed to delete holiday: ${error.message}`, "error");
        }
    }, [showToast]);

    const value = { faceDescriptors, attendanceRecords, holidays, isLoading, handleSaveFaceDescriptor, handleSaveAttendanceRecord, handleSaveHoliday, handleDeleteHoliday, handleBatchUpdateAttendance, handleBatchSaveAttendanceRecords };

    return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
};

export const useAttendance = () => {
    const context = useContext(AttendanceContext);
    if (context === undefined) {
        throw new Error('useAttendance must be used within an AttendanceProvider');
    }
    return context;
};
