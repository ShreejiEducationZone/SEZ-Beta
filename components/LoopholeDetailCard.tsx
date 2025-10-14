import React from 'react';
import { WorkItem, Doubt, Test } from '../types';
import { FaPlayCircle, FaClipboardList, FaQuestionCircle, FaAward, FaCheckCircle, FaExclamationTriangle, FaFlag } from 'react-icons/fa';

// This is a re-purposed component. The prop name `event` is new, but the component name is kept for compatibility.
// It's treated as a TimelineEvent.
interface TimelineEvent {
    date: Date;
    type: 'NODE_START' | 'NODE_COMPLETE' | 'WORK' | 'DOUBT' | 'TEST';
    data: WorkItem | Doubt | Test | { subject: string; chapterNo: string|number; chapterName: string; };
    chapterKey: string;
}

const ICONS = {
    NODE_START: { icon: FaFlag, color: 'text-info' },
    NODE_COMPLETE: { icon: FaCheckCircle, color: 'text-success' },
    WORK: { icon: FaClipboardList, color: 'text-primary' },
    DOUBT: { icon: FaQuestionCircle, color: 'text-warning' },
    TEST: { icon: FaAward, color: 'text-accent' },
};

const Tooltip: React.FC<{ content: React.ReactNode, children: React.ReactNode }> = ({ content, children }) => (
    <div className="relative group w-full">
        {children}
        <div className="absolute bottom-full mb-2 w-max max-w-xs bg-foreground text-background text-xs rounded-lg py-1.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 shadow-lg">
            {content}
        </div>
    </div>
);


const TimelineItem: React.FC<{ event: TimelineEvent }> = ({ event }) => {
    const { icon: Icon, color } = ICONS[event.type];
    
    let title: string = '';
    let details: React.ReactNode = null;
    let statusIcon: React.ReactNode = null;
    
    switch(event.type) {
        case 'NODE_START':
            const startData = event.data as { chapterName: string };
            title = `${startData.chapterName} Started`;
            details = <p>Started progress on "{startData.chapterName}".</p>;
            break;
        case 'NODE_COMPLETE':
            const completeData = event.data as { chapterName: string };
            title = `${completeData.chapterName} Completed`;
            details = <p>Marked "{completeData.chapterName}" as completed.</p>;
            statusIcon = <FaCheckCircle className="h-4 w-4 text-success" title="Completed" />;
            break;
        case 'WORK':
            const work = event.data as WorkItem;
            title = work.title;
            details = (
                <div className="space-y-1 text-left">
                    <p><strong>Description:</strong> {work.description}</p>
                    <p><strong>Due:</strong> {work.dueDate}</p>
                    <p><strong>Status:</strong> {work.status}</p>
                </div>
            );
            if(work.status === 'Completed') {
                statusIcon = <FaCheckCircle className="h-4 w-4 text-success" title="Completed" />;
            } else if(work.status === 'Pending' || work.status === 'Assign') {
                statusIcon = <FaExclamationTriangle className="h-4 w-4 text-danger" title="Pending/Assigned" />;
            }
            break;
        case 'DOUBT':
            const doubt = event.data as Doubt;
            title = doubt.text;
            details = (
                <div className="space-y-1 text-left">
                    <p><strong>Priority:</strong> {doubt.priority}</p>
                    <p><strong>Status:</strong> {doubt.status}</p>
                    <p><strong>Origin:</strong> {doubt.origin}</p>
                </div>
            );
             if(doubt.status === 'Resolved') {
                statusIcon = <FaCheckCircle className="h-4 w-4 text-success" title="Resolved" />;
            } else {
                statusIcon = <FaExclamationTriangle className="h-4 w-4 text-warning" title="Open" />;
            }
            break;
        case 'TEST':
            const test = event.data as Test;
            title = test.title;
            details = (
                <div className="space-y-1 text-left">
                    <p><strong>Syllabus:</strong> {test.chapters.map(c => c.name).join(', ')}</p>
                    {test.status === 'Completed' && test.marksObtained != null && <p><strong>Score:</strong> {test.marksObtained}/{test.totalMarks}</p>}
                </div>
            );
             if(test.status === 'Completed') {
                statusIcon = <FaCheckCircle className="h-4 w-4 text-success" title="Completed" />;
            }
            break;
    }

    return (
        <Tooltip content={details}>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors w-full cursor-pointer">
                <Icon className={`h-5 w-5 ${color} flex-shrink-0`} />
                <div className="flex-grow min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{title}</p>
                </div>
                {statusIcon && <div className="flex-shrink-0">{statusIcon}</div>}
            </div>
        </Tooltip>
    );
};

// Renaming the component to match the file name for export.
const LoopholeDetailCard: React.FC<{ data?: any; event?: TimelineEvent }> = ({ data, event }) => {
    // This wrapper is to satisfy the export name of the file.
    // The real component is TimelineItem.
    if (event) {
        return <TimelineItem event={event} />;
    }
    // Fallback for any other use case (though it will be unused)
    return null;
};

export default LoopholeDetailCard;