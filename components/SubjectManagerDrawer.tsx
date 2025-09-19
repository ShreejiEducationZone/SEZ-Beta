import React, { useState, useEffect } from 'react';
import { Student, SubjectData, Chapter } from '../types';
import DeleteIcon from './icons/DeleteIcon';
import EditIcon from './icons/EditIcon';
import RobotIcon from './icons/RobotIcon';
import AiAssistantChat from './AiAssistantChat';

interface SubjectManagerDrawerProps {
    student: Student | null;
    studentSubjects: SubjectData[] | undefined;
    onSave: (studentId: string, subjects: SubjectData[]) => void;
    onClose: () => void;
}

const SubjectManagerDrawer: React.FC<SubjectManagerDrawerProps> = ({ student, studentSubjects, onSave, onClose }) => {
    if (!student) return null;

    const [isEditMode, setIsEditMode] = useState(false);
    const [subjects, setSubjects] = useState<SubjectData[]>([]);
    const [errors, setErrors] = useState<any>({});
    const [showAiChat, setShowAiChat] = useState(false);

    const isArchived = student.isArchived;

    // A safe way to deep-clone data to ensure it's a plain JavaScript object without Firestore's internal properties.
    const createCleanDataCopy = (sourceData: SubjectData[] | undefined): SubjectData[] => {
        if (!sourceData) return [];
        return sourceData.map(subject => ({
            subject: subject.subject,
            chapters: subject.chapters.map(chapter => ({
                no: chapter.no,
                name: chapter.name,
            })),
        }));
    };

    useEffect(() => {
        setSubjects(createCleanDataCopy(studentSubjects));
        setIsEditMode(false); // Always start in read-only mode
        setErrors({});
        setShowAiChat(false); // Ensure chat is closed when student changes
    }, [student, studentSubjects]);

    const handleApplyAiSubjects = (aiSubjects: SubjectData[]) => {
        setSubjects(prevSubjects => {
            // Create a deep, clean copy to avoid mutation issues
            const newSubjects = createCleanDataCopy(prevSubjects);

            aiSubjects.forEach(aiSubject => {
                // Find if the subject already exists (case-insensitive)
                const existingSubjectIndex = newSubjects.findIndex(
                    s => s.subject.trim().toLowerCase() === aiSubject.subject.trim().toLowerCase()
                );

                if (existingSubjectIndex !== -1) {
                    // Subject exists: merge chapters
                    const existingSubject = newSubjects[existingSubjectIndex];
                    
                    // Create sets for quick lookup of existing chapter numbers and names
                    const existingChapterNos = new Set(existingSubject.chapters.map(c => String(c.no).trim()));
                    const existingChapterNames = new Set(existingSubject.chapters.map(c => c.name.trim().toLowerCase()));

                    aiSubject.chapters.forEach(aiChapter => {
                        const chapterNo = String(aiChapter.no).trim();
                        const chapterName = aiChapter.name.trim().toLowerCase();
                        
                        // Add chapter only if its number AND name are new to avoid duplicates
                        if (!existingChapterNos.has(chapterNo) && !existingChapterNames.has(chapterName)) {
                            existingSubject.chapters.push({
                                no: aiChapter.no,
                                name: aiChapter.name.trim()
                            });
                        }
                    });
                    
                    // Sort chapters by number for consistency
                    existingSubject.chapters.sort((a, b) => {
                        const noA = Number(a.no);
                        const noB = Number(b.no);
                        if (!isNaN(noA) && !isNaN(noB)) {
                            return noA - noB;
                        }
                        // Fallback for non-numeric chapter "numbers"
                        return String(a.no).localeCompare(String(b.no));
                    });
                    
                } else {
                    // Subject is new: add it to the list
                    newSubjects.push(aiSubject);
                }
            });

            return newSubjects;
        });
        
        setIsEditMode(true);
        setShowAiChat(false);
    };

    const handleEnterManually = () => {
        setSubjects([{ subject: '', chapters: [{ no: '1', name: '' }] }]);
        setIsEditMode(true);
    };

    const handleSave = () => {
        const newErrors: any = {};
        const uniqueSubjects = new Set<string>();

        subjects.forEach((subject, sIdx) => {
            const subjectName = subject.subject.trim().toLowerCase();
            if (!subjectName) {
                if (!newErrors[sIdx]) newErrors[sIdx] = {};
                newErrors[sIdx].subject = 'Subject name cannot be empty.';
            } else if (uniqueSubjects.has(subjectName)) {
                if (!newErrors[sIdx]) newErrors[sIdx] = {};
                newErrors[sIdx].subject = 'Subject name must be unique.';
            }
            uniqueSubjects.add(subjectName);

            const uniqueChapterNos = new Set<string>();
            const uniqueChapterNames = new Set<string>();
            subject.chapters.forEach((chapter, cIdx) => {
                const chapterNo = String(chapter.no).trim();
                const chapterName = chapter.name.trim().toLowerCase();

                if (!chapterNo) {
                    if (!newErrors[sIdx]) newErrors[sIdx] = {};
                    if (!newErrors[sIdx].chapters) newErrors[sIdx].chapters = {};
                    newErrors[sIdx].chapters[cIdx] = { ...newErrors[sIdx].chapters?.[cIdx], no: 'No. is required.' };
                } else if (uniqueChapterNos.has(chapterNo)) {
                    if (!newErrors[sIdx]) newErrors[sIdx] = {};
                    if (!newErrors[sIdx].chapters) newErrors[sIdx].chapters = {};
                    newErrors[sIdx].chapters[cIdx] = { ...newErrors[sIdx].chapters?.[cIdx], no: 'No. must be unique.' };
                }
                uniqueChapterNos.add(chapterNo);

                if (!chapterName) {
                    if (!newErrors[sIdx]) newErrors[sIdx] = {};
                    if (!newErrors[sIdx].chapters) newErrors[sIdx].chapters = {};
                    newErrors[sIdx].chapters[cIdx] = { ...newErrors[sIdx].chapters?.[cIdx], name: 'Name is required.' };
                } else if (uniqueChapterNames.has(chapterName)) {
                    if (!newErrors[sIdx]) newErrors[sIdx] = {};
                    if (!newErrors[sIdx].chapters) newErrors[sIdx].chapters = {};
                    newErrors[sIdx].chapters[cIdx] = { ...newErrors[sIdx].chapters?.[cIdx], name: 'Name must be unique.' };
                }
                uniqueChapterNames.add(chapterName);
            });
        });

        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            onSave(student.id, subjects);
            setIsEditMode(false);
        }
    };
    
    const handleCancel = () => {
        setSubjects(createCleanDataCopy(studentSubjects));
        setIsEditMode(false);
        setErrors({});
    };

    // The following state updaters are written defensively to prevent circular reference errors.
    // They always start by creating a clean, deep copy of the state before applying changes.

    const handleInputChange = (sIdx: number, cIdx: number | null, field: keyof SubjectData | keyof Chapter, value: string) => {
        setSubjects(prevSubjects => {
            const newSubjects = createCleanDataCopy(prevSubjects); // Create a clean deep copy
            if (cIdx === null) {
                // Update a subject property (e.g., the name)
                (newSubjects[sIdx] as any)[field] = value;
            } else {
                // Update a chapter property
                (newSubjects[sIdx].chapters[cIdx] as any)[field] = value;
            }
            return newSubjects;
        });
    };
    
    const addSubject = () => {
        setSubjects(prevSubjects => {
            const newSubjects = createCleanDataCopy(prevSubjects);
            newSubjects.push({ subject: '', chapters: [] });
            return newSubjects;
        });
    };

    const deleteSubject = (sIdx: number) => {
        setSubjects(prevSubjects => {
            const newSubjects = createCleanDataCopy(prevSubjects);
            return newSubjects.filter((_, i) => i !== sIdx);
        });
    };
    
    const addChapter = (sIdx: number) => {
        setSubjects(prevSubjects => {
            const newSubjects = createCleanDataCopy(prevSubjects);
            newSubjects[sIdx].chapters.push({ no: '', name: '' });
            return newSubjects;
        });
    };
    
    const deleteChapter = (sIdx: number, cIdx: number) => {
        setSubjects(prevSubjects => {
            const newSubjects = createCleanDataCopy(prevSubjects);
            newSubjects[sIdx].chapters = newSubjects[sIdx].chapters.filter((_, chapterIndex) => chapterIndex !== cIdx);
            return newSubjects;
        });
    };
    
    // UI rendering functions remain below...

    const readOnlyContent = () => (
        <div className="space-y-6">
            {subjects.map((subject) => (
                <div key={subject.subject}>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{subject.subject || '(Untitled Subject)'}</h4>
                    <div className="mt-2 pl-2 space-y-2 border-l-2 border-gray-200 dark:border-gray-700">
                        {subject.chapters.map((chapter) => (
                            <div key={`${chapter.no}-${chapter.name}`} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 ml-2" title={chapter.name}>
                                <span className="w-8 pt-0.5 text-right font-mono text-sm text-gray-400 dark:text-gray-500">{chapter.no}.</span>
                                <span className="flex-1">{chapter.name}</span>
                            </div>
                        ))}
                        {subject.chapters.length === 0 && <p className="ml-4 text-sm text-gray-500 italic">No chapters added.</p>}
                    </div>
                </div>
            ))}
        </div>
    );

    const editContent = () => (
        <div className="space-y-4">
            {subjects.map((subject, sIdx) => (
                <div key={sIdx} className="bg-light-bg/50 dark:bg-dark-bg/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div>
                        <div className="flex items-center">
                            <input value={subject.subject} onChange={e => handleInputChange(sIdx, null, 'subject', e.target.value)} placeholder="Subject Name" className={`text-lg font-semibold w-full bg-transparent p-1 focus:outline-none border-b-2 ${errors[sIdx]?.subject ? 'border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-brand-blue dark:focus:border-brand-blue'}`}/>
                            <button onClick={() => deleteSubject(sIdx)} title="Delete Subject" className="text-gray-400 hover:text-red-500 p-1 ml-2"><DeleteIcon /></button>
                        </div>
                         {errors[sIdx]?.subject && <p className="text-red-500 text-xs mt-1">{errors[sIdx].subject}</p>}
                    </div>
                    
                    <div className="mt-3 pl-4 space-y-3">
                        {subject.chapters.map((chapter, cIdx) => (
                            <div key={cIdx}>
                                <div className="flex items-center space-x-2">
                                    <input value={chapter.no} onChange={e => handleInputChange(sIdx, cIdx, 'no', e.target.value)} placeholder="No." className={`w-16 p-2 rounded-md bg-white dark:bg-gray-800 border ${errors[sIdx]?.chapters?.[cIdx]?.no ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}/>
                                    <input value={chapter.name} onChange={e => handleInputChange(sIdx, cIdx, 'name', e.target.value)} placeholder="Chapter Name" className={`w-full p-2 rounded-md bg-white dark:bg-gray-800 border ${errors[sIdx]?.chapters?.[cIdx]?.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}/>
                                    <button onClick={() => deleteChapter(sIdx, cIdx)} title="Delete Chapter" className="text-gray-400 hover:text-red-500 p-1"><DeleteIcon /></button>
                                </div>
                                <div className="flex text-xs text-red-500 mt-1 space-x-4">
                                    {errors[sIdx]?.chapters?.[cIdx]?.no && <span className="w-16 text-center">{errors[sIdx].chapters[cIdx].no}</span>}
                                    {errors[sIdx]?.chapters?.[cIdx]?.name && <span className="ml-2 flex-1">{errors[sIdx].chapters[cIdx].name}</span>}
                                </div>
                            </div>
                        ))}
                        <button onClick={() => addChapter(sIdx)} className="text-brand-blue font-semibold text-sm hover:underline mt-2">+ Add Chapter</button>
                    </div>
                </div>
            ))}
            <button onClick={addSubject} className="w-full text-center mt-2 py-2 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300/50 dark:border-gray-600/50 transition-colors">+ Add Subject</button>
        </div>
    );
    
    const noSubjectsContent = () => (
        <div className="text-center py-16 px-4 bg-gray-50 dark:bg-dark-bg/30 rounded-lg">
            <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-300">No subjects set for {student.name}.</h4>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Get started by asking AI or entering them manually.</p>
            <div className="mt-6 flex justify-center gap-4">
                <button onClick={handleEnterManually} className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
                    <EditIcon className="h-5 w-5" /> Enter Manually
                </button>
            </div>
        </div>
    );

    const renderContent = () => {
        if (isArchived || (!isEditMode && subjects.length > 0)) return readOnlyContent();
        if (isEditMode) return editContent();
        return noSubjectsContent();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-end" onClick={onClose}>
            <div className="w-full max-w-2xl h-full bg-light-card dark:bg-dark-card shadow-2xl flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
                {isArchived && (
                    <div className="p-2 bg-yellow-400 text-center text-black text-sm font-semibold">
                        Read-only mode for archived student.
                    </div>
                )}
                <header className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                     <div className="flex justify-between items-start">
                        <div>
                             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{student.name}'s Subjects</h2>
                             <p className="text-gray-500 dark:text-gray-400">{`Grade ${student.grade} • ${student.board}`}</p>
                        </div>
                        {!isArchived && !isEditMode && subjects.length > 0 && (
                             <button onClick={() => setIsEditMode(true)} className="flex items-center py-2 px-4 rounded-lg font-semibold bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-600"><EditIcon className="mr-2 h-4 w-4" /> Edit</button>
                        )}
                     </div>
                </header>

                <main className="flex-grow overflow-y-auto p-6">
                    {renderContent()}
                </main>

                <footer className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        {/* AI Assistant button on the left */}
                        {!isArchived ? (
                            <button 
                                onClick={() => setShowAiChat(true)} 
                                className="flex items-center gap-2 bg-indigo-100 text-indigo-800 rounded-full px-4 py-2 hover:bg-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:hover:bg-indigo-500/30 transition-colors text-sm font-semibold"
                            >
                                <RobotIcon className="h-5 w-5" />
                                Chat with AI Assistant
                            </button>
                        ) : <div />}

                        {/* Existing buttons on the right */}
                        {isEditMode && !isArchived ? (
                             <div className="flex justify-end space-x-3">
                                <button onClick={handleCancel} className="py-2 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Cancel</button>
                                <button onClick={handleSave} className="h-10 px-4 rounded-md bg-brand-blue text-white hover:bg-blue-600 text-sm font-semibold">Save Changes</button>
                            </div>
                        ) : (
                            <div className="flex justify-end">
                                <button onClick={onClose} className="py-2 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Close</button>
                            </div>
                        )}
                    </div>
                </footer>

                {/* AI Chat Panel - slides up from the bottom */}
                {showAiChat && (
                    <AiAssistantChat 
                        student={student}
                        onApply={handleApplyAiSubjects}
                        onClose={() => setShowAiChat(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default SubjectManagerDrawer;