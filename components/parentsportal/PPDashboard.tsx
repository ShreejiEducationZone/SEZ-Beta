import React, { useState, useMemo } from 'react';
import { Student, SyllabusNode } from '../../types';
import { useData } from '../../context/DataContext';
import { useWorkPool } from '../../context/WorkPoolContext';
import { useAttendance } from '../../context/AttendanceContext';
import { ParentPage } from '../ParentsPortal';
import PlaceholderAvatar from '../PlaceholderAvatar';
import { BsArrowUpRight } from 'react-icons/bs';
import { FaSun, FaMoon, FaSignOutAlt, FaRobot } from 'react-icons/fa';
import { useSyllabus } from '../../context/SyllabusContext';

// Redesigned Dashboard Card
interface DashboardCardProps {
    title: string;
    tag: string;
    mainValue: React.ReactNode;
    subLabel: string;
    colorClass: string;
    tagColorClass: string;
    onClick: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, tag, mainValue, subLabel, colorClass, tagColorClass, onClick }) => (
    <div 
        onClick={onClick}
        className={`${colorClass} relative rounded-3xl p-5 cursor-pointer transition-transform duration-300 hover:scale-[1.02] flex flex-col justify-between overflow-hidden shadow-sm h-44 sm:h-48`}
    >
        {/* Top section: Tag and Arrow */}
        <div className="flex justify-between items-start z-10">
            <span className={`${tagColorClass} backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide`}>
                {tag}
            </span>
            <div className="bg-white/50 rounded-full p-2 shadow-sm flex-shrink-0">
                <BsArrowUpRight className="h-4 w-4 text-black" />
            </div>
        </div>

        {/* Bottom section: Main value and title */}
        <div className="z-10 text-left">
            <div className="text-4xl sm:text-5xl font-black text-slate-900/80 leading-none">
                {mainValue}
            </div>
            <p className="mt-1 font-semibold text-slate-900/70 text-xs">
                {subLabel}
            </p>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                {title}
            </h3>
        </div>
    </div>
);


interface PPDashboardProps {
    student: Student;
    onNavigate: (page: ParentPage) => void;
}

