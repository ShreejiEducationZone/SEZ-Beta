import React, { useMemo, useState } from 'react';
import { Student } from '../../types';
// FIX: Import useWorkPool hook
import { useWorkPool } from '../../context/WorkPoolContext';
import SPWorkItemCard from './SPWorkItemCard';
import { HiOutlineCollection } from 'react-icons/hi';

interface SPWorkPoolPageProps {
    student: Student;
}

const SPWorkPoolPage: React.FC<SPWorkPoolPageProps> = ({ student }) => {
    // FIX: Get work items from useWorkPool hook
    const { workItems } = useWorkPool();
    const [activeTab, setActiveTab] = useState<'Pending' | 'Completed'>('Pending');

    const studentWork = useMemo(() => {
        const myWork = workItems.filter(w => w.studentId === student.id);
        const pending = myWork.filter(w => w.status !== 'Completed').sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        const completed = myWork.filter(w => w.status === 'Completed').sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        return { pending, completed };
    }, [workItems, student.id]);

    const itemsToShow = activeTab === 'Pending' ? studentWork.pending : studentWork.completed;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">My Work Pool</h1>
            <p className="text-muted-foreground mb-6">Here's a list of all your assignments.</p>

            <div className="border-b border-border mb-6">
                <nav className="-mb-px flex space-x-6">
                    {(['Pending', 'Completed'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab} ({tab === 'Pending' ? studentWork.pending.length : studentWork.completed.length})
                        </button>
                    ))}
                </nav>
            </div>

            {itemsToShow.length > 0 ? (
                <div className="space-y-4">
                    {itemsToShow.map(item => <SPWorkItemCard key={item.id} item={item} />)}
                </div>
            ) : (
                <div className="text-center py-20 text-muted-foreground bg-muted/30 rounded-2xl flex flex-col items-center justify-center">
                    <HiOutlineCollection className="h-16 w-16 mb-4 opacity-50"/>
                    <h3 className="text-xl font-semibold">All Caught Up!</h3>
                    <p>You have no {activeTab.toLowerCase()} work items.</p>
                </div>
            )}
        </div>
    );
};

export default SPWorkPoolPage;