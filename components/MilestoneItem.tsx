import React, { useState, FC, useRef, useEffect } from 'react';
import { SyllabusNode, SyllabusProgress, ProgressEntry } from '../types';
import Checkbox from './form/Checkbox';
import PlusIcon from './icons/PlusIcon';
import XIcon from './icons/XIcon';
import DotsVerticalIcon from './icons/DotsVerticalIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import TestIcon from './icons/TestIcon';
import DoubtIcon from './icons/DoubtIcon';

interface MilestoneItemProps {
    node: SyllabusNode & { level: number };
    isCompleted: boolean;
    progress: SyllabusProgress | undefined;
    onToggle: (node: SyllabusNode) => void;
    onOpenNoteModal: (node: SyllabusNode & { level: number }) => void;
    onDeleteNote: (node: SyllabusNode, noteIndex: number) => void;
    // FIX: Update node type to include 'level' property.
    onAssignWork: (node: SyllabusNode & { level: number }) => void;
    // FIX: Update node type to include 'level' property for consistency.
    onScheduleTest: (node: SyllabusNode & { level: number }) => void;
    // FIX: Update node type to include 'level' property.
    onLogDoubt: (node: SyllabusNode & { level: number }) => void;
}

const MilestoneItem: FC<MilestoneItemProps> = ({ node, isCompleted, progress, onToggle, onOpenNoteModal, onDeleteNote, onAssignWork, onScheduleTest, onLogDoubt }) => {
    const [showNotes, setShowNotes] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const hasNotes = (progress?.entries?.length || 0) > 0;
    
    const levelLabels = ['Chapter', 'Topic', 'Sub-Topic', 'Mini-Topic'];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const actionMenu = (
        <div ref={menuRef} className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-1 text-muted-foreground hover:text-primary rounded-full hover:bg-primary/10" title="Actions">
                <DotsVerticalIcon className="h-5 w-5" />
            </button>
            {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-soft-lg border border-border z-10 py-1.5">
                    <button onClick={() => { onAssignWork(node); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted"><ClipboardListIcon className="h-4 w-4 text-primary" /> Assign Work</button>
                    <button onClick={() => { onScheduleTest(node); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted"><TestIcon className="h-4 w-4 text-accent" /> Schedule Test</button>
                    <button onClick={() => { onLogDoubt(node); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted"><DoubtIcon className="h-4 w-4 text-warning" /> Log a Doubt</button>
                    <div className="h-px bg-border my-1.5"></div>
                    <button onClick={() => { onOpenNoteModal(node); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted"><PlusIcon className="h-4 w-4 text-muted-foreground" /> Add Note</button>
                </div>
            )}
        </div>
    );

    return (
        <div className="relative pl-4" style={{ marginLeft: `${(node.level - 1) * 1.5}rem`}}>
            <div className={`absolute top-4 left-0 transform -translate-x-1/2 w-3 h-3 rounded-full border-2 border-card ${isCompleted ? 'bg-green-500' : 'bg-muted-foreground'}`}></div>
            <div className="pl-6 mb-4">
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
                             <p className="text-xs font-semibold text-muted-foreground">{levelLabels[node.level -1]}</p>
                             <p className={`font-semibold transition-colors ${isCompleted ? 'text-muted-foreground line-through opacity-70' : 'text-foreground'}`}>
                                {node.no}. {node.name}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 pt-2">
                            {actionMenu}
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
