import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useStudent } from '../context/StudentContext';
import SPDashboard from './studentportal/SPDashboard';
import SPWorkPoolPage from './studentportal/SPWorkPoolPage';
import SPTestsPage from './studentportal/SPTestsPage';
import SPDoubtBoxPage from './studentportal/SPDoubtBoxPage';
import SPSyllabusProgressPage from './studentportal/SPSyllabusProgressPage';
import SPAiAssistantPage from './studentportal/SPAiAssistantPage';
import SPVideoLibraryPage from './studentportal/SPVideoLibraryPage';
import SplashScreenLoader from './auth/SplashScreenLoader';
import SPBottomNav from './studentportal/SPBottomNav';


export type StudentPage = 'dashboard' | 'work-pool' | 'tests' | 'syllabus' | 'doubts' | 'videos' | 'ai-assistant';

const StudentPortal: React.FC = () => {
    // FIX: Use isAppReady from useData and isLoadingStudents from useStudent for loading state.
    const { currentUser, isAppReady } = useData();
    const { students, isLoadingStudents } = useStudent();
    const [currentPage, setCurrentPage] = useState<StudentPage>('dashboard');

    const student = useMemo(() => {
        if (!currentUser || !currentUser.studentId) return null;
        return students.find(s => s.id === currentUser.studentId);
    }, [currentUser, students]);

    // FIX: Check both isAppReady and isLoadingStudents before rendering.
    if (!isAppReady || isLoadingStudents || !student) {
        return <SplashScreenLoader />;
    }
    
    const renderContent = () => {
        switch (currentPage) {
            case 'dashboard': return <SPDashboard student={student} onNavigate={setCurrentPage} />;
            case 'work-pool': return <SPWorkPoolPage student={student} />;
            case 'tests': return <SPTestsPage student={student} />;
            case 'doubts': return <SPDoubtBoxPage student={student} />;
            case 'syllabus': return <SPSyllabusProgressPage student={student} />;
            case 'videos': return <SPVideoLibraryPage student={student} />;
            case 'ai-assistant': return <SPAiAssistantPage student={student} onBack={() => setCurrentPage('dashboard')} />;
            default: return <SPDashboard student={student} onNavigate={setCurrentPage} />;
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <main className="flex-grow pb-20 flex flex-col">
                <div className={`flex-grow ${currentPage === 'ai-assistant' ? '' : 'max-w-7xl mx-auto p-4 md:p-6 w-full'}`}>
                    {renderContent()}
                </div>
            </main>
            <SPBottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
        </div>
    );
};

export default StudentPortal;