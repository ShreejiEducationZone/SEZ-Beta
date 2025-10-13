import React, { useState, FC } from 'react';
import { SyllabusNode, SyllabusProgress, ProgressEntry } from '../types';
import Checkbox from './form/Checkbox';
import PlusIcon from './icons/PlusIcon';
import XIcon from './icons/XIcon';

interface MilestoneItemProps {
    node: SyllabusNode & { level: number };
    isCompleted: boolean;
    progress: SyllabusProgress | undefined;
    onToggle: (node: SyllabusNode) => void;
    onOpenNoteModal: (node: SyllabusNode & { level: number }) => void;
    onDeleteNote: (node: SyllabusNode, noteIndex: number) => void;
}

const MilestoneItem: FC<MilestoneItemProps> = ({ node, isCompleted, progress, onToggle, onOpenNoteModal, onDeleteNote }) => {
    const [showNotes, setShowNotes] = useState(false);
    const hasNotes = (progress?.entries?.length || 0) > 0;
    
    const levelLabels = ['Chapter', 'Topic', 'Sub-Topic', 'Mini-Topic', 'Mini-Topic'];

    return (
        <div className="relative pl-4" style={{ marginLeft: `${(node.level - 1) * 1.5}rem`}}>
            {/* Timeline Line (handled by parent) */}
            
            {/* Timeline Dot */}
            <div className={`absolute top-4 left-0 transform -translate-x-1/2 w-3 h-3 rounded-full border-2 border-card ${isCompleted ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>

            <div className={`pl-6 mb-4`}>
                <div 
                    onClick={() => hasNotes && setShowNotes(!showNotes)}
                    className={`relative p-3 rounded-lg border transition-colors duration-200 ${
                        isCompleted 
                        ? 'border-green-500/20 bg-green-500/10' 
                        : 'bg-background/60 border-border hover:bg-muted/60'
                    } ${hasNotes ? 'cursor-pointer' : ''}`}
                >
                    {hasNotes && (
                        <span 
                            className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-card z-10" 
                            title={`${progress?.entries?.length || 0} note(s)`}
                        >
                            {progress?.entries?.length || 0}
                        </span>
                    )}
                    <div className="flex justify-between items-start gap-4">
                        <div>
                             <p className="text-xs font-semibold text-muted-foreground">{levelLabels[node.level]}</p>
                             <p className={`font-semibold transition-colors ${isCompleted ? 'text-muted-foreground line-through opacity-70' : 'text-foreground'}`}>
                                {node.no}. {node.name}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 pt-2">
                            <button onClick={(e) => { e.stopPropagation(); onOpenNoteModal(node); }} className="p-1 text-muted-foreground hover:text-primary" title="Add Note">
                                <PlusIcon className="h-5 w-5" />
                            </button>
                           <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox checked={isCompleted} onChange={() => onToggle(node)} />
                           </div>
                        </div>
                    </div>
                     {(showNotes && hasNotes) && (
                        <div className="mt-3 pt-3 border-t border-border space-y-3">
                            {progress?.entries.slice().reverse().map((entry, idx) => {
                                const originalIndex = (progress.entries.length || 0) - 1 - idx;
                                return (
                                <div key={idx} className="group flex justify-between items-start gap-2 text-sm">
                                    <div>
                                        <p className="font-semibold text-muted-foreground text-xs">{new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        <p className="text-foreground whitespace-pre-wrap">{entry.note || <i className="opacity-70">No note added.</i>}</p>
                                    </div>
                                    {entry.note && (
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteNote(node, originalIndex); }} className="p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
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

export default MilestoneItem;