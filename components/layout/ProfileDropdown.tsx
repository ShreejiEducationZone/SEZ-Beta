import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

const ProfileDropdown: React.FC = () => {
    const { currentUser, logout } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!currentUser) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
                aria-label="Open user menu"
            >
                {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <FaUserCircle className="h-8 w-8 text-gray-500" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-light-card dark:bg-dark-card rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                               {currentUser.avatarUrl ? (
                                    <img src={currentUser.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <FaUserCircle className="h-10 w-10 text-gray-500 mt-1" />
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-white truncate">{currentUser.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{currentUser.role}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-2">
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <FaSignOutAlt className="h-5 w-5 text-gray-500" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;
