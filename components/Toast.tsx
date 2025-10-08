import React, { useEffect, useState, useRef, useCallback } from 'react';
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
    const toastRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ x: number, y: number } | null>(null);
    const [style, setStyle] = useState<React.CSSProperties>({
        opacity: 0,
        transform: 'translateY(-20px) scale(0.95)',
    });
    const closeTimerRef = useRef<number | null>(null);

    const handleClose = useCallback((direction: 'up' | 'left' | 'right' | 'timeout' = 'timeout') => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null; 

        let exitTransform = 'translateY(20px) scale(0.95)';
        let exitOpacity = 0;

        if (direction === 'up') exitTransform = 'translateY(-100%)';
        if (direction === 'left') exitTransform = 'translateX(-120%)';
        if (direction === 'right') exitTransform = 'translateX(120%)';

        setStyle({
            opacity: exitOpacity,
            transform: exitTransform,
            transition: 'all 0.3s ease-in'
        });

        setTimeout(() => onClose(toast.id), 300);
    }, [onClose, toast.id]);

    useEffect(() => {
        const animateInTimer = setTimeout(() => {
            setStyle({
                opacity: 1,
                transform: 'translateY(0) scale(1)',
                transition: 'all 0.4s cubic-bezier(0.21, 1.02, 0.73, 1)'
            });
        }, 100);

        closeTimerRef.current = window.setTimeout(() => handleClose('timeout'), 5000);

        return () => {
            clearTimeout(animateInTimer);
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, [handleClose]);

    const onPointerDown = (e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (!dragStartRef.current) return;
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        setStyle({
            transform: `translate(${deltaX}px, ${deltaY}px) scale(1)`,
            transition: 'none',
        });
    };

    const onPointerUp = (e: React.PointerEvent) => {
        if (!dragStartRef.current) return;
        const deltaX = e.clientX - dragStartRef.current.x;
        const deltaY = e.clientY - dragStartRef.current.y;
        const toastWidth = toastRef.current?.offsetWidth || 384;
        e.currentTarget.releasePointerCapture(e.pointerId);
        dragStartRef.current = null;

        const dismissThreshold = toastWidth / 3;
        if (deltaY < -dismissThreshold) handleClose('up');
        else if (deltaX < -dismissThreshold) handleClose('left');
        else if (deltaX > dismissThreshold) handleClose('right');
        else {
            setStyle({ transform: 'translateY(0) scale(1)', transition: 'all 0.3s ease-out' });
            closeTimerRef.current = window.setTimeout(() => handleClose('timeout'), 4000);
        }
    };

    return (
        <div
            ref={toastRef}
            style={style}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="flex items-center w-full max-w-sm p-4 text-card-foreground bg-card/80 dark:bg-card/70 backdrop-blur-lg rounded-xl shadow-soft-lg border border-border touch-none"
            role="alert"
        >
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">
                {ICONS[toast.type]}
            </div>
            <div className="ml-3 text-sm font-medium">{toast.message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex h-8 w-8 text-muted-foreground hover:bg-muted"
                onClick={(e) => { e.stopPropagation(); handleClose('timeout'); }}
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
        <div aria-live="assertive" className="fixed inset-0 flex items-start justify-center px-4 py-6 pointer-events-none sm:p-6 z-[100]">
            <div className="w-full flex flex-col items-center space-y-3">
                {toasts.map(toast => (
                    <ToastNotification key={toast.id} toast={toast} onClose={onClose} />
                ))}
            </div>
        </div>
    );
};
