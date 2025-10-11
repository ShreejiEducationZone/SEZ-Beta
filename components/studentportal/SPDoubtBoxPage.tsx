import React, { useMemo, useState } from 'react';
import { Student, Doubt } from '../../types';
// FIX: Import specific context hooks
import { useDoubtBox } from '../../context/DoubtBoxContext';
import { useSyllabus } from '../../context/SyllabusContext';
import { useWorkPool } from '../../context/WorkPoolContext';
import SPDoubtCard from './SPDoubtCard';
import DoubtForm from '../DoubtForm';
import PlusIcon from '../icons/PlusIcon';
import { FaQuestionCircle } from 'react-icons/fa';

interface SPDoubtBoxPageProps {
    student: Student;
}

const SPDoubtBoxPage: React.FC<SPDoubtBoxPageProps> = ({ student }) => {
    // FIX: Get data from specific context hooks
    const { doubts, handleSaveDoubt } = useDoubtBox();
    const { allStudentSubjects } = useSyllabus();
    const { workItems } = useWorkPool();
    const [activeTab, setActiveTab] = useState<'Open' | 'Resolved'>('Open');
    const [isFormOpen, setIsFormOpen] = useState(false);

    const studentSubjects = useMemo(() => {
        return allStudentSubjects[student.id]?.subjects || [];
    }, [allStudentSubjects, student.id]);

    const studentWorkItems = useMemo(() => {
        return workItems.filter(w => w.studentId === student.id);
    }, [workItems, student.id]);

    const studentDoubts = useMemo(() => {
        const myDoubts = doubts
            .filter(d => d.studentId === student.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        const open = myDoubts.filter(d => d.status === 'Open' || d.status === 'Tasked');
        const resolved = myDoubts.filter(d => d.status === 'Resolved');
        return { open, resolved };
    }, [doubts, student.id]);

    const handleSaveAndClose = async (doubtToSave: Doubt) => {
        await handleSaveDoubt(doubtToSave);
        setIsFormOpen(false);
    };

    const itemsToShow = activeTab === 'Open' ? studentDoubts.open : studentDoubts.resolved;

    return (
        <div className="relative h-full">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold">My Doubt Box</h1>
                    <p className="text-muted-foreground mt-1">Ask questions and track their status.</p>
                </div>
            </div>

            <div className="border-b border-border mb-6">
                <nav className="-mb-px flex space-x-6">
                    {(['Open', 'Resolved'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab} ({tab === 'Open' ? studentDoubts.open.length : studentDoubts.resolved.length})
                        </button>
                    ))}
                </nav>
            </div>

            {itemsToShow.length > 0 ? (
                <div className="space-y-4 pb-24">
                    {itemsToShow.map(item => <SPDoubtCard key={item.id} doubt={item} />)}
                </div>
            ) : (
                <div className="text-center py-20 text-muted-foreground bg-muted/30 rounded-2xl flex flex-col items-center justify-center">
                    <FaQuestionCircle className="h-16 w-16 mb-4 opacity-50"/>
                    <h3 className="text-xl font-semibold">No {activeTab.toLowerCase()} doubts here.</h3>
                    <p>{activeTab === 'Open' ? "Great job staying on top of things!" : "Ask a question using the button below."}</p>
                </div>
            )}
            
            <button 
                onClick={() => setIsFormOpen(true)}
                className="fixed bottom-24 right-6 h-16 w-16 rounded-full bg-primary text-primary-foreground shadow-soft-xl flex items-center justify-center transition-transform duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50 z-40"
                aria-label="Add new doubt"
            >
                <PlusIcon className="h-7 w-7" />
            </button>


            {isFormOpen && (
                <DoubtForm
                    student={student}
                    subjects={studentSubjects}
                    workItems={studentWorkItems}
                    onSave={handleSaveAndClose}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}
        </div>
    );
};

export default SPDoubtBoxPage;