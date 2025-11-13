import React, { useState } from 'react';
import { FaChevronLeft, FaSignOutAlt, FaSun, FaMoon } from 'react-icons/fa';
import { useData } from '../../context/DataContext';
import { Student } from '../../types';
import PlaceholderAvatar from '../PlaceholderAvatar';

interface SPHeaderProps {
    title: string;
    student: Student;
    onBack: () => void;
}

const SPHeader: React.FC<SPHeaderProps> = ({ title, student, onBack }) => {
    const { logout, darkMode, setDarkMode } = useData();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    return (
        <>
            <header className="flex justify-between items-center pt-2 pb-6">
                <div className="w-12">
                    <button
                        onClick={onBack}
                        className="w-12 h-12 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-muted transition-all group"
                        aria-label="Go back"
                    >
                        <FaChevronLeft className="h-5 w-5 text-foreground" />
                    </button>
                </div>
                
                <h1 className="text-lg sm:text-xl font-bold text-foreground absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                    {title}
                </h1>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="w-12 h-12 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-muted transition-all group"
                        aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                        {darkMode ? <FaSun className="h-5 w-5 text-yellow-500" /> : <FaMoon className="h-5 w-5 text-indigo-500" />}
                    </button>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-12 h-12 rounded-full overflow-hidden bg-muted border-2 border-card shadow-sm hover:ring-2 hover:ring-primary transition-all"
                        aria-label="Open user menu"
                    >
                        {student.avatarUrl ? (
                            <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                            <PlaceholderAvatar />
                        )}
                    </button>
                </div>
            </header>
            
            {showLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}>
                    <div className="bg-card p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-border" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-danger-muted rounded-full flex items-center justify-center mb-4">
                                <FaSignOutAlt className="h-8 w-8 text-danger" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">
                                Confirm Logout
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                Are you sure you want to logout?
                            </p>
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1 py-2.5 rounded-xl font-semibold bg-muted text-muted-foreground hover:bg-border transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={logout}
                                    className="flex-1 py-2.5 rounded-xl font-semibold bg-danger text-danger-foreground hover:bg-danger/90 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SPHeader;
