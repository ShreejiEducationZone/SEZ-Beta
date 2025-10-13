import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Test, TestPriority, TestStatus, WorkItem } from '../types';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';
import WrenchScrewdriverIcon from './icons/WrenchScrewdriverIcon';
import TestIcon from './icons/TestIcon';
import ConvertToTaskIcon from './icons/ConvertToTaskIcon';
import DotsVerticalIcon from './icons/DotsVerticalIcon';

interface TestManagementSectionProps {
    tests: Test[];
    workItems: WorkItem[];
    onTestSelect: (test: Test) => void;
    onEditTest: (test: Test) => void;
    onDeleteTest: (testId: string) => void;
    onAddMarking: (test: Test) => void;
    onAssignTestAsWork: (test: Test) => void;
}

const PRIORITY_STYLES: Record<TestPriority, string> = {
    High: 'bg-danger-muted text-danger-muted-foreground',
    Medium: 'bg-warning-muted text-warning-muted-foreground',
    Low: 'bg-info-muted text-info-muted-foreground',
};

const TestRow: React.FC<{ test: Test; isAssigned: boolean; onSelect: () => void; onEdit: () => void; onDelete: () => void; onAssignTestAsWork: () => void; onAddMarking?: () => void; }> = ({ test, isAssigned, onSelect, onEdit, onDelete, onAddMarking, onAssignTestAsWork }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const score = (test.marksObtained != null && test.totalMarks != null && test.totalMarks > 0)
        ? Math.round((test.marksObtained / test.totalMarks) * 100)
        : null;

    const getScoreColor = (s: number | null) => {
        if (s === null) return 'text-muted-foreground';
        if (s >= 80) return 'text-success font-bold';
        if (s >= 60) return 'text-warning font-bold';
        return 'text-danger font-bold';
    };

    return (
        <tr className="border-b border-border last:border-b-0 hover:bg-muted/50 cursor-pointer" onClick={onSelect}>
            <td className="px-4 py-3 font-medium text-foreground">{new Date(test.testDate.replace(/-/g, '/')).toLocaleDateString('en-CA')}</td>
            <td className="px-4 py-3">{test.title}</td>
            <td className="px-4 py-3 text-muted-foreground">{test.subject}</td>
            <td className="px-4 py-3">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_STYLES[test.priority]}`}>{test.priority}</span>
            </td>
            {onAddMarking === undefined && ( // Only show score column for completed tests
                <td className={`px-4 py-3 ${getScoreColor(score)}`}>
                    {test.status === 'Absent' ? 'Absent' : score !== null ? `${score}%` : 'N/A'}
                </td>
            )}
            <td className="px-4 py-3 text-right">
                <div className="relative" ref={menuRef} onClick={e => e.stopPropagation()}>
                    <button
                        onClick={() => setIsMenuOpen(prev => !prev)}
                        className="p-2 rounded-full text-muted-foreground hover:bg-muted"
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen}
                        aria-label="Test options"
                    >
                        <DotsVerticalIcon className="h-5 w-5" />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-soft-lg border border-border z-10 py-1.5">
                            {onAddMarking && (
                                <button
                                    onClick={() => { onAddMarking(); setIsMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted"
                                >
                                    <EditIcon className="h-4 w-4 text-success" /> Add Marking
                                </button>
                            )}
                            <button
                                onClick={() => { onAssignTestAsWork(); setIsMenuOpen(false); }}
                                disabled={isAssigned}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ConvertToTaskIcon className="h-4 w-4 text-accent" /> Assign
                            </button>
                            <button
                                onClick={() => { onEdit(); setIsMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted"
                            >
                                <WrenchScrewdriverIcon className="h-4 w-4 text-primary" /> Edit
                            </button>
                            <div className="h-px bg-border my-1.5"></div>
                            <button
                                onClick={() => { onDelete(); setIsMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-danger/10"
                            >
                                <DeleteIcon className="h-4 w-4" /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

const TestSchedule: React.FC<TestManagementSectionProps> = ({ tests, workItems, onTestSelect, onEditTest, onDeleteTest, onAddMarking, onAssignTestAsWork }) => {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'pending' | 'completed'>('upcoming');

    const { upcomingTests, pendingMarkingTests, completedTests } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming: Test[] = [];
        const pending: Test[] = [];
        const completed: Test[] = [];

        tests.forEach(test => {
            const testDate = new Date(test.testDate.replace(/-/g, '/'));
            if (test.status === 'Upcoming') {
                if (testDate >= today) {
                    upcoming.push(test);
                } else {
                    pending.push(test);
                }
            } else if (test.status === 'Completed' || test.status === 'Absent') {
                completed.push(test);
            }
        });

        upcoming.sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());
        pending.sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());
        completed.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());

        return { upcomingTests: upcoming, pendingMarkingTests: pending, completedTests: completed };
    }, [tests]);

    const tabs: { id: 'upcoming' | 'pending' | 'completed'; label: string; data: Test[] }[] = [
        { id: 'upcoming', label: 'Upcoming', data: upcomingTests },
        { id: 'pending', label: 'Marking Pending', data: pendingMarkingTests },
        { id: 'completed', label: 'Completed', data: completedTests },
    ];
    
    const testsToDisplay = tabs.find(t => t.id === activeTab)?.data || [];
    const tableHeaders = activeTab === 'completed' ? ['Date', 'Title', 'Subject', 'Priority', 'Score', ''] : ['Date', 'Title', 'Subject', 'Priority', ''];

    return (
        <div className="bg-card rounded-2xl shadow-soft border border-border flex flex-col">
            <header className="p-4 border-b border-border flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                 <h3 className="text-xl font-bold text-foreground">Test Management</h3>
                 <div className="flex bg-muted rounded-lg p-1 self-start sm:self-center">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === tab.id ? 'bg-background shadow-soft' : 'text-muted-foreground'}`}
                        >
                            {tab.label}
                            <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-border'}`}>{tab.data.length}</span>
                        </button>
                    ))}
                 </div>
            </header>
            
            <div className="h-[450px] overflow-auto thin-scrollbar">
                {testsToDisplay.length > 0 ? (
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm">
                             <tr className="border-b border-border">
                                {tableHeaders.map((header, index) => (
                                    <th key={header} scope="col" className={`px-4 py-3 font-semibold text-muted-foreground uppercase text-xs ${index === tableHeaders.length -1 ? 'text-right' : 'text-left'}`}>
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {testsToDisplay.map(test => {
                                const isAssigned = workItems.some(w => w.source === 'test' && w.linkedTestId === test.id);
                                return (
                                <TestRow 
                                    key={test.id}
                                    test={test}
                                    isAssigned={isAssigned}
                                    onSelect={() => onTestSelect(test)}
                                    onEdit={() => onEditTest(test)}
                                    onDelete={() => onDeleteTest(test.id)}
                                    onAssignTestAsWork={() => onAssignTestAsWork(test)}
                                    onAddMarking={activeTab === 'pending' ? () => onAddMarking(test) : undefined}
                                />
                            )})}
                        </tbody>
                    </table>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                        <TestIcon className="h-12 w-12 mb-4 opacity-50" />
                        <h4 className="font-semibold text-lg text-foreground">No tests found</h4>
                        <p className="max-w-xs">There are no "{activeTab}" tests for this student.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestSchedule;