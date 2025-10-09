import React, { useMemo } from 'react';
import { Student } from '../../types';
import { useData } from '../../context/DataContext';
import { HiOutlineCollection } from 'react-icons/hi';
import { FaChartBar, FaQuestionCircle, FaChevronRight, FaVideo } from 'react-icons/fa';
import { StudentPage } from '../StudentPortal';
import PlaceholderAvatar from '../PlaceholderAvatar';
import RobotIcon from '../icons/RobotIcon';

const StatCard: React.FC<{ icon: React.ElementType; title: string; count: number; onClick: () => void; }> = ({ icon: Icon, title, count, onClick }) => (
    <div 
        onClick={onClick}
        className="group relative bg-card rounded-2xl shadow-soft border border-border p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1"
    >
        <div>
            <div className="p-2 bg-primary/10 rounded-lg w-fit">
                <Icon className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-4 text-4xl font-bold text-foreground">{count}</p>
            <h3 className="text-md font-semibold text-muted-foreground">{title}</h3>
        </div>
        <div className="absolute bottom-4 right-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <FaChevronRight className="h-5 w-5" />
        </div>
    </div>
);

const QuickAccessCard: React.FC<{ icon: React.ElementType; title: string; subtitle: string; onClick: () => void; }> = ({ icon: Icon, title, subtitle, onClick }) => (
    <button onClick={onClick} className="group w-full text-left bg-card rounded-2xl shadow-soft border border-border p-5 flex items-center gap-4 cursor-pointer transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1">
        <div className="p-3 bg-primary/10 rounded-xl">
            <Icon className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-grow">
            <h3 className="font-bold text-lg text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <FaChevronRight className="h-5 w-5" />
        </div>
    </button>
);


interface SPDashboardProps {
    student: Student;
    onNavigate: (page: StudentPage) => void;
}

const SPDashboard: React.FC<SPDashboardProps> = ({ student, onNavigate }) => {
    const { workItems, tests, doubts, logout } = useData();

    const studentData = useMemo(() => {
        const studentId = student.id;
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const allPendingWork = workItems.filter(w => w.studentId === studentId && w.status !== 'Completed');
        const allUpcomingTests = tests.filter(t => t.studentId === studentId && t.status === 'Upcoming' && new Date(t.testDate) >= today);
        const openDoubts = doubts.filter(d => d.studentId === studentId && d.status !== 'Resolved');

        const whatsNext = [
            ...allPendingWork.map(w => ({ type: 'work' as const, data: w, date: new Date(w.dueDate) })),
            ...allUpcomingTests.map(t => ({ type: 'test' as const, data: t, date: new Date(t.testDate) })),
        ].sort((a, b) => a.date.getTime() - b.date.getTime());

        return { 
            pendingWorkCount: allPendingWork.length,
            upcomingTestsCount: allUpcomingTests.length,
            openDoubtsCount: openDoubts.length,
            nextItem: whatsNext[0] || null
        };
    }, [student.id, workItems, tests, doubts]);
    
    return (
        <div className="space-y-8">
             <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground">Hello, {student.name.split(' ')[0]}!</h1>
                    <p className="text-muted-foreground">Let's have a productive day.</p>
                </div>
                <div className="w-14 h-14 rounded-full overflow-hidden bg-muted border-2 border-card shadow-md cursor-pointer" onClick={logout} title="Logout">
                    {student.avatarUrl ? (
                        <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                        <PlaceholderAvatar />
                    )}
                </div>
            </header>

            {studentData.nextItem && (
                 <div className="bg-gradient-to-br from-primary/80 to-accent/80 text-primary-foreground rounded-2xl shadow-soft-lg p-6">
                    <p className="font-semibold opacity-80 text-sm">WHAT'S NEXT</p>
                    <p className="text-2xl font-bold mt-2">{studentData.nextItem.data.title}</p>
                    <p className="opacity-90 mt-1">{studentData.nextItem.data.subject}</p>
                    <div className="mt-4 text-sm font-semibold py-2 px-4 bg-white/20 rounded-lg w-fit">
                       Due: {new Date(studentData.nextItem.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                    </div>
                </div>
            )}
           

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard icon={HiOutlineCollection} title="Pending Work" count={studentData.pendingWorkCount} onClick={() => onNavigate('work-pool')} />
                <StatCard icon={FaChartBar} title="Upcoming Tests" count={studentData.upcomingTestsCount} onClick={() => onNavigate('tests')} />
                <StatCard icon={FaQuestionCircle} title="Open Doubts" count={studentData.openDoubtsCount} onClick={() => onNavigate('doubts')} />
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4 text-foreground">Quick Access</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <QuickAccessCard 
                        icon={RobotIcon} 
                        title="AI Assistant"
                        subtitle="Ask questions about your progress"
                        onClick={() => onNavigate('ai-assistant')}
                    />
                     <QuickAccessCard 
                        icon={FaVideo} 
                        title="Video Library"
                        subtitle="Watch educational videos"
                        onClick={() => onNavigate('videos')}
                    />
                </div>
            </div>

        </div>
    );
};

export default SPDashboard;