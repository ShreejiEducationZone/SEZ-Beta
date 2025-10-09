import React from 'react';
import { Doubt, DoubtStatus, DoubtPriority } from '../../types';

const STATUS_STYLES: Record<DoubtStatus, string> = {
    Resolved: 'bg-success-muted text-success-muted-foreground',
    Open: 'bg-warning-muted text-warning-muted-foreground',
    Tasked: 'bg-accent-muted text-accent-muted-foreground',
};

const PRIORITY_STYLES: Record<DoubtPriority, string> = {
    High: 'bg-danger-muted text-danger-muted-foreground',
    Medium: 'bg-warning-muted text-warning-muted-foreground',
    Low: 'bg-info-muted text-info-muted-foreground',
};

const SPDoubtCard: React.FC<{ doubt: Doubt }> = ({ doubt }) => {
    return (
        <div className="bg-card rounded-2xl shadow-soft border border-border p-4 space-y-3">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <p className="font-semibold text-muted-foreground">{doubt.subject}</p>
                    <h4 className="font-bold text-foreground">
                        {doubt.chapterName ? `Ch ${doubt.chapterNo}: ${doubt.chapterName}` : 'General Question'}
                    </h4>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_STYLES[doubt.status]}`}>{doubt.status}</span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${PRIORITY_STYLES[doubt.priority]}`}>{doubt.priority}</span>
                </div>
            </div>
            
            <p className="text-sm text-card-foreground whitespace-pre-wrap pt-2 border-t border-border">
                {doubt.text}
            </p>
            
            <div className="text-xs text-muted-foreground pt-2 border-t border-border flex justify-between">
                <span>Logged: {new Date(doubt.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {doubt.resolvedAt && <span>Resolved: {new Date(doubt.resolvedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
            </div>
        </div>
    );
};

export default SPDoubtCard;