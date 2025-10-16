import React, { useState } from 'react';
// FIX: Import useAttendance to get holiday data
import { useAttendance } from '../../context/AttendanceContext';
import { Holiday } from '../../types';
import DeleteIcon from '../icons/DeleteIcon';

interface HolidayManagerModalProps {
    onClose: () => void;
}

export const HolidayManagerModal: React.FC<HolidayManagerModalProps> = ({ onClose }) => {
    // FIX: Get holiday data from useAttendance hook
    const { holidays, handleSaveHoliday, handleDeleteHoliday } = useAttendance();
    
    const [date, setDate] = useState('');
    const [reason, setReason] = useState('');

    const handleAddHoliday = () => {
        if (!date || !reason.trim()) {
            alert("Please provide both a date and a reason for the holiday.");
            return;
        }
        
        const newHoliday: Holiday = {
            id: date, // Use date as the unique ID
            date,
            reason: reason.trim(),
        };
        
        handleSaveHoliday(newHoliday);
        setDate('');
        setReason('');
    };
    
    const sortedHolidays = [...holidays].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card/80 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-border">
                    <h2 className="text-2xl font-bold text-foreground">Manage Holidays</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-3xl font-light">&times;</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 p-6">
                    {/* Left Column: Add Holiday Form */}
                    <div className="space-y-4 md:border-r md:pr-8 border-border">
                        <h3 className="text-lg font-semibold text-foreground">Schedule a New Holiday</h3>
                        <div className="space-y-2">
                            <label htmlFor="holiday-date" className="text-sm font-medium text-muted-foreground">Date</label>
                            <input
                                id="holiday-date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="holiday-reason" className="text-sm font-medium text-muted-foreground">Reason</label>
                            <input
                                id="holiday-reason"
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g., Diwali Festival"
                                className="w-full h-10 px-3 rounded-lg border border-border bg-background"
                            />
                        </div>
                        <button onClick={handleAddHoliday} className="w-full h-10 px-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                            Add Holiday
                        </button>
                    </div>

                    {/* Right Column: Holiday List */}
                    <div className="mt-6 md:mt-0">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Scheduled Holidays</h3>
                        <div className="max-h-80 overflow-y-auto space-y-2 thin-scrollbar pr-2 -mr-2">
                            {sortedHolidays.length > 0 ? sortedHolidays.map(holiday => (
                                <div key={holiday.id} className="group flex justify-between items-center p-3 bg-background rounded-lg border border-border">
                                    <div>
                                        <p className="font-medium text-foreground">{holiday.reason}</p>
                                        <p className="text-sm text-muted-foreground">{new Date(holiday.date).toLocaleDateString('en-GB', {timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric'})}</p>
                                    </div>
                                    <button onClick={() => handleDeleteHoliday(holiday.id)} className="p-1.5 text-muted-foreground hover:text-danger hover:bg-danger/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DeleteIcon />
                                    </button>
                                </div>
                            )) : <p className="text-center text-sm italic text-muted-foreground py-8">No holidays scheduled.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};