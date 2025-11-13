
import React from 'react';
import { StudentPage } from '../StudentPortal';
import { MdDashboard } from 'react-icons/md';
import { HiOutlineCollection } from 'react-icons/hi';
import { FaChartBar, FaQuestionCircle } from 'react-icons/fa';
import { VscChecklist } from 'react-icons/vsc';

interface SPBottomNavProps {
    currentPage: StudentPage;
    onNavigate: (page: StudentPage) => void;
}

const navItems: { id: StudentPage; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Home', icon: MdDashboard },
    { id: 'syllabus', label: 'Syllabus', icon: VscChecklist },
    { id: 'work-pool', label: 'Work', icon: HiOutlineCollection },
    { id: 'tests', label: 'Tests', icon: FaChartBar },
    { id: 'doubts', label: 'Doubts', icon: FaQuestionCircle },
];

const SPBottomNav: React.FC<SPBottomNavProps> = ({ currentPage, onNavigate }) => {
    return (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-auto max-w-[90%]">
            <nav className="flex items-center gap-2 p-2 rounded-full bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
                {navItems.map(({ id, label, icon: Icon }) => {
                    const isActive = currentPage === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onNavigate(id)}
                            className={`
                                relative group flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ease-out
                                ${isActive 
                                    ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }
                            `}
                            aria-label={label}
                            aria-current={isActive ? 'page' : undefined}
                            title={label}
                        >
                            <Icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? '' : 'group-hover:scale-110'}`} />
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default SPBottomNav;
