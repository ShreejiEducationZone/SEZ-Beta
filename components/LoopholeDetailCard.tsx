import React, { useState, useMemo } from 'react';
import { WorkItem, Doubt, Test } from '../types';
import { HiOutlineCollection } from 'react-icons/hi';
import { FaQuestionCircle, FaChevronDown, FaExclamationTriangle, FaArrowUp, FaVideo, FaClipboardCheck, FaArrowDown } from 'react-icons/fa';

interface LoopholeData {
    subject: string;
    chapterNo: string | number;
    chapterName: string;
    workItems: WorkItem[];
    doubts: Doubt[];
    tests: Test[];
    avgScore: number;
}

const LoopholeDetailCard: React.FC<{ data: LoopholeData }> = ({ data }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const improvementAnalysis = useMemo(() => {
        const completedTests = data.tests
            .filter(t => t.status === 'Completed' && t.marksObtained != null && t.totalMarks != null && t.totalMarks > 0)
            .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());

        const interventions = [
            ...data.workItems.filter(w => w.status === 'Completed').map(w => ({ type: 'work' as const, date: new Date(w.dueDate), item: w })),
            ...data.doubts.filter(d => d.status === 'Resolved' && d.resolvedAt).map(d => ({ type: 'doubt' as const, date: new Date(d.resolvedAt!), item: d }))
        ].sort((a, b) => a.date.getTime() - b.date.getTime());

        if (completedTests.length < 2 || interventions.length === 0) return null;

        const lastIntervention = interventions[interventions.length - 1];
        const turningPointDate = lastIntervention.date;

        const beforeTests = completedTests.filter(t => new Date(t.testDate) < turningPointDate);
        const afterTests = completedTests.filter(t => new Date(t.testDate) >= turningPointDate);

        if (beforeTests.length === 0 || afterTests.length === 0) return null;

        const calcAvg = (tests: Test[]) => {
            if (tests.length === 0) return 0;
            const totalScore = tests.reduce((sum, t) => sum + (t.marksObtained! / t.totalMarks!), 0);
            return Math.round((totalScore / tests.length) * 100);
        };

        const avgBefore = calcAvg(beforeTests);
        const avgAfter = calcAvg(afterTests);

        if (avgAfter > avgBefore + 5) { // Only show if improvement is more than 5%
            let interventionDetail: { text: string; icon: React.ElementType };
            if (lastIntervention.type === 'work') {
                const workItem = lastIntervention.item as WorkItem;
                const isVideo = workItem.links && workItem.links.some(l => l.includes('youtu'));
                interventionDetail = {
                    text: isVideo ? `Watched Video` : `Completed Task`,
                    icon: isVideo ? FaVideo : FaClipboardCheck
                };
            } else {
                interventionDetail = {
                    text: `Resolved Doubt`,
                    icon: FaQuestionCircle
                };
            }

            return { avgBefore, avgAfter, improvement: avgAfter - avgBefore, intervention: interventionDetail };
        }
        return null;
    }, [data]);

    const completedTestsWithTrend = useMemo(() => {
        const completedTests = data.tests
            .filter(t => t.status === 'Completed' && t.marksObtained != null && t.totalMarks != null && t.totalMarks > 0)
            .sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());
    
        return completedTests.map((test, index) => {
            const score = Math.round((test.marksObtained! / test.totalMarks!) * 100);
            let trend: 'up' | 'down' | null = null;
            if (index > 0) {
                const prevTest = completedTests[index - 1];
                const prevScore = Math.round((prevTest.marksObtained! / prevTest.totalMarks!) * 100);
                if (score > prevScore) {
                    trend = 'up';
                } else if (score < prevScore) {
                    trend = 'down';
                }
            }
            return { ...test, score, trend };
        });
    }, [data.tests]);


    const getScoreColorClass = (s: number, type: 'stroke' | 'text') => {
        if (s >= 80) return `${type}-success`;
        if (s >= 60) return `${type}-warning`;
        return `${type}-danger`;
    };

    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const scoreOffset = circumference - (data.avgScore / 100) * circumference;

    return (
        <div className="bg-card rounded-2xl shadow-soft border border-danger/50">
            <header className="p-4 md:p-6 border-b border-border">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div className="flex-grow">
                        <p className="text-sm font-semibold text-danger">FOCUS AREA IDENTIFIED</p>
                        <h3 className="text-2xl font-bold text-foreground">{data.subject} - Ch {data.chapterNo}: {data.chapterName}</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md">
                            This student has high activity (repeated work or doubts) in this chapter but is still scoring below average in tests.
                        </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center justify-end gap-4 w-full md:w-auto">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 bg-muted/50 p-2.5 rounded-xl w-44">
                                <div className="p-2 bg-info-muted rounded-lg"><HiOutlineCollection className="h-5 w-5 text-info-muted-foreground" /></div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{data.workItems.length}</p>
                                    <p className="text-xs text-muted-foreground -mt-1">Work Items</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-muted/50 p-2.5 rounded-xl w-44">
                                <div className="p-2 bg-warning-muted rounded-lg"><FaQuestionCircle className="h-5 w-5 text-warning-muted-foreground" /></div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{data.doubts.length}</p>
                                    <p className="text-xs text-muted-foreground -mt-1">Doubts</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 84 84">
                                <circle className="stroke-muted" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="42" cy="42" />
                                <circle
                                    className={getScoreColorClass(data.avgScore, 'stroke')}
                                    strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={scoreOffset}
                                    strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="42" cy="42"
                                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center justify-center">
                                <span className={`text-2xl font-bold ${getScoreColorClass(data.avgScore, 'text')}`}>{Math.round(data.avgScore)}%</span>
                                <span className="text-[10px] text-muted-foreground -mt-1">Avg Score</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {improvementAnalysis && (
                 <div className="p-4 md:p-6 border-b border-border bg-success-muted/50">
                    <h4 className="font-semibold text-success-muted-foreground flex items-center gap-2">
                        <FaArrowUp />
                        Improvement Detected
                    </h4>
                    <div className="mt-3 grid grid-cols-[1fr,auto,1fr] gap-4 items-center text-center">
                        <div>
                            <p className="text-xs text-muted-foreground">Before</p>
                            <p className="text-2xl font-bold text-danger">{improvementAnalysis.avgBefore}%</p>
                        </div>
                        <div className="flex flex-col items-center text-muted-foreground">
                             <div className="flex items-center gap-2 text-xs font-semibold bg-card px-3 py-1.5 rounded-full border border-border" title={improvementAnalysis.intervention.text}>
                                <improvementAnalysis.intervention.icon className="h-4 w-4" />
                                <span className="truncate">{improvementAnalysis.intervention.text}</span>
                             </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">After</p>
                            <p className="text-2xl font-bold text-success">{improvementAnalysis.avgAfter}%</p>
                        </div>
                    </div>
                 </div>
            )}
            
            <div className="p-4 md:p-6">
                <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center text-sm font-semibold text-primary">
                    <span>{isExpanded ? 'Hide Evidence' : 'Show Evidence'}</span>
                    <FaChevronDown className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {isExpanded && (
                <div className="px-4 md:px-6 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-6 border-t border-border pt-6">
                    <div className="space-y-3">
                        <h4 className="font-semibold text-foreground">Work Items ({data.workItems.length})</h4>
                        {data.workItems.length > 0 ? data.workItems.map(item => {
                            const isPending = item.status === 'Assign' || item.status === 'Pending';
                            return (
                                <div key={item.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                                    <div className="flex items-start gap-2">
                                        {isPending && <FaExclamationTriangle className="h-4 w-4 text-danger flex-shrink-0 mt-0.5" title="This work is pending." />}
                                        <p className="font-medium">{item.title}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Due: {item.dueDate} | Status: {item.status}</p>
                                </div>
                            );
                        }) : <p className="text-sm text-muted-foreground italic">No work items found.</p>}
                    </div>
                    <div className="space-y-3">
                        <h4 className="font-semibold text-foreground">Doubts ({data.doubts.length})</h4>
                         {data.doubts.length > 0 ? data.doubts.map(item => {
                            const isOpen = item.status === 'Open' || item.status === 'Tasked';
                            return (
                                <div key={item.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                                    <div className="flex items-start gap-2">
                                        {isOpen && <FaExclamationTriangle className="h-4 w-4 text-danger flex-shrink-0 mt-0.5" title="This doubt is open." />}
                                        <p className="font-medium whitespace-pre-wrap">{item.text}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">Logged: {item.createdAt} | Status: {item.status}</p>
                                </div>
                            );
                         }) : <p className="text-sm text-muted-foreground italic">No doubts found.</p>}
                    </div>
                    <div className="space-y-3">
                        <h4 className="font-semibold text-foreground">Test Scores ({completedTestsWithTrend.length})</h4>
                        {completedTestsWithTrend.length > 0 ? completedTestsWithTrend.map(item => (
                            <div key={item.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                                <p className="font-medium">{item.title}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <span>Date: {item.testDate} |</span>
                                    <span className={`font-bold ${getScoreColorClass(item.score, 'text')}`}>
                                        {item.marksObtained}/{item.totalMarks} ({item.score}%)
                                    </span>
                                    {item.trend === 'up' && <FaArrowUp className="h-3 w-3 text-success" title="Improved from previous test" />}
                                    {item.trend === 'down' && <FaArrowDown className="h-3 w-3 text-danger" title="Lower than previous test" />}
                                </div>
                            </div>
                        )) : <p className="text-sm text-muted-foreground italic">No completed tests found.</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoopholeDetailCard;