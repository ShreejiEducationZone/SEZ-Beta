import React, { useMemo, useState, useEffect, FC, useCallback } from 'react';
import { useSyllabus } from '../context/SyllabusContext';
import { useWorkPool } from '../context/WorkPoolContext';
import { Student, WorkItem, Doubt, Test, SyllabusProgress, SyllabusNode } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import TimelineItem from './LoopholeDetailCard'; // Re-purposed to TimelineItem
import { MdTimeline } from 'react-icons/md';
import { FaClipboardList, FaQuestionCircle, FaAward } from 'react-icons/fa';
import ChevronDownIcon from './icons/ChevronDownIcon';


interface AnalyticsDetailViewProps {
    student: Student;
    onBack: () => void;
}

export type TimelineEvent = {
    date: Date;
    type: 'NODE_START' | 'NODE_COMPLETE' | 'WORK' | 'DOUBT' | 'TEST';
    data: WorkItem | Doubt | Test | { subject: string; chapterNo: string|number; chapterName: string; };
    chapterKey: string;
};

// This new component will render the timeline for a single chapter.
const ChapterTimeline: FC<{
    chapterInfo: { name: string; number: string|number; },
    events: TimelineEvent[],
    isExpanded: boolean,
    onToggle: () => void,
    isLast: boolean
}> = ({ chapterInfo, events, isExpanded, onToggle, isLast }) => {
    
    const eventsByDate = useMemo(() => {
        const map = new Map<string, TimelineEvent[]>();
        events.forEach(event => {
            // Using toLocaleDateString to avoid timezone issues with ISO strings
            const dateStr = event.date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
            if (!map.has(dateStr)) {
                map.set(dateStr, []);
            }
            map.get(dateStr)!.push(event);
        });
        // Sort dates chronologically before rendering
        return Array.from(map.entries()).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
    }, [events]);

    const summaryCounts = useMemo(() => {
        const counts = { work: 0, doubt: 0, test: 0 };
        events.forEach(event => {
            if (event.type === 'WORK') counts.work++;
            else if (event.type === 'DOUBT') counts.doubt++;
            else if (event.type === 'TEST') counts.test++;
        });
        return counts;
    }, [events]);

    return (
        <div className={!isLast ? "border-b border-border" : ""}>
            <button
                onClick={onToggle}
                className="w-full text-left p-4 sm:p-6 hover:bg-muted/50 transition-colors duration-200"
                aria-expanded={isExpanded}
                aria-controls={`timeline-${chapterInfo.number}`}
            >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                     <h2 className="text-lg sm:text-xl font-bold text-foreground">
                        Chapter {chapterInfo.number}: {chapterInfo.name}
                    </h2>
                    <div className="flex items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground flex-wrap">
                        {summaryCounts.work > 0 && (
                            <span className="flex items-center gap-1.5 font-medium">
                                <FaClipboardList className="text-primary/80" /> {summaryCounts.work} Work Task{summaryCounts.work > 1 ? 's' : ''}
                            </span>
                        )}
                        {summaryCounts.test > 0 && (
                            <span className="flex items-center gap-1.5 font-medium">
                                <FaAward className="text-accent/80" /> {summaryCounts.test} Test{summaryCounts.test > 1 ? 's' : ''}
                            </span>
                        )}
                        {summaryCounts.doubt > 0 && (
                            <span className="flex items-center gap-1.5 font-medium">
                                <FaQuestionCircle className="text-warning/80" /> {summaryCounts.doubt} Doubt{summaryCounts.doubt > 1 ? 's' : ''}
                            </span>
                        )}
                        <ChevronDownIcon className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
            </button>
            
            {isExpanded && (
                <div id={`timeline-${chapterInfo.number}`} className="thin-scrollbar overflow-x-auto overflow-y-visible pt-4 pb-8 bg-muted/30">
                    <div className="inline-flex items-start space-x-6 sm:space-x-12 relative pt-20 pb-4 min-w-full px-4 sm:px-6">
                        {/* The connecting timeline line */}
                        <div className="absolute top-24 left-0 h-0.5 bg-border w-full"></div>

                        {eventsByDate.map(([dateStr, dateEvents]) => (
                            <div key={dateStr} className="flex flex-col items-center flex-shrink-0 w-64 sm:w-72 z-10">
                                {/* Date Node on the timeline */}
                                <div className="bg-card px-3 py-1 rounded-full border-2 border-primary text-xs font-semibold text-primary">
                                    {new Date(dateStr.replace(/-/g, '/')).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                                </div>
                                
                                {/* Vertical Line from date node down to activities */}
                                <div className="h-4 w-0.5 bg-border mt-1"></div>

                                {/* Stack of activities for this date */}
                                <div className="space-y-2 w-full">
                                    {dateEvents.map((event, eventIndex) => (
                                        <TimelineItem key={`${event.type}-${(event.data as any).id || eventIndex}`} event={event} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const ActivityTimelineView: React.FC<AnalyticsDetailViewProps> = ({ student, onBack }) => {
    const { allStudentSubjects, syllabusProgress } = useSyllabus();
    const { workItems, doubts, tests } = useWorkPool();
    const studentSubjects = useMemo(() => allStudentSubjects[student.id]?.subjects || [], [allStudentSubjects, student.id]);
    const [activeSubject, setActiveSubject] = useState<string>('');
    const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

    const toggleChapterExpansion = (chapterKey: string) => {
        setExpandedChapter(prev => (prev === chapterKey ? null : chapterKey));
    };

    useEffect(() => {
        if (studentSubjects.length > 0 && !activeSubject) {
            setActiveSubject(studentSubjects[0].subject);
        }
    }, [studentSubjects, activeSubject]);

    const getChapterInfo = useCallback((chapterKey: string): { name: string; number: string | number } => {
        if (chapterKey.endsWith('__general')) {
            return { name: "General Activities", number: 'G' };
        }
        const [subject, chapterNo] = chapterKey.split('__');
        const subjectData = studentSubjects.find(s => s.subject === subject);
        if(!subjectData) return { name: "Unknown Chapter", number: '?'};

        const findNode = (nodes: SyllabusNode[]): SyllabusNode | undefined => {
            for (const node of nodes) {
                if (String(node.no) === chapterNo) return node;
                if (node.children) {
                    const found = findNode(node.children);
                    if (found) return found;
                }
            }
            return undefined;
         };
         const chapterNode = findNode(subjectData.chapters);
         return { name: chapterNode ? chapterNode.name : `Chapter ${chapterNo}`, number: chapterNode?.no || chapterNo };
    }, [studentSubjects]);


    const timelineDataByChapter = useMemo(() => {
        if (!activeSubject) return [];
        
        const events: TimelineEvent[] = [];

        const subjectSyllabusProgress = syllabusProgress.filter(p => p.studentId === student.id && p.subject === activeSubject);
        const subjectWorkItems = workItems.filter(w => w.studentId === student.id && w.subject === activeSubject);
        const subjectDoubts = doubts.filter(d => d.studentId === student.id && d.subject === activeSubject);
        const subjectTests = tests.filter(t => t.studentId === student.id && t.subject === activeSubject);

        subjectSyllabusProgress.forEach(p => {
            const subjectData = studentSubjects.find(s => s.subject === p.subject);
            if (!subjectData || !p.entries || p.entries.length === 0) return;

            let node: SyllabusNode | undefined;
            const findNode = (nodes: SyllabusNode[]): SyllabusNode | undefined => {
                for (const n of nodes) {
                    if (String(n.no) === String(p.nodeNo)) return n;
                    if (n.children) {
                        const found = findNode(n.children);
                        if (found) return found;
                    }
                }
                return undefined;
            };
            node = findNode(subjectData.chapters);
            if (!node) return;

            const rootChapter = subjectData.chapters.find(c => String(p.nodeNo).startsWith(String(c.no)));
            const chapterKey = `${p.subject}__${String(rootChapter?.no || 'general')}`;
            const nodeName = `${node.no}. ${node.name}`;
            const dataPayload = { subject: p.subject, chapterNo: p.nodeNo, chapterName: nodeName };

            const sortedEntries = [...p.entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            events.push({
                date: new Date(sortedEntries[0].date.replace(/-/g, '/')),
                type: 'NODE_START',
                data: dataPayload,
                chapterKey
            });

            if (p.isCompleted) {
                 events.push({
                    date: new Date(sortedEntries[sortedEntries.length - 1].date.replace(/-/g, '/')),
                    type: 'NODE_COMPLETE',
                    data: dataPayload,
                    chapterKey
                });
            }
        });

        subjectWorkItems.forEach(item => {
            events.push({ date: new Date(item.dateCreated.replace(/-/g, '/')), type: 'WORK', data: item, chapterKey: `${item.subject}__${item.chapterNo}` });
        });

        subjectDoubts.forEach(item => {
            events.push({ date: new Date(item.createdAt.replace(/-/g, '/')), type: 'DOUBT', data: item, chapterKey: `${item.subject}__${item.chapterNo || 'general'}` });
        });
        
        subjectTests.forEach(item => {
            item.chapters.forEach(c => {
                events.push({ date: new Date(item.testDate.replace(/-/g, '/')), type: 'TEST', data: item, chapterKey: `${item.subject}__${c.no}` });
            });
        });

        const groupedByChapter = new Map<string, TimelineEvent[]>();
        events.forEach(event => {
            if (!groupedByChapter.has(event.chapterKey)) {
                groupedByChapter.set(event.chapterKey, []);
            }
            groupedByChapter.get(event.chapterKey)!.push(event);
        });
        
        return Array.from(groupedByChapter.entries())
            .map(([chapterKey, chapterEvents]) => ({
                chapterKey,
                chapterInfo: getChapterInfo(chapterKey),
                events: chapterEvents.sort((a,b) => a.date.getTime() - b.date.getTime())
            }))
            .sort((a, b) => {
                if (!a.events[0] || !b.events[0]) return 0;
                return a.events[0].date.getTime() - b.events[0].date.getTime();
            });

    }, [student.id, activeSubject, syllabusProgress, workItems, doubts, tests, studentSubjects, getChapterInfo]);


    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4">
                <ChevronLeftIcon className="h-5 w-5" />
                Back to All Students
            </button>
             <div className="mb-8 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-foreground">{student.name}'s Activity Timeline</h2>
                    <p className="text-muted-foreground">{student.board} • Grade {student.grade}</p>
                </div>
            </div>

            <div className="border-b border-border mb-8">
                <nav className="-mb-px flex space-x-6 overflow-x-auto thin-scrollbar">
                    {studentSubjects.map(subject => (
                        <button
                            key={subject.subject}
                            onClick={() => setActiveSubject(subject.subject)}
                            className={`whitespace-nowrap pb-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeSubject === subject.subject ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        >
                            {subject.subject}
                        </button>
                    ))}
                </nav>
            </div>

            {timelineDataByChapter.length > 0 ? (
                <div className="bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
                   {timelineDataByChapter.map((chapterGroup, index) => (
                       <ChapterTimeline 
                           key={chapterGroup.chapterKey}
                           chapterInfo={chapterGroup.chapterInfo}
                           events={chapterGroup.events}
                           isExpanded={expandedChapter === chapterGroup.chapterKey}
                           onToggle={() => toggleChapterExpansion(chapterGroup.chapterKey)}
                           isLast={index === timelineDataByChapter.length - 1}
                        />
                   ))}
                </div>
            ) : (
                <div className="text-center py-20 text-muted-foreground bg-card rounded-2xl border border-border">
                    <MdTimeline className="h-16 w-16 mx-auto text-primary" />
                    <h3 className="mt-4 text-2xl font-bold text-foreground">No Activity to Display</h3>
                    <p className="mt-2 max-w-md mx-auto">There is no recorded activity for "{activeSubject}". Select another subject or check back later.</p>
                </div>
            )}
        </div>
    );
};

export default ActivityTimelineView;