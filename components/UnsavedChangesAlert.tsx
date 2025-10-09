import React from 'react';
import WarningIcon from './icons/WarningIcon';

interface UnsavedChangesAlertProps {
    isOpen: boolean;
    onClose: () => void;
}

const UnsavedChangesAlert: React.FC<UnsavedChangesAlertProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" 
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-changes-title"
        >
            <div 
                className="bg-card/80 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-warning-muted">
                        <WarningIcon className="h-7 w-7 text-warning" />
                    </div>
                    <div>
                        <h3 id="unsaved-changes-title" className="text-xl font-bold">
                            Unsaved Changes
                        </h3>
                    </div>
                </div>
                
                <div className="mt-4 text-sm text-muted-foreground">
                    <p>
                        You have unsaved changes in the current subject's sheet. Please save your progress before switching to another subject.
                    </p>
                </div>

                <div className="mt-6 flex justify-end">
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="h-10 px-5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-colors"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnsavedChangesAlert;
