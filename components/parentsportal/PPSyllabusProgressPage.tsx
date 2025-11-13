import React, { useMemo, useState } from 'react';
import { Student, SyllabusNode } from '../../types';
import { useSyllabus } from '../../context/SyllabusContext';
import { ParentPage } from '../ParentsPortal';
import { FaChevronLeft, FaSignOutAlt, FaSun, FaMoon } from 'react-icons/fa';
import PlaceholderAvatar from '../PlaceholderAvatar';
import { useData } from '../../context/DataContext';

const CircularProgress: React.FC<{ percentage: number }> = ({ percentage }) => {
    const radius = 90;
    const stroke = 14;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-52 h-52">
            <svg height="100%" width="100%" viewBox="0 0 200 200" className="transform -rotate-90">
                <circle
                    className="text-muted/50"
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    className="text-primary"
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out' }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-foreground">{Math.round(percentage)}<span className="text-2xl">%</span></span>
                <span className="text-sm font-medium text-muted-foreground">Completed</span>
            </div>
        </div>
    );
};

const SubjectProgressItem: React.FC<{ subject: string, percentage: number, color: string }> = ({ subject, percentage, color }) => (
    <div className="bg-card p-4 rounded-xl border border-border">
        <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-foreground">{subject}</span>
            <span className="font-bold text-sm" style={{ color }}>{Math.round(percentage)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
        </div>
    </div>
);

const PPSyllabusProgressPage: React.FC<{ student: Student, onNavigate: (page: ParentPage) => void; }> = ({ student, onNavigate }) => {
    const { syllabusProgress, allStudentSubjects } = useSyllabus();
    const { logout, darkMode, setDarkMode } = useData();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    
    const subjectColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    const { overallPercentage, subjectAverages } = useMemo(() => {
        const studentSubjectsData = allStudentSubjects[student.id]?.subjects || [];

        const countAllNodes = (nodes: SyllabusNode[], nodeSet: Set<string>) => {
            nodes.forEach(node => {
                nodeSet.add(String(node.no));
                if (node.children) countAllNodes(node.children, nodeSet);
            });
        };

        const allNodesForStudent = new Set<string>();
        studentSubjectsData.forEach(subject => {
            if (subject.chapters) countAllNodes(subject.chapters, allNodesForStudent);
        });
        const totalNodesOverall = allNodesForStudent.size;

        const completedNodes = syllabusProgress.filter(p => p.studentId === student.id && p.isCompleted);
        const overallPercentage = totalNodesOverall > 0 ? (completedNodes.length / totalNodesOverall) * 100 : 0;

        const subjectAverages = studentSubjectsData.map((subject, index) => {
            const subjectNodes = new Set<string>();
            if (subject.chapters) {
                countAllNodes(subject.chapters, subjectNodes);
            }
            const total = subjectNodes.size;
            
            const completedForSubject = completedNodes.filter(p => p.subject === subject.subject).length;
            const percentage = total > 0 ? (completedForSubject / total) * 100 : 0;
            
            return { subject: subject.subject, percentage, color: subjectColors[index % subjectColors.length] };
        });

        return { overallPercentage, subjectAverages };
    }, [student.id, allStudentSubjects, syllabusProgress]);

    return (
        <div className="space-y-6 pb-20">
            <header className="flex justify-between items-center pt-2 pb-6">
                <div className="w-12">
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="w-12 h-12 rounded-full bg-muted/50 border border-border flex items-center justify-center hover:bg-muted transition-all group"
                    >
                        <FaChevronLeft className="h-5 w-5 text-foreground" />
                    </button>
                </div>
                
                <h1 className="text-lg sm:text-xl font-bold text-foreground absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                    Syllabus Progress
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
                    >
                        {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                    </button>
                </div>
            </header>
            
            <div className="flex flex-col items-center justify-center bg-card border border-border rounded-2xl p-6">
                <CircularProgress percentage={overallPercentage} />
                <h2 className="text-2xl font-bold mt-4 text-foreground">Overall Progress</h2>
                <p className="text-muted-foreground">Based on all subjects</p>
            </div>
            
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-foreground px-2">By Subject</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subjectAverages.map(item => (
                        <SubjectProgressItem key={item.subject} {...item} />
                    ))}
                </div>
                 {subjectAverages.length === 0 && (
                    <div className="text-center py-10 bg-card rounded-xl border border-border">
                        <p className="text-muted-foreground">No syllabus data available to show progress.</p>
                    </div>
                )}
            </div>

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
                                <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-2.5 rounded-xl font-semibold bg-muted text-muted-foreground hover:bg-border transition-colors">
                                    Cancel
                                </button>
                                <button onClick={logout} className="flex-1 py-2.5 rounded-xl font-semibold bg-danger text-danger-foreground hover:bg-danger/90 transition-colors">
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

export default PPSyllabusProgressPage;