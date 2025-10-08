import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

const ProfileDropdown: React.FC = () => {
    const { currentUser, logout } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!currentUser) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary"
                aria-label="Open user menu"
            >
                {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <FaUserCircle className="h-8 w-8 text-muted-foreground" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-card/80 dark:bg-card/70 backdrop-blur-lg rounded-xl shadow-soft-lg border border-border z-50">
                    <div className="p-4 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                               {currentUser.avatarUrl ? (
                                    <img src={currentUser.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <FaUserCircle className="h-10 w-10 text-muted-foreground mt-1" />
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-foreground truncate">{currentUser.name}</p>
                                <p className="text-sm text-muted-foreground capitalize">{currentUser.role}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-2">
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-foreground rounded-md hover:bg-muted"
                        >
                            <FaSignOutAlt className="h-5 w-5 text-muted-foreground" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;
