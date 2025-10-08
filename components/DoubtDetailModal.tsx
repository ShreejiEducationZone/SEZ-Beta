

import React from 'react';
import { Doubt, Student, WorkItem, DoubtStatus, DoubtPriority } from '../types';

interface DoubtDetailModalProps {
    doubt: Doubt;
    student: Student;
    linkedWorkItem?: WorkItem;
    onClose: () => void;
}

const PRIORITY_STYLES: Record<DoubtPriority, string> = {
    High: 'bg-danger-muted text-danger-muted-foreground',
    Medium: 'bg-warning-muted text-warning-muted-foreground',
    Low: 'bg-info-muted text-info-muted-foreground',
};

const STATUS_STYLES: Record<DoubtStatus, string> = {
    Resolved: 'bg-success-muted text-success-muted-foreground',
    Open: 'bg-warning-muted text-warning-muted-foreground',
    Tasked: 'bg-accent-muted text-accent-muted-foreground',
};

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <div className="text-foreground">{children}</div>
    </div>
);

const DoubtDetailModal: React.FC<DoubtDetailModalProps> = ({ doubt, student, linkedWorkItem, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-card/80 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto thin-scrollbar" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Doubt Details</h2>
                        <p className="text-muted-foreground">For {student.name}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-3xl font-light">&times;</button>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                    <DetailRow label="Doubt">
                        <p className="whitespace-pre-wrap text-base">{doubt.text}</p>
                    </DetailRow>
                </div>

                <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <DetailRow label="Subject">
                        <p>{doubt.subject}</p>
                    </DetailRow>
                    <DetailRow label="Chapter">
                        <p>{doubt.chapterName ? `Ch ${doubt.chapterNo} - ${doubt.chapterName}` : 'N/A'}</p>
                    </DetailRow>
                </div>

                {doubt.topic && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <DetailRow label="Topic">
                            <p>{doubt.topic}</p>
                        </DetailRow>
                    </div>
                )}

                <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <DetailRow label="Status">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_STYLES[doubt.status]}`}>
                            {doubt.status}
                        </span>
                    </DetailRow>
                    <DetailRow label="Priority">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${PRIORITY_STYLES[doubt.priority]}`}>
                            {doubt.priority}
                        </span>
                    </DetailRow>
                     <DetailRow label="Origin">
                        <p>{doubt.origin}</p>
                    </DetailRow>
                </div>

                <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRow label="Logged At">
                        <p>{new Date(doubt.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </DetailRow>
                    {doubt.resolvedAt && (
                        <DetailRow label="Resolved At">
                            <p>{new Date(doubt.resolvedAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </DetailRow>
                    )}
                </div>

                {linkedWorkItem && (
                     <div className="mt-4 pt-4 border-t border-border">
                        <DetailRow label="Linked Task">
                            <div className="bg-muted p-3 rounded-md">
                                <p className="font-semibold">{linkedWorkItem.title}</p>
                                <p className="text-sm text-muted-foreground">Due: {new Date(linkedWorkItem.dueDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</p>
                            </div>
                        </DetailRow>
                    </div>
                )}
                
                 <div className="mt-8 flex justify-end">
                    <button onClick={onClose} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoubtDetailModal;