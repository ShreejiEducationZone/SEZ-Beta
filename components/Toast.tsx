
import React, { useEffect, useState } from 'react';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import InfoIcon from './icons/InfoIcon';
import XIcon from './icons/XIcon';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'info' | 'error';
}

interface ToastNotificationProps {
    toast: Toast;
    onClose: (id: number) => void;
}

const ICONS: Record<Toast['type'], React.ReactNode> = {
    success: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
    info: <InfoIcon className="h-6 w-6 text-blue-500" />,
    error: <XCircleIcon className="h-6 w-6 text-red-500" />,
};

const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, 4500);

        const closeTimer = setTimeout(() => {
            onClose(toast.id);
        }, 5000);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(closeTimer);
        };
    }, [toast.id, onClose]);
    
    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(toast.id), 500);
    };

    return (
        <div
            className={`
                flex items-center w-full max-w-sm p-4 text-gray-500 bg-white rounded-lg shadow-lg dark:text-gray-400 dark:bg-gray-800 ring-1 ring-black ring-opacity-5
                transform-gpu transition-all duration-500 ease-in-out
                ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
            `}
            role="alert"
        >
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">
                {ICONS[toast.type]}
            </div>
            <div className="ml-3 text-sm font-normal">{toast.message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
                onClick={handleClose}
                aria-label="Close"
            >
                <span className="sr-only">Close</span>
                <XIcon className="h-5 w-5" />
            </button>
        </div>
    );
};

interface ToastContainerProps {
    toasts: Toast[];
    onClose: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    return (
        <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-[100]">
            <div className="w-full flex flex-col items-center space-y-3 sm:items-end">
                {toasts.map(toast => (
                    <ToastNotification key={toast.id} toast={toast} onClose={onClose} />
                ))}
            </div>
        </div>
    );
};
