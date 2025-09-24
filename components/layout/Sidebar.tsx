import React from 'react';
import { FaBookOpen, FaQuestionCircle, FaChartBar, FaCog, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { HiUsers, HiOutlineCollection } from 'react-icons/hi';
import { MdSubject } from 'react-icons/md';
import { VscChecklist } from 'react-icons/vsc';
import { BsCalendar2Check } from 'react-icons/bs';


type Page = 'students' | 'subjects' | 'syllabus' | 'work-pool' | 'doubts' | 'reports' | 'attendance' | 'settings';

interface SidebarProps {
    isExpanded: boolean;
    onToggle: () => void;
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


const Sidebar: React.FC<SidebarProps> = ({ isExpanded, onToggle, currentPage, onNavigate }) => {
    return (
        <aside
            className="fixed top-0 left-0 h-screen bg-light-card dark:bg-dark-card shadow-lg rounded-r-xl transition-all duration-300 z-50"
            style={{ width: isExpanded ? '220px' : '60px' }}
        >
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-center h-20 flex-shrink-0">
                    <FaBookOpen className="h-8 w-8 text-brand-blue" />
                </div>
                <nav className="flex-grow flex flex-col space-y-2 p-2">
                    <NavLink to="students" icon={HiUsers} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Student Directory</NavLink>
                    <NavLink to="subjects" icon={MdSubject} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Subject Manager</NavLink>
                    <NavLink to="syllabus" icon={VscChecklist} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Syllabus Progress</NavLink>
                    <NavLink to="work-pool" icon={HiOutlineCollection} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Work Pool</NavLink>
                    <NavLink to="doubts" icon={FaQuestionCircle} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Doubt Box</NavLink>
                    <NavLink to="reports" icon={FaChartBar} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Reports & Tests</NavLink>
                    <NavLink to="attendance" icon={BsCalendar2Check} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Attendance</NavLink>
                    <div className="flex-grow" />
                    <NavLink to="settings" icon={FaCog} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Settings</NavLink>
                </nav>
                <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <button
                        onClick={onToggle}
                        className="flex items-center justify-center w-full p-3 rounded-lg transition-colors duration-200 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
                        title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
                    >
                        {isExpanded ? <FaChevronLeft className="h-6 w-6" /> : <FaChevronRight className="h-6 w-6" />}
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;