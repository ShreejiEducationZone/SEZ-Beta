import React, { useState, FC } from 'react';
import { SyllabusNode, SyllabusProgress } from '../../types';
import PlusIcon from '../icons/PlusIcon';
import XIcon from '../icons/XIcon';

interface SPMilestoneItemProps {
    node: SyllabusNode & { level: number };
    isCompleted: boolean;
    progress: SyllabusProgress | undefined;
    onToggle: (node: SyllabusNode, isCompleted: boolean) => void;
    onOpenNoteModal: (node: SyllabusNode & { level: number }) => void;
    onDeleteNote: (node: SyllabusNode, noteIndex: number) => void;
}

const SPMilestoneItem: FC<SPMilestoneItemProps> = ({ node, isCompleted, progress, onToggle, onOpenNoteModal, onDeleteNote }) => {
    const [showNotes, setShowNotes] = useState(false);
    const hasNotes = (progress?.entries?.length || 0) > 0;

    const levelStyles = [
        "font-bold text-lg",        // Chapter
        "font-semibold text-base",  // Topic
        "font-medium text-sm",      // Sub-Topic
        "font-normal text-sm"       // Mini-Topic
    ];
    
    return (
        <div className="relative pl-5" style={{ marginLeft: `${(node.level - 1) * 1.5}rem`}}>
            <div className={`absolute top-3.5 left-0 transform -translate-x-1/2 w-4 h-4 rounded-full border-4 border-card ${isCompleted ? 'bg-success' : 'bg-muted-foreground'}`}></div>

            <div className="pl-6 pb-6">
                <div 
                    onClick={() => hasNotes && setShowNotes(!showNotes)}
                    className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                        isCompleted 
                        ? 'border-success/30 bg-success/10' 
                        : 'bg-card border-border hover:border-primary/50'
                    } ${hasNotes ? 'cursor-pointer' : ''}`}
                >
                    {hasNotes && (
                        <span 
                            className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-card z-10" 
                            title={`${progress?.entries?.length || 0} note(s)`}
                        >
                            {progress?.entries?.length || 0}
                        </span>
                    )}
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-grow">
                             <p className={`${levelStyles[node.level - 1] || 'font-normal'} transition-colors ${isCompleted ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                {node.no}. {node.name}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 pt-1">
                            <button onClick={(e) => { e.stopPropagation(); onOpenNoteModal(node); }} className="p-1 text-muted-foreground hover:text-primary" title="Add Note">
                                <PlusIcon className="h-5 w-5" />
                            </button>
                           <div onClick={(e) => e.stopPropagation()}>
                                <input 
                                    type="checkbox"
                                    checked={isCompleted}
                                    onChange={(e) => onToggle(node, e.target.checked)}
                                    className="h-6 w-6 rounded-md border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                           </div>
                        </div>
                    </div>
                     {(showNotes && hasNotes) && (
                        <div className="mt-4 pt-4 border-t border-border space-y-3">
                            <h4 className="text-sm font-bold text-foreground">My Notes</h4>
                            {progress?.entries.slice().reverse().map((entry, idx) => {
                                const originalIndex = (progress.entries.length || 0) - 1 - idx;
                                const isCompletionNote = entry.note?.startsWith('Marked as ');
                                return (
                                <div key={idx} className={`group flex justify-between items-start gap-2 text-sm ${isCompletionNote ? 'opacity-60' : ''}`}>
                                    <div>
                                        <p className="font-semibold text-muted-foreground text-xs">{new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        <p className="text-card-foreground whitespace-pre-wrap">{entry.note || <i className="opacity-70">No note content.</i>}</p>
                                    </div>
                                    {!isCompletionNote && entry.note && (
                                        <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Are you sure you want to delete this note?')) onDeleteNote(node, originalIndex); }} className="p-1 text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity">
                                            <XIcon className="h-4 w-4"/>
                                        </button>
                                    )}
                                </div>
                            )})}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SPMilestoneItem;