

import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Holiday } from '../../types';
import DeleteIcon from '../icons/DeleteIcon';

interface HolidayManagerModalProps {
    onClose: () => void;
}

export const HolidayManagerModal: React.FC<HolidayManagerModalProps> = ({ onClose }) => {
    const { holidays, handleSaveHoliday, handleDeleteHoliday } = useData();
    
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
            <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-lg w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold">Manage Holidays</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-3xl font-light">&times;</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 p-6">
                    {/* Left Column: Add Holiday Form */}
                    <div className="space-y-4 md:border-r md:pr-8 border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Schedule a New Holiday</h3>
                        <div className="space-y-2">
                            <label htmlFor="holiday-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                            <input
                                id="holiday-date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="holiday-reason" className="text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
                            <input
                                id="holiday-reason"
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g., Diwali Festival"
                                className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50"
                            />
                        </div>
                        <button onClick={handleAddHoliday} className="w-full h-10 px-4 rounded-md bg-brand-blue text-white font-semibold hover:bg-blue-700 transition-colors">
                            Add Holiday
                        </button>
                    </div>

                    {/* Right Column: Holiday List */}
                    <div className="mt-6 md:mt-0">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Scheduled Holidays</h3>
                        <div className="max-h-80 overflow-y-auto space-y-2 thin-scrollbar pr-2 -mr-2">
                            {sortedHolidays.length > 0 ? sortedHolidays.map(holiday => (
                                <div key={holiday.id} className="group flex justify-between items-center p-3 bg-light-bg dark:bg-dark-bg/50 rounded-md">
                                    <div>
                                        <p className="font-medium">{holiday.reason}</p>
                                        <p className="text-sm text-gray-500">{new Date(holiday.date).toLocaleDateString('en-GB', {timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric'})}</p>
                                    </div>
                                    <button onClick={() => handleDeleteHoliday(holiday.id)} className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity dark:hover:bg-red-900/50 rounded-full">
                                        <DeleteIcon />
                                    </button>
                                </div>
                            )) : <p className="text-center text-sm italic text-gray-500 py-8">No holidays scheduled.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
