import React from 'react';
import { FaBookOpen, FaQuestionCircle, FaChartBar, FaCog, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { HiUsers, HiOutlineCollection } from 'react-icons/hi';
import { MdSubject } from 'react-icons/md';
import { VscChecklist } from 'react-icons/vsc';
import { BsCalendar2Check, BsChatDots } from 'react-icons/bs';
import XIcon from '../icons/XIcon';


type Page = 'students' | 'subjects' | 'syllabus' | 'work-pool' | 'doubts' | 'reports' | 'attendance' | 'settings' | 'ai-assistant';

interface SidebarProps {
    isExpanded: boolean;
    onToggle: () => void;
    currentPage: Page;
    onNavigate: (page: Page) => void;
}

const NavLink: React.FC<{ to: Page; icon: React.ElementType; currentPage: Page; onNavigate: (page: Page) => void; isExpanded: boolean; children: React.ReactNode; }> = ({ to, icon: Icon, children, currentPage, onNavigate, isExpanded }) => {
    const isActive = currentPage === to;
    return (
        <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); onNavigate(to); }} 
            className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            title={!isExpanded ? String(children) : undefined}
        >
            <Icon className="h-6 w-6 flex-shrink-0" />
            <span className={`ml-4 whitespace-nowrap overflow-hidden transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                {children}
            </span>
        </a>
    );
};


const Sidebar: React.FC<SidebarProps> = ({ isExpanded, onToggle, currentPage, onNavigate }) => {
    return (
        <>
            <aside
                className={`
                    fixed top-0 left-0 h-full bg-card/80 dark:bg-card/70 backdrop-blur-lg border-r md:border border-border md:rounded-2xl md:top-4 md:left-4 md:h-[calc(100vh-2rem)]
                    flex flex-col transition-all duration-300 z-50 
                    ${isExpanded ? 'w-64' : 'w-20'}
                    max-md:w-64 max-md:transition-transform ${isExpanded ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}
                `}
            >
                {isExpanded && (
                    <button onClick={onToggle} className="absolute top-4 right-4 p-2 text-muted-foreground rounded-full hover:bg-muted md:hidden" aria-label="Close sidebar">
                        <XIcon className="h-6 w-6" />
                    </button>
                )}
                <div className="flex items-center justify-center h-20 flex-shrink-0">
                    <FaBookOpen className={`h-8 w-8 text-primary transition-transform duration-500 ${isExpanded ? 'rotate-0' : 'rotate-12'}`} />
                </div>
                <nav className="flex-grow flex flex-col space-y-2 p-3">
                    <NavLink to="students" icon={HiUsers} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Students</NavLink>
                    <NavLink to="subjects" icon={MdSubject} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Subjects</NavLink>
                    <NavLink to="syllabus" icon={VscChecklist} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Syllabus</NavLink>
                    <NavLink to="work-pool" icon={HiOutlineCollection} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Work Pool</NavLink>
                    <NavLink to="doubts" icon={FaQuestionCircle} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Doubt Box</NavLink>
                    <NavLink to="reports" icon={FaChartBar} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Reports</NavLink>
                    <NavLink to="attendance" icon={BsCalendar2Check} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Attendance</NavLink>
                    <NavLink to="ai-assistant" icon={BsChatDots} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>AI Assistant</NavLink>
                    <div className="flex-grow" />
                    <NavLink to="settings" icon={FaCog} currentPage={currentPage} onNavigate={onNavigate} isExpanded={isExpanded}>Settings</NavLink>
                </nav>
            </aside>
            <div className="hidden md:block">
                 <button
                    onClick={onToggle}
                    className={`
                        fixed top-1/2 -translate-y-1/2 bg-card border border-border h-7 w-7 rounded-full flex items-center justify-center 
                        shadow-soft text-muted-foreground hover:text-foreground z-50 transition-all duration-300
                        ${isExpanded ? 'left-60' : 'left-16'}
                    `}
                    aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
                    title={isExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
                >
                    {isExpanded ? <FaChevronLeft className="h-4 w-4" /> : <FaChevronRight className="h-4 w-4" />}
                </button>
            </div>
        </>
    );
};

export default Sidebar;