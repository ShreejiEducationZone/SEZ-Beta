import React from 'react';
import { Student, WorkItem, Doubt } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import XIcon from './icons/XIcon';
import { FaBell } from 'react-icons/fa';
import DeleteIcon from './icons/DeleteIcon';

type Page = 'students' | 'subjects' | 'syllabus' | 'work-pool' | 'doubts' | 'reports' | 'sheets' | 'attendance' | 'ai-assistant' | 'settings' | 'video-library' | 'analytics';

type Notification = {
    id: string;
    type: Page;
    item: WorkItem | Doubt;
    student?: Student;
    text: string;
};

interface NotificationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
    onNavigate: (page: Page, student: Student) => void;
    onDismiss: (id: string) => void;
    onDismissAll: () => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, notifications, onNavigate, onDismiss, onDismissAll }) => {
    
    if (!isOpen) return null;

    const handleDismissClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent navigation when dismissing
        onDismiss(id);
    };

    return (
        <>
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <div
                className="fixed top-0 right-0 w-full max-w-md h-full bg-card/80 dark:bg-card/70 backdrop-blur-xl border-l border-border shadow-soft-xl flex flex-col transition-transform duration-300 ease-in-out z-50 translate-x-0"
                role="dialog"
                aria-modal="true"
                aria-labelledby="notification-drawer-title"
            >
                <header className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
                    <h2 id="notification-drawer-title" className="text-xl font-bold text-foreground">Notifications</h2>
                     <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                            <button 
                                onClick={onDismissAll} 
                                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-danger px-3 py-1.5 rounded-lg hover:bg-danger-muted"
                                aria-label="Dismiss all notifications"
                            >
                                <DeleteIcon className="h-4 w-4" />
                                Dismiss All
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 rounded-full text-muted-foreground hover:bg-muted" aria-label="Close notifications">
                            <XIcon className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                <div className="flex-grow overflow-y-auto thin-scrollbar">
                    {notifications.length > 0 ? (
                        notifications.map(({ id, type, item, student, text }) => (
                            <div 
                                key={id} 
                                onClick={() => onNavigate(type, student!)} 
                                className="p-4 hover:bg-muted/50 cursor-pointer border-b border-border flex items-start gap-4 group last:border-b-0"
                            >
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 mt-1">
                                    {student!.avatarUrl ? <img src={student!.avatarUrl} alt={student!.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="text-sm text-foreground">
                                        <strong className="font-semibold">{student!.name}</strong> {text}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">{(item as WorkItem).title || (item as Doubt).text}</p>
                                </div>
                                <button 
                                    onClick={(e) => handleDismissClick(e, id)} 
                                    className="p-1.5 rounded-full text-muted-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" 
                                    aria-label="Dismiss notification"
                                >
                                    <XIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                            <FaBell className="h-16 w-16 mb-4 opacity-50"/>
                            <h3 className="text-lg font-semibold text-foreground">All Caught Up!</h3>
                            <p>You have no new notifications.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationDrawer;