
import React from 'react';
import BookIcon from '../icons/BookIcon';
import DirectoryIcon from '../icons/DirectoryIcon';
import SubjectsIcon from '../icons/SubjectsIcon';
import ProgressIcon from '../icons/ProgressIcon';
import WorkPoolIcon from '../icons/WorkPoolIcon';
import DoubtIcon from '../icons/DoubtIcon';

type Page = 'students' | 'subjects' | 'syllabus' | 'work-pool' | 'doubts';

interface SidebarProps {
    isExpanded: boolean;
    onHover: (isExpanded: boolean) => void;
    currentPage: Page;
    onNavigate: (page: Page) => void;
}

interface NavLinkProps {
    to: Page;
    icon: React.ElementType;
    currentPage: Page;
    onNavigate: (page: Page) => void;
    isExpanded: boolean;
    children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon: Icon, children, currentPage, onNavigate, isExpanded }) => {
    const isActive = currentPage === to;
    const baseClasses = "flex items-center w-full p-3 rounded-lg transition-colors duration-200";
    const activeClasses = "bg-brand-blue/10 text-brand-blue font-semibold";
    const inactiveClasses = "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";

    return (
        <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); onNavigate(to); }} 
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            title={!isExpanded ? String(children) : undefined}
        >
            <Icon className="h-6 w-6 flex-shrink-0" />
            <span className={`ml-4 whitespace-nowrap transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                {children}
            </span>
        </a>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ isExpanded, onHover, currentPage, onNavigate }) => {
    return (
        <aside
            className="fixed top-0 left-0 h-screen bg-light-card dark:bg-dark-card shadow-lg rounded-r-xl transition-all duration-300 z-50"
            style={{ width: isExpanded ? '220px' : '60px' }}
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
        >
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-center h-20 flex-shrink-0">
                    <BookIcon className="h-8 w-8 text-brand-blue" />
                </div>
                <nav className="flex flex-col space-y-2 p-2">
                    <NavLink to="students" icon={DirectoryIcon} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Student Directory</NavLink>
                    <NavLink to="subjects" icon={SubjectsIcon} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Subject Manager</NavLink>
                    <NavLink to="syllabus" icon={ProgressIcon} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Syllabus Progress</NavLink>
                    <NavLink to="work-pool" icon={WorkPoolIcon} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Work Pool</NavLink>
                    <NavLink to="doubts" icon={DoubtIcon} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Doubt Box</NavLink>
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;