const PPDashboard: React.FC<PPDashboardProps> = ({ student, onNavigate }) => {
    const { logout, darkMode, setDarkMode } = useData();
    const { tests } = useWorkPool();
    const { attendanceRecords } = useAttendance();
    const { syllabusProgress, allStudentSubjects } = useSyllabus();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');

    const stats = useMemo(() => {
        const studentId = student.id;
        
        // Attendance
        const records = attendanceRecords.filter(r => r.studentId === studentId);
        const present = records.filter(r => r.status === 'Present').length;
        const total = records.filter(r => r.status === 'Present' || r.status === 'Absent' || r.status === 'Leave').length;
        const attendancePct = total > 0 ? Math.round((present / total) * 100) : 0;
        
        // Syllabus
        const studentSubjectsData = allStudentSubjects[student.id]?.subjects || [];
        let totalNodes = 0;
        if (studentSubjectsData) {
            const allNodesForStudent = new Set<string>();
            const addNodesToSet = (nodes: SyllabusNode[]) => {
                nodes.forEach(node => {
                    allNodesForStudent.add(String(node.no));
                    if (node.children) addNodesToSet(node.children);
                });
            };
            studentSubjectsData.forEach(subject => {
                if (subject.chapters) {
                    addNodesToSet(subject.chapters);
                }
            });
            totalNodes = allNodesForStudent.size;
        }
        const completedNodesCount = syllabusProgress.filter(p => p.studentId === student.id && p.isCompleted).length;
        const syllabusPercentage = totalNodes > 0 ? Math.round((completedNodesCount / totalNodes) * 100) : 0;

        // Tests
        const completedTests = tests.filter(t => t.studentId === studentId && t.status === 'Completed');
        let avgScore = 0;
        if (completedTests.length > 0) {
            const totalMarks = completedTests.reduce((sum, t) => sum + (t.totalMarks || 0), 0);
            const obtained = completedTests.reduce((sum, t) => sum + (t.marksObtained || 0), 0);
            avgScore = totalMarks > 0 ? Math.round((obtained / totalMarks) * 100) : 0;
        }

        return { attendancePct, avgScore, syllabusPercentage };
    }, [student.id, tests, attendanceRecords, allStudentSubjects, syllabusProgress]);

    const categories = ['All', 'Programming', 'Design'];
    
    return (
        <div className="space-y-8 pb-24">
             {/* Header Section */}
             <header className="flex justify-between items-center pt-2 pb-6">
                <button
                    onClick={() => setShowLogoutModal(true)}
                    className="w-12 h-12 rounded-full overflow-hidden bg-muted border-2 border-card shadow-sm hover:ring-2 hover:ring-primary transition-all"
                >
                    {student.avatarUrl ? (
                        <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                        <PlaceholderAvatar />
                    )}
                </button>
                
                <h1 className="text-lg sm:text-xl font-bold text-foreground absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                    Overview
                </h1>

                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="w-12 h-12 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-muted transition-all group"
                    aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {darkMode ? <FaSun className="h-5 w-5 text-yellow-500" /> : <FaMoon className="h-5 w-5 text-indigo-500" />}
                </button>
            </header>

            {/* Title & Categories */}
            <div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tight mb-6 leading-[1.1]">
                    Let's check<br/>
                    <span className="text-primary">{student.name.split(' ')[0]}'s progress</span>
                </h1>
                
                <div className="flex overflow-x-auto gap-2 w-full no-scrollbar pb-1">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`flex-shrink-0 px-5 py-2 rounded-full font-semibold text-sm transition-all duration-200 border ${
                                activeCategory === category
                                    ? 'bg-foreground text-background border-foreground shadow-md'
                                    : 'bg-transparent text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4">
                
                {/* Syllabus Progress */}
                <DashboardCard 
                    title="Syllabus"
                    tag="Progress"
                    mainValue={<>{stats.syllabusPercentage}<span className="text-2xl sm:text-3xl">%</span></>}
                    subLabel="Completed"
                    colorClass="bg-[#BDB2FF] text-slate-900"
                    tagColorClass="bg-purple-600/20 text-purple-900"
                    onClick={() => onNavigate('syllabus')}
                />

                {/* Attendance */}
                <DashboardCard 
                    title="Attendance"
                    tag="Record"
                    mainValue={<>{stats.attendancePct}<span className="text-2xl sm:text-3xl">%</span></>}
                    subLabel="Present"
                    colorClass="bg-[#8AE9A7] text-slate-900"
                    tagColorClass="bg-green-600/20 text-green-900"
                    onClick={() => onNavigate('attendance')}
                />

                {/* Overall Performance */}
                <DashboardCard 
                    title="Performance"
                    tag="Tests"
                    mainValue={<>{stats.avgScore}<span className="text-2xl sm:text-3xl">%</span></>}
                    subLabel="Average Score"
                    colorClass="bg-[#FFD972] text-slate-900"
                    tagColorClass="bg-yellow-600/20 text-yellow-900"
                    onClick={() => onNavigate('performance')}
                />

                {/* AI Assistant */}
                <DashboardCard 
                    title="AI Assistant"
                    tag="Support"
                    mainValue={<FaRobot className="text-slate-900/80 text-4xl sm:text-5xl" />}
                    subLabel="Ask a Question"
                    colorClass="bg-[#FFACE4] text-slate-900"
                    tagColorClass="bg-pink-600/20 text-pink-900"
                    onClick={() => onNavigate('ai-assistant')}
                />
            </div>

            {/* Logout Confirmation Modal */}
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
                                Are you sure you want to logout from <strong>{student.name}</strong>'s parent portal?
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
        </div>
    );
};

export default PPDashboard;