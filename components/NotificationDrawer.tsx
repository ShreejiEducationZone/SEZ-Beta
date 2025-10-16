import React, { useState, useMemo } from 'react';
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

type NotificationTab = 'all' | 'work-pool' | 'doubts';

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, notifications, onNavigate, onDismiss, onDismissAll }) => {
    
    const [activeTab, setActiveTab] = useState<NotificationTab>('all');

    const overdueTasks = useMemo(() => notifications.filter(n => n.type === 'work-pool'), [notifications]);
    const newDoubts = useMemo(() => notifications.filter(n => n.type === 'doubts'), [notifications]);

    const notificationsToDisplay = useMemo(() => {
        switch (activeTab) {
            case 'work-pool':
                return overdueTasks;
            case 'doubts':
                return newDoubts;
            case 'all':
            default:
                return notifications;
        }
    }, [activeTab, notifications, overdueTasks, newDoubts]);

    const handleDismissClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent navigation when dismissing
        onDismiss(id);
    };

    const tabs: { id: NotificationTab, label: string, count: number }[] = [
        { id: 'all', label: 'All', count: notifications.length },
        { id: 'work-pool', label: 'Overdue', count: overdueTasks.length },
        { id: 'doubts', label: 'Doubts', count: newDoubts.length },
    ];
    const activeTabIndex = tabs.findIndex(t => t.id === activeTab);


    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <div
                className={`fixed top-0 right-0 w-full max-w-md h-full bg-card/80 dark:bg-card/70 backdrop-blur-xl border-l border-border shadow-soft-xl flex flex-col transition-transform duration-300 ease-in-out z-50 rounded-l-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
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

                <div className="p-2 border-b border-border">
                    <div className="relative flex items-center bg-muted p-1 rounded-full">
                        <div 
                            className="absolute h-[calc(100%-0.5rem)] w-1/3 bg-background rounded-full shadow-soft transition-transform duration-300 ease-in-out"
                            style={{ transform: `translateX(${activeTabIndex * 100}%)` }}
                        ></div>
                        {tabs.map(tab => (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id)} 
                                className={`relative w-1/3 z-10 py-1.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground'}`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-border'}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto thin-scrollbar">
                    {notificationsToDisplay.length > 0 ? (
                        notificationsToDisplay.map(({ id, type, item, student, text }) => {
                            if (!student) return null; // Safety check
                            return (
                            <div 
                                key={id} 
                                onClick={() => onNavigate(type, student)} 
                                className="p-4 hover:bg-muted/50 cursor-pointer border-b border-border flex items-start gap-4 group last:border-b-0"
                            >
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 mt-1">
                                    {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <p className="text-sm text-foreground">
                                        <strong className="font-semibold">{student.name}</strong> {text}
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
                        )})
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                            <FaBell className="h-16 w-16 mb-4 opacity-50"/>
                            <h3 className="text-lg font-semibold text-foreground">All Caught Up!</h3>
                            <p>You have no new notifications {activeTab !== 'all' && `in this tab`}.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationDrawer;