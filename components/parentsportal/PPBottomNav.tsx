
import React from 'react';
import { ParentPage } from '../ParentsPortal';
import { MdDashboard } from 'react-icons/md';
import { FaChartLine, FaCalendarCheck, FaRobot } from 'react-icons/fa';
import { VscChecklist } from 'react-icons/vsc';

interface PPBottomNavProps {
    currentPage: ParentPage;
    onNavigate: (page: ParentPage) => void;
}

const navItems: { id: ParentPage; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Overview', icon: MdDashboard },
    { id: 'attendance', label: 'Attendance', icon: FaCalendarCheck },
    { id: 'performance', label: 'Performance', icon: FaChartLine },
    { id: 'syllabus', label: 'Syllabus', icon: VscChecklist },
    { id: 'ai-assistant', label: 'AI Chat', icon: FaRobot },
];

const PPBottomNav: React.FC<PPBottomNavProps> = ({ currentPage, onNavigate }) => {
    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-auto">
            <nav className="flex items-center gap-4 p-2.5 px-6 rounded-full bg-card/90 backdrop-blur-xl border border-border shadow-soft-xl">
                {navItems.map(({ id, label, icon: Icon }) => {
                    const isActive = currentPage === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onNavigate(id)}
                            className={`
                                relative group flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300
                                ${isActive 
                                    ? 'text-primary' 
                                    : 'text-muted-foreground hover:text-foreground'
                                }
                            `}
                            aria-label={label}
                            title={label}
                        >
                            <Icon className={`w-6 h-6 mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                            {isActive && <div className="w-1 h-1 rounded-full bg-primary absolute bottom-1.5"></div>}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default PPBottomNav;