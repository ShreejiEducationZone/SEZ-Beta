import React, { useMemo } from 'react';
import { Test, Student, TestPriority, TestStatus, SubjectData, SyllabusNode } from '../types';

interface TestDetailModalProps {
    test: Test;
    student: Student;
    studentSubjects: SubjectData[];
    onClose: () => void;
    onAddMarking: (test: Test) => void;
    onEdit: (test: Test) => void;
    onDelete: (testId: string) => void;
}

const PRIORITY_STYLES: Record<TestPriority, string> = {
    High: 'bg-danger-muted text-danger-muted-foreground',
    Medium: 'bg-warning-muted text-warning-muted-foreground',
    Low: 'bg-info-muted text-info-muted-foreground',
};

const STATUS_STYLES: Record<TestStatus, string> = {
    Completed: 'bg-success-muted text-success-muted-foreground',
    Upcoming: 'bg-info-muted text-info-muted-foreground',
    Absent: 'bg-muted text-muted-foreground',
};

const DetailRow: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
    <div className={className}>
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <div className="text-foreground mt-1">{children}</div>
    </div>
);


const TestDetailModal: React.FC<TestDetailModalProps> = ({ test, student, studentSubjects, onClose, onAddMarking, onEdit, onDelete }) => {
    
    const scorePercentage = (test.marksObtained != null && test.totalMarks != null && test.totalMarks > 0)
        ? Math.round((test.marksObtained / test.totalMarks) * 100)
        : null;
        
    const nodeMap = useMemo(() => {
        const map = new Map<string, string>();
        const subjectData = studentSubjects.find(s => s.subject === test.subject);
        if (!subjectData) return map;
        const recurse = (nodes: SyllabusNode[]) => {
            nodes.forEach(node => {
                map.set(String(node.no), node.name);
                if (node.children) recurse(node.children);
            });
        };
        recurse(subjectData.chapters);
        return map;
    }, [studentSubjects, test.subject]);

    const getAreasAsArray = (areas: string | string[] | undefined): string[] => {
        if (!areas) return [];
        if (Array.isArray(areas)) return areas;
        return [String(areas)];
    };
    
    const strongAreas = getAreasAsArray(test.strongArea);
    const weakAreas = getAreasAsArray(test.weakArea);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card/80 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto thin-scrollbar" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">{test.title}</h2>
                        <p className="text-muted-foreground">For {student.name}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-3xl font-light">&times;</button>
                </div>
                
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <DetailRow label="Subject"><p>{test.subject}</p></DetailRow>
                    <DetailRow label="Test Date"><p>{new Date(test.testDate.replace(/-/g, '/')).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p></DetailRow>
                    <DetailRow label="Status"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[test.status]}`}>{test.status}</span></DetailRow>
                    <DetailRow label="Priority"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_STYLES[test.priority]}`}>{test.priority}</span></DetailRow>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                    <DetailRow label="Syllabus / Chapters">
                        <ul className="list-disc list-inside space-y-1">
                            {test.chapters.map(c => <li key={`${c.no}-${c.name}`}>{c.name} (Ch. {c.no})</li>)}
                        </ul>
                    </DetailRow>
                </div>

                {test.status === 'Completed' && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4">
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2 text-center text-foreground">Performance Summary</h3>
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <DetailRow label="Score">
                                    <p className="text-xl font-bold">{test.marksObtained} / {test.totalMarks}</p>
                                </DetailRow>
                                <DetailRow label="Percentage">
                                    <p className="text-xl font-bold text-primary">{scorePercentage}%</p>
                                </DetailRow>
                                <DetailRow label="Test Type"><p>{test.testType || 'N/A'}</p></DetailRow>
                                <DetailRow label="Retest?"><p className={`font-bold ${test.retestRequired === 'Yes' ? 'text-danger' : 'text-success'}`}>{test.retestRequired || 'N/A'}</p></DetailRow>
                            </div>
                        </div>
                        
                        <DetailRow label="Mistake Analysis">
                            {test.mistakeTypes && test.mistakeTypes.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {test.mistakeTypes.map(type => <span key={type} className="px-2 py-1 text-xs font-medium rounded-full bg-warning-muted text-warning-muted-foreground">{type}</span>)}
                                </div>
                            ) : <p className="text-sm italic text-muted-foreground">No mistake types logged.</p>}
                        </DetailRow>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <DetailRow label="Strong Areas">
                                {strongAreas.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {strongAreas.map(areaNo => <span key={areaNo} className="px-2 py-1 text-xs font-medium rounded-full bg-success-muted text-success-muted-foreground">{nodeMap.get(areaNo) ? `${areaNo}. ${nodeMap.get(areaNo)}` : `Area #${areaNo}`}</span>)}
                                    </div>
                                ) : <p className="text-sm italic text-muted-foreground">No strong areas logged.</p>}
                            </DetailRow>
                             <DetailRow label="Weak Areas">
                                {weakAreas.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {weakAreas.map(areaNo => <span key={areaNo} className="px-2 py-1 text-xs font-medium rounded-full bg-danger-muted text-danger-muted-foreground">{nodeMap.get(areaNo) ? `${areaNo}. ${nodeMap.get(areaNo)}` : `Area #${areaNo}`}</span>)}
                                    </div>
                                ) : <p className="text-sm italic text-muted-foreground">No weak areas logged.</p>}
                            </DetailRow>
                        </div>
                    </div>
                )}
                
                <div className="mt-8 pt-6 border-t border-border flex justify-end items-center gap-3">
                    <button onClick={onClose} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold">
                        Close
                    </button>
                    <button onClick={() => onDelete(test.id)} className="h-10 px-4 rounded-lg bg-danger text-danger-foreground hover:bg-danger/90 text-sm font-semibold">
                        Delete
                    </button>
                     <button onClick={() => onEdit(test)} className="h-10 px-4 rounded-lg bg-muted text-muted-foreground hover:bg-border text-sm font-semibold">
                        Edit Test
                    </button>
                    {test.status === 'Upcoming' && (
                        <button onClick={() => onAddMarking(test)} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold">
                            + Add Marking
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestDetailModal;
