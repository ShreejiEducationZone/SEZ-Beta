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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
        >
            <div 
                className="bg-card/80 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-danger-muted">
                        <WarningIcon className="h-7 w-7 text-danger" />
                    </div>
                    <div>
                        <h3 id="delete-modal-title" className="text-xl font-bold">
                            Confirm Permanent Deletion
                        </h3>
                    </div>
                </div>
                
                <div className="mt-4 text-sm text-muted-foreground">
                    <p>
                        Are you sure you want to permanently delete <strong>{studentName}</strong>? 
                    </p>
                    <p className="mt-2">
                        All associated data will be lost forever. <strong>This action cannot be undone.</strong>
                    </p>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        onClick={onConfirm}
                        className="h-10 px-4 rounded-lg bg-danger text-danger-foreground hover:bg-danger/90 font-semibold transition-colors"
                    >
                        Delete Permanently
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;