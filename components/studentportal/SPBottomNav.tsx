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
        <footer className="fixed bottom-0 left-0 right-0 h-20 bg-card/80 dark:bg-card/70 backdrop-blur-lg border-t border-border z-40">
            <nav className="h-full max-w-7xl mx-auto flex justify-around items-center px-2">
                {navItems.map(({ id, label, icon: Icon }) => {
                    const isActive = currentPage === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onNavigate(id)}
                            className={`flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon className={`h-6 w-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
                            <span className="text-xs font-semibold">{label}</span>
                        </button>
                    );
                })}
            </nav>
        </footer>
    );
};

export default SPBottomNav;