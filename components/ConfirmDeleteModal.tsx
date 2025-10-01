import React from 'react';
import WarningIcon from './icons/WarningIcon';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    studentName: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose, onConfirm, studentName }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
        >
            <div 
                className="bg-light-card dark:bg-dark-card rounded-2xl shadow-2xl p-6 w-full max-w-md transform transition-all"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50">
                        <WarningIcon className="h-7 w-7 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h3 id="delete-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
                            Confirm Permanent Deletion
                        </h3>
                    </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    <p>
                        Are you sure you want to permanently delete <strong>{studentName}</strong>? 
                    </p>
                    <p className="mt-2">
                        All associated data including subjects, progress, work items, doubts, tests, and attendance records will be lost forever. <strong>This action cannot be undone.</strong>
                    </p>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="py-2 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={onConfirm}
                        className="h-10 px-4 rounded-md bg-red-600 text-white hover:bg-red-700 font-semibold transition-colors"
                    >
                        Delete Permanently
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;
