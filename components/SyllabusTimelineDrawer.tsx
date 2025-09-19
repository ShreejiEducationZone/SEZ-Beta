
import React, { useState, useMemo, FC } from 'react';
import { Student, SubjectData, ChapterProgress, ChapterProgressEntry } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import PlayIcon from './icons/PlayIcon';
import PinIcon from './icons/PinIcon';
import FlagIcon from './icons/FlagIcon';
import CalendarIcon from './icons/CalendarIcon';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';

// TimelineEntryForm component (kept in the same file for simplicity)
interface TimelineEntryFormProps {
    onSave: (date: string, note: string) => void;
    onCancel: () => void;
    entry?: ChapterProgressEntry;
}

const TimelineEntryForm: FC<TimelineEntryFormProps> = ({ onSave, onCancel, entry }) => {
    const [date, setDate] = useState(entry?.date || new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState(entry?.note || '');

    const handleSave = () => {
        if (date) {
            onSave(date, note);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 space-y-3">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)" rows={2} className="w-full p-2 rounded-md bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600" />
            <div className="flex justify-end space-x-2">
                <button onClick={onCancel} className="px-3 py-1 text-sm rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                <button onClick={handleSave} className="px-3 py-1 text-sm rounded bg-brand-blue text-white hover:bg-blue-600">Save</button>
            </div>
        </div>
    );
};


interface SyllabusTimelineDrawerProps {
    student: Student | null;
    studentSubjects: SubjectData[];
    chapterProgress: ChapterProgress[];
    onSave: (progress: ChapterProgress) => void;
    onClose: () => void;
}

const SyllabusTimelineDrawer: React.FC<SyllabusTimelineDrawerProps> = ({ student, studentSubjects, chapterProgress, onSave, onClose }) => {
    if (!student) return null;
    
    const [activeSubject, setActiveSubject] = useState<string>(studentSubjects[0]?.subject || '');
    const [editingEntry, setEditingEntry] = useState<{ chapterId: string, type: 'start' | 'milestone' | 'finish', entry?: ChapterProgressEntry } | null>(null);

    const handleSaveEntry = (chapterId: string, chapterName: string, chapterNo: string | number) => (date: string, note: string) => {
        const progressId = `${student.id}-${activeSubject}-${chapterNo}`;
        const existingProgress = chapterProgress.find(p => p.id === progressId) || {
            id: progressId, studentId: student.id, subject: activeSubject, chapterNo, chapterName, entries: []
        };
        
        let newEntries: ChapterProgressEntry[];

        if (editingEntry?.entry) { // Editing existing entry
            newEntries = existingProgress.entries.map(e => e.id === editingEntry.entry.id ? { ...e, date, note } : e);
        } else { // Adding new entry
            const newEntry: ChapterProgressEntry = { id: `e_${Date.now()}`, date, note, type: editingEntry!.type };
            newEntries = [...existingProgress.entries, newEntry];
        }

        // Sort entries by date
        newEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Create a clean, plain JavaScript object to send to Firestore.
        const progressToSave: ChapterProgress = {
            id: existingProgress.id,
            studentId: existingProgress.studentId,
            subject: existingProgress.subject,
            chapterNo: existingProgress.chapterNo,
            chapterName: chapterName, // Use chapterName from params to ensure it's up to date
            entries: newEntries,
        };
        
        onSave(progressToSave);
        setEditingEntry(null);
    };

    const handleDeleteEntry = (progress: ChapterProgress, entryId: string) => {
        const newEntries = progress.entries.filter(e => e.id !== entryId);
        
        // Create a clean, plain JavaScript object to send to Firestore.
        const progressToSave: ChapterProgress = {
            id: progress.id,
            studentId: progress.studentId,
            subject: progress.subject,
            chapterNo: progress.chapterNo,
            chapterName: progress.chapterName,
            entries: newEntries,
        };
        onSave(progressToSave);
    };
    
    const renderChapterTimeline = (chapter: { no: string | number; name: string }) => {
        const progress = chapterProgress.find(p => p.studentId === student.id && p.subject === activeSubject && p.chapterNo === chapter.no);
        const entries = progress?.entries || [];
        const status = entries.some(e => e.type === 'finish') ? 'Completed' : entries.length > 0 ? 'In Progress' : 'Not Started';

        const statusColors = {
            'Not Started': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
            'In Progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            'Completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        };

        const timelineIcons = {
            start: <PlayIcon className="h-6 w-6 text-green-500" />,
            milestone: <PinIcon className="h-6 w-6 text-purple-500" />,
            finish: <FlagIcon className="h-6 w-6 text-red-500" />,
        };

        const chapterId = `${student.id}-${activeSubject}-${chapter.no}`;

        return (
            <div key={chapter.no} className="bg-light-bg/50 dark:bg-dark-bg/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">{chapter.no}. {chapter.name}</h4>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[status]}`}>{status}</span>
                </div>

                 {editingEntry?.chapterId === chapterId && (
                    <div className="mb-4">
                        <TimelineEntryForm onSave={handleSaveEntry(chapterId, chapter.name, chapter.no)} onCancel={() => setEditingEntry(null)} entry={editingEntry.entry} />
                    </div>
                 )}

                {entries.length > 0 ? (
                    <div className="overflow-x-auto pb-3 -mb-3">
                        <div className="flex items-start space-x-8 min-w-max pr-4">
                            {entries.map((entry, index) => (
                                <React.Fragment key={entry.id}>
                                    <div className="flex flex-col items-center w-48 group relative">
                                        <div className="relative z-10 p-2 bg-white dark:bg-gray-700 rounded-full shadow">{timelineIcons[entry.type]}</div>
                                        <div className="mt-2 w-full">
                                            <p className="text-sm font-semibold flex items-center justify-center gap-1">
                                                <CalendarIcon className="h-4 w-4 text-gray-400" />{new Date(entry.date).toLocaleDateString('en-CA')}
                                            </p>
                                            {entry.note ? (
                                                <div className="mt-2 text-xs text-left text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md border border-gray-200 dark:border-gray-600/50">
                                                    {entry.note}
                                                </div>
                                            ) : (
                                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic text-center">No note</p>
                                            )}
                                        </div>
                                        <div className="absolute top-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-1 z-20">
                                            <button onClick={() => setEditingEntry({ chapterId, type: entry.type, entry })} className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"><EditIcon className="h-3 w-3 text-blue-500" /></button>
                                            <button onClick={() => handleDeleteEntry(progress!, entry.id)} className="p-1 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"><DeleteIcon className="h-3 w-3 text-red-500" /></button>
                                        </div>
                                    </div>
                                    {index < entries.length - 1 && <div className="flex-grow h-0.5 bg-gray-300 dark:bg-gray-600 mt-5 w-16"></div>}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 text-sm text-gray-500">No progress logged yet.</div>
                )}
                
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center space-x-2">
                    {status === 'Not Started' && <button onClick={() => setEditingEntry({ chapterId, type: 'start' })} className="px-3 py-1 text-sm rounded-full bg-green-500 text-white hover:bg-green-600">Start Chapter</button>}
                    {status === 'In Progress' && (
                        <>
                            <button onClick={() => setEditingEntry({ chapterId, type: 'milestone' })} className="px-3 py-1 text-sm rounded-full bg-purple-500 text-white hover:bg-purple-600">Add Milestone</button>
                            <button onClick={() => setEditingEntry({ chapterId, type: 'finish' })} className="px-3 py-1 text-sm rounded-full bg-red-500 text-white hover:bg-red-600">Finish Chapter</button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-end" onClick={onClose}>
            <div className="w-full max-w-3xl h-full bg-light-card dark:bg-dark-card shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{student.name}'s Timeline</h2>
                                <p className="text-gray-500 dark:text-gray-400">{`Grade ${student.grade} • ${student.board} • Batch ${student.batch}`}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-3xl font-light">&times;</button>
                     </div>
                     <div className="mt-4 border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto">
                            {studentSubjects.map(sub => (
                                <button
                                    key={sub.subject}
                                    onClick={() => setActiveSubject(sub.subject)}
                                    className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${activeSubject === sub.subject ? 'border-brand-blue text-brand-blue' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                >
                                    {sub.subject}
                                </button>
                            ))}
                        </nav>
                     </div>
                </header>

                <main className="flex-grow overflow-y-auto p-6 space-y-4">
                    {(studentSubjects.find(s => s.subject === activeSubject)?.chapters || []).map(renderChapterTimeline)}
                </main>
            </div>
        </div>
    );
};

export default SyllabusTimelineDrawer;
