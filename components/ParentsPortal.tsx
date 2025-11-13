import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useStudent } from '../context/StudentContext';
import SplashScreenLoader from './auth/SplashScreenLoader';
import PPDashboard from './parentsportal/PPDashboard';
import PPBottomNav from './parentsportal/PPBottomNav';
import PPAttendancePage from './parentsportal/PPAttendancePage';
import PPPerformancePage from './parentsportal/PPPerformancePage';
import PPAiAssistantPage from './parentsportal/PPAiAssistantPage';
import PPSyllabusProgressPage from './parentsportal/PPSyllabusProgressPage';

export type ParentPage = 'dashboard' | 'attendance' | 'performance' | 'ai-assistant' | 'syllabus';

const ParentsPortal: React.FC = () => {
    const { currentUser, isAppReady } = useData();
    const { students, isLoadingStudents } = useStudent();
    const [currentPage, setCurrentPage] = useState<ParentPage>('dashboard');

    const student = useMemo(() => {
        if (!currentUser || !currentUser.studentId) return null;
        return students.find(s => s.id === currentUser.studentId);
    }, [currentUser, students]);

    if (!isAppReady || isLoadingStudents || !student) {
        return <SplashScreenLoader />;
    }
    
    const renderContent = () => {
        switch (currentPage) {
            case 'dashboard': return <PPDashboard student={student} onNavigate={setCurrentPage} />;
            case 'attendance': return <PPAttendancePage student={student} onNavigate={setCurrentPage} />;
            case 'performance': return <PPPerformancePage student={student} onNavigate={setCurrentPage} />;
            case 'syllabus': return <PPSyllabusProgressPage student={student} onNavigate={setCurrentPage} />;
            case 'ai-assistant': return <PPAiAssistantPage student={student} onBack={() => setCurrentPage('dashboard')} />;
            default: return <PPDashboard student={student} onNavigate={setCurrentPage} />;
        }
    };

    // Hide bottom nav on AI page for immersive experience
    const showNav = currentPage !== 'ai-assistant';

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className={`flex-grow flex flex-col ${showNav ? 'pb-20' : ''}`}>
                <div className={`max-w-5xl mx-auto ${currentPage === 'ai-assistant' ? 'p-0 h-[100dvh]' : 'p-4 md:p-6'} w-full flex-grow`}>
                    {renderContent()}
                </div>
            </main>
            {showNav && <PPBottomNav currentPage={currentPage} onNavigate={setCurrentPage} />}
        </div>
    );
};

export default ParentsPortal;