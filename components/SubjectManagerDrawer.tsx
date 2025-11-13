import React, { useState, useEffect, useRef } from 'react';
import { Student, SubjectData, SyllabusNode } from '../types';
import DeleteIcon from './icons/DeleteIcon';
import EditIcon from './icons/EditIcon';
import RobotIcon from './icons/RobotIcon';
import AiAssistantChat from './AiAssistantChat';
import UploadIcon from './icons/UploadIcon';
import DownloadIcon from './icons/DownloadIcon';
import { useData } from '../context/DataContext';
import ChevronDownIcon from './icons/ChevronDownIcon';
import CsvIcon from './icons/CsvIcon';
import JsonIcon from './icons/JsonIcon';


const SyllabusNodeView: React.FC<{ node: SyllabusNode; level: number }> = ({ node, level }) => {
    const [isExpanded, setIsExpanded] = useState(level < 2);
    const paddingLeft = `${level * 1.5}rem`;
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div>
            <div
                style={{ paddingLeft }}
                className={`flex items-center py-1 hover:bg-muted/50 rounded group ${hasChildren ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => hasChildren && setIsExpanded(!isExpanded)}
            >
                {hasChildren ? (
                    <svg className={`h-4 w-4 mr-2 transition-transform flex-shrink-0 text-muted-foreground group-hover:text-foreground ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                ) : (
                    <div className="w-4 h-4 mr-2 flex-shrink-0 flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full group-hover:bg-muted-foreground transition-colors"></div>
                    </div>
                )}
                <span className="font-mono text-xs text-muted-foreground mr-2 w-12 text-right flex-shrink-0">{node.no}.</span>
                <span className="font-medium text-sm text-foreground">{node.name}</span>
            </div>
            {isExpanded && hasChildren && (
                <div>
                    {node.children.map(child => (
                        <SyllabusNodeView key={`${child.no}-${child.name}`} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};


interface SubjectManagerDrawerProps {
    student: Student | null;
    studentSubjects: SubjectData[] | undefined;
    onSave: (studentId: string, subjects: SubjectData[]) => void;
    onClose: () => void;
}

const SubjectManagerDrawer: React.FC<SubjectManagerDrawerProps> = ({ student, studentSubjects, onSave, onClose }) => {
    const { showToast } = useData();
    if (!student) return null;

    const [isEditMode, setIsEditMode] = useState(false);
    const [subjects, setSubjects] = useState<SubjectData[]>([]);
    const [errors, setErrors] = useState<any>({});
    const [showAiChat, setShowAiChat] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const exportMenuRef = useRef<HTMLDivElement>(null);


    const isArchived = student.isArchived;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const createCleanDataCopy = (sourceData: SubjectData[] | undefined): SubjectData[] => {
        if (!sourceData) return [];
        return JSON.parse(JSON.stringify(sourceData));
    };

    useEffect(() => {
        setSubjects(createCleanDataCopy(studentSubjects));
        setIsEditMode(false); 
        setErrors({});
        setShowAiChat(false);
    }, [student, studentSubjects]);

    const handleApplyAiSubjects = (aiSubjects: SubjectData[]) => {
        setSubjects(prevSubjects => {
            const newSubjects = createCleanDataCopy(prevSubjects);
            aiSubjects.forEach(aiSubject => {
                const existingSubjectIndex = newSubjects.findIndex(
                    s => s.subject.trim().toLowerCase() === aiSubject.subject.trim().toLowerCase()
                );
                if (existingSubjectIndex !== -1) {
                    const existingSubject = newSubjects[existingSubjectIndex];
                    const existingChapterNos = new Set(existingSubject.chapters.map(c => String(c.no).trim()));
                    const existingChapterNames = new Set(existingSubject.chapters.map(c => c.name.trim().toLowerCase()));
                    aiSubject.chapters.forEach(aiChapter => {
                        const chapterNo = String(aiChapter.no).trim();
                        const chapterName = aiChapter.name.trim().toLowerCase();
                        if (!existingChapterNos.has(chapterNo) && !existingChapterNames.has(chapterName)) {
                            existingSubject.chapters.push({ no: aiChapter.no, name: aiChapter.name.trim() });
                        }
                    });
                    existingSubject.chapters.sort((a, b) => String(a.no).localeCompare(String(b.no), undefined, { numeric: true, sensitivity: 'base' }));
                } else {
                    newSubjects.push(aiSubject);
                }
            });
            return newSubjects;
        });
        setIsEditMode(true);
        setShowAiChat(false);
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            try {
                let parsedSubjects: SubjectData[];
                if (file.name.endsWith('.json')) {
                    const jsonData = JSON.parse(text);
                    if (!Array.isArray(jsonData) || (jsonData.length > 0 && (!jsonData[0].subject || !jsonData[0].chapters))) {
                        throw new Error('Invalid JSON format. Expected an array of subjects with chapters.');
                    }
                    parsedSubjects = jsonData;
                } else { // Assume CSV
                    parsedSubjects = parseCSVToHierarchy(text);
                }

                setSubjects(prevSubjects => {
                    const newSubjectsState = prevSubjects ? JSON.parse(JSON.stringify(prevSubjects)) : [];
                    const mergeNodes = (existingNodes: SyllabusNode[], newNodes: SyllabusNode[]) => {
                        newNodes.forEach(newNode => {
                            const existingNode = existingNodes.find(node => String(node.no).trim() === String(newNode.no).trim());
                            if (existingNode) {
                                if (newNode.children && newNode.children.length > 0) {
                                    if (!existingNode.children) existingNode.children = [];
                                    mergeNodes(existingNode.children, newNode.children);
                                }
                            } else {
                                existingNodes.push(newNode);
                            }
                        });
                        existingNodes.sort((a, b) => String(a.no).localeCompare(String(b.no), undefined, { numeric: true, sensitivity: 'base' }));
                    };
                    parsedSubjects.forEach(newSubject => {
                        const existingSubject = newSubjectsState.find(
                            (s: SubjectData) => s.subject.trim().toLowerCase() === newSubject.subject.trim().toLowerCase()
                        );
                        if (existingSubject) {
                            mergeNodes(existingSubject.chapters, newSubject.chapters);
                        } else {
                            newSubjectsState.push(newSubject);
                        }
                    });
                    return newSubjectsState;
                });
                setIsEditMode(true);
                showToast(`Syllabus from ${file.name} has been merged. Press 'Save' to confirm.`, 'info');
            } catch (error: any) {
                showToast(`Error parsing file: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleEnterManually = () => {
        setSubjects([{ subject: '', chapters: [{ no: '1', name: '' }] }]);
        setIsEditMode(true);
    };

    const handleSave = () => {
        onSave(student.id, subjects);
        setIsEditMode(false);
    };
    
    const handleCancel = () => {
        setSubjects(createCleanDataCopy(studentSubjects));
        setIsEditMode(false);
        setErrors({});
    };

    const childLabels = ['Topic', 'Sub-topic', 'Mini-topic'];
    const generateNextNo = (parentNo: string | number, children: SyllabusNode[] | undefined, level: number): string => {
        const childCount = children?.length || 0;
        // Parent level: Chapter=1, Topic=2, Sub-Topic=3. Adding a mini-topic if parent is sub-topic.
        if (level === 3) {
            return `${parentNo}.${String.fromCharCode(97 + childCount)}`;
        }
        return `${parentNo}.${childCount + 1}`;
    };

    const handleSubjectChange = (sIdx: number, value: string) => {
        setSubjects(current => current.map((sub, i) => i === sIdx ? { ...sub, subject: value } : sub));
    };
    const addSubject = () => setSubjects(prev => [...prev, { subject: 'New Subject', chapters: [] }]);
    const deleteSubject = (sIdx: number) => setSubjects(prev => prev.filter((_, i) => i !== sIdx));
    
    const addChapter = (sIdx: number) => {
        setSubjects(current => {
            const newSubjects = createCleanDataCopy(current);
            const chapters = newSubjects[sIdx].chapters;
            const existingNos = chapters.map((c: any) => parseInt(c.no, 10)).filter((n: number) => !isNaN(n));
            const maxNo = existingNos.length > 0 ? Math.max(...existingNos) : 0;
            chapters.push({ no: (maxNo + 1).toString(), name: '', children: [] });
            return newSubjects;
        });
    };
    
    const addChildNode = (path: number[]) => {
        setSubjects(current => {
            const newSubjects = createCleanDataCopy(current);
            let parentNode: any = newSubjects[path[0]];
            for (let i = 1; i < path.length; i++) {
                parentNode = i === 1 ? parentNode.chapters[path[i]] : parentNode.children[path[i]];
            }
            if (!parentNode.children) parentNode.children = [];
            
            const level = path.length; 
            const newNo = generateNextNo(parentNode.no, parentNode.children, level);
            
            const newNode: Partial<SyllabusNode> = { no: newNo, name: '' };
            // A mini-topic is created under a sub-topic.
            // Path to parent sub-topic is [s, c, t, st], length 4.
            // So, if path length is less than 4, the new node can have children.
            if (path.length < 4) {
                newNode.children = [];
            }
            
            parentNode.children.push(newNode);
            return newSubjects;
        });
    };

    const handleNodeChange = (path: (string | number)[], field: 'no' | 'name', value: string) => {
        setSubjects(current => {
            const newSubjects = createCleanDataCopy(current);
            let node: any = newSubjects[path[0] as number];
            for (let i = 1; i < path.length; i++) {
                node = i === 1 ? node.chapters[path[i] as number] : node.children[path[i] as number];
            }
            node[field] = value;
            return newSubjects;
        });
    };
    
    const deleteNode = (path: number[]) => {
        setSubjects(current => {
            const newSubjects = createCleanDataCopy(current);
            if (path.length === 2) {
                newSubjects[path[0]].chapters.splice(path[1], 1);
            } else {
                const parentPath = path.slice(0, -1);
                const childIndex = path[path.length - 1];
                let parentNode: any = newSubjects[parentPath[0]];
                for (let i = 1; i < parentPath.length; i++) {
                    parentNode = i === 1 ? parentNode.chapters[parentPath[i]] : parentNode.children[parentPath[i]];
                }
                parentNode.children.splice(childIndex, 1);
            }
            return newSubjects;
        });
    };
    
    const renderEditableNode = (node: SyllabusNode, path: number[]): React.ReactNode => {
        const level = path.length - 2;
        return (
            <div key={path.join('-')} className="ml-6 my-2 pl-4 border-l-2 border-border">
                <div className="flex items-center space-x-2">
                    <input value={node.no} onChange={e => handleNodeChange(path, 'no', e.target.value)} placeholder="No." className="w-24 p-2 rounded-lg bg-background border border-border" />
                    <input value={node.name} onChange={e => handleNodeChange(path, 'name', e.target.value)} placeholder="Name" className="w-full p-2 rounded-lg bg-background border border-border" />
                    <button onClick={() => deleteNode(path)} title="Delete Item" className="text-muted-foreground hover:text-red-500 p-1 flex-shrink-0"><DeleteIcon /></button>
                </div>
                {node.children && node.children.map((child, index) => renderEditableNode(child, [...path, index]))}
                {level < 2 && <button onClick={() => addChildNode(path)} className="text-primary font-semibold text-sm hover:underline mt-2">+ Add {childLabels[level + 1]}</button>}
            </div>
        );
    };

    const noSubjectsContent = () => (
        <div className="text-center py-16 px-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-lg text-foreground">No subjects set for {student.name}.</h4>
            <p className="text-muted-foreground mt-1">Get started by asking AI, importing a file, or entering them manually.</p>
            <div className="mt-6 flex justify-center flex-wrap gap-4">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                    <UploadIcon className="h-5 w-5" /> Import File
                </button>
                <button onClick={handleEnterManually} className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold bg-muted text-muted-foreground border border-border hover:bg-border transition-colors">
                    <EditIcon className="h-5 w-5" /> Enter Manually
                </button>
            </div>
             <div className="w-full max-w-md mx-auto border-t border-border mt-6 pt-4">
                <p className="text-sm text-muted-foreground mb-2">Download a template to get started:</p>
                <div className="flex justify-center gap-4">
                    <button onClick={() => handleDownloadDemoCSV(student?.name || 'student')} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-muted text-muted-foreground border border-border hover:bg-border transition-colors">
                         <CsvIcon className="h-5 w-5" /> Demo CSV
                    </button>
                    <button onClick={handleDownloadDemoJSON} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold bg-muted text-muted-foreground border border-border hover:bg-border transition-colors">
                         <JsonIcon className="h-5 w-5" /> Demo JSON
                    </button>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        if (isEditMode) {
             return <>
                {subjects.map((subject, sIdx) => (
                    <div key={sIdx} className="bg-muted/50 p-4 rounded-lg border border-border">
                        <div className="flex items-center mb-2">
                            <input value={subject.subject} onChange={e => handleSubjectChange(sIdx, e.target.value)} placeholder="Subject Name" className="text-lg font-semibold w-full bg-transparent p-1 focus:outline-none border-b-2 border-border focus:border-primary" />
                            <button onClick={() => deleteSubject(sIdx)} title="Delete Subject" className="text-muted-foreground hover:text-red-500 p-1 ml-2 flex-shrink-0"><DeleteIcon /></button>
                        </div>
                        {subject.chapters.map((chapter, cIdx) => renderEditableNode(chapter, [sIdx, cIdx]))}
                        <button onClick={() => addChapter(sIdx)} className="text-primary font-semibold text-sm hover:underline mt-2">+ Add Chapter</button>
                    </div>
                ))}
                 <button onClick={addSubject} className="w-full text-center mt-2 py-2 bg-muted/50 rounded-lg font-semibold hover:bg-muted border border-border/50 transition-colors">+ Add Subject</button>
            </>
        }
        if (subjects.length > 0) {
            return subjects.map(subject => (
                <div key={subject.subject} className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="text-lg font-bold mb-2 text-foreground">{subject.subject}</h3>
                    {subject.chapters.map(chapter => (
                        <SyllabusNodeView key={`${chapter.no}-${chapter.name}`} node={chapter} level={0} />
                    ))}
                </div>
            ));
        }
        return noSubjectsContent();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
            <div className="w-full md:max-w-2xl h-full bg-card/80 backdrop-blur-lg border-l border-border shadow-2xl flex flex-col md:rounded-l-2xl" onClick={e => e.stopPropagation()}>
                <input type="file" accept=".csv,.json" ref={fileInputRef} onChange={handleFileImport} className="hidden" />
                {isArchived && (
                    <div className="p-2 bg-yellow-400 text-center text-black text-sm font-semibold">
                        Read-only mode for archived student.
                    </div>
                )}
                <header className="p-6 border-b border-border flex-shrink-0">
                     <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <div>
                             <h2 className="text-2xl font-bold text-foreground">{student.name}'s Subjects</h2>
                             <p className="text-muted-foreground">{`Grade ${student.grade} • ${student.board}`}</p>
                        </div>
                        {!isArchived && !isEditMode && subjects.length > 0 && (
                            <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 py-2 px-3 rounded-lg font-semibold bg-primary/10 text-primary text-sm hover:bg-primary/20">
                                    <UploadIcon className="h-4 w-4" /> <span>Import</span>
                                </button>
                                <div className="relative" ref={exportMenuRef}>
                                    <button
                                        onClick={() => setIsExportMenuOpen(prev => !prev)}
                                        className="flex items-center gap-2 py-2 px-3 rounded-lg font-semibold bg-muted text-muted-foreground text-sm hover:bg-border"
                                    >
                                        <DownloadIcon className="h-4 w-4" /> <span>Export</span> <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isExportMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-soft-lg border border-border z-10 py-1">
                                            <button onClick={() => handleExportCSV(subjects, student.name, setIsExportMenuOpen)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted">
                                                <CsvIcon className="h-5 w-5 text-muted-foreground"/>
                                                Export as CSV
                                            </button>
                                            <button onClick={() => handleExportJSON(subjects, student.name, setIsExportMenuOpen)} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted">
                                                <JsonIcon className="h-5 w-5 text-muted-foreground"/>
                                                Export as JSON
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setIsEditMode(true)} className="flex items-center gap-2 py-2 px-3 rounded-lg font-semibold bg-background border border-border text-sm hover:bg-muted">
                                    <EditIcon className="h-4 w-4" /> <span>Edit</span>
                                </button>
                            </div>
                        )}
                     </div>
                </header>

                <main className="flex-grow overflow-y-auto p-6 space-y-4 thin-scrollbar">
                    {renderContent()}
                </main>

                <footer className="flex-shrink-0 p-6 border-t border-border">
                    <div className="flex justify-between items-center">
                        {!isArchived ? (
                            <button onClick={() => setShowAiChat(true)} className="flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 hover:bg-primary/20 transition-colors text-sm font-semibold">
                                <RobotIcon className="h-5 w-5" />
                                Chat with AI Assistant
                            </button>
                        ) : <div />}
                        {isEditMode && !isArchived ? (
                             <div className="flex justify-end space-x-3">
                                <button onClick={handleCancel} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold">Cancel</button>
                                <button onClick={handleSave} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold">Save Changes</button>
                            </div>
                        ) : (
                            <div className="flex justify-end">
                                <button onClick={onClose} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold">Close</button>
                            </div>
                        )}
                    </div>
                </footer>

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

// CSV Parsing and Export Logic
const LEVELS = ['Chapter', 'Topic', 'SubTopic', 'MiniTopic'];

function parseCSVToHierarchy(csvText: string): SubjectData[] {
    const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const subjectIndex = headers.indexOf('Subject');
    if (subjectIndex === -1) throw new Error('CSV must have a "Subject" column.');

    const subjectsMap = new Map<string, SubjectData>();

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const subjectName = values[subjectIndex];
        if (!subjectName) continue;

        if (!subjectsMap.has(subjectName)) {
            subjectsMap.set(subjectName, { subject: subjectName, chapters: [] });
        }
        const currentSubject = subjectsMap.get(subjectName)!;
        let parentCollection: SyllabusNode[] = currentSubject.chapters;

        for (let levelIndex = 0; levelIndex < LEVELS.length; levelIndex++) {
            const level = LEVELS[levelIndex];
            const noIndex = headers.indexOf(`${level} No`);
            const nameIndex = headers.indexOf(`${level} Name`);

            if (noIndex === -1 || nameIndex === -1 || !values[noIndex] || !values[nameIndex]) break;

            const no = values[noIndex];
            const name = values[nameIndex];
            
            let node = parentCollection.find(item => item.no == no);
            if (!node) {
                const newNode: Partial<SyllabusNode> = { no, name };
                if (levelIndex < LEVELS.length - 1) { // If it's not a MiniTopic, it can have children
                    newNode.children = [];
                }
                node = newNode as SyllabusNode;
                parentCollection.push(node);
            }
            
            if (!node.children) break; // Stop descending if the node is a terminal one (MiniTopic)
            
            parentCollection = node.children;
        }
    }
    
    const cleanChildren = (node: SyllabusNode) => {
        if (node.children) {
            if (node.children.length === 0) delete node.children;
            else node.children.forEach(cleanChildren);
        }
    };
    subjectsMap.forEach(subject => subject.chapters.forEach(cleanChildren));

    return Array.from(subjectsMap.values());
}


function handleExportCSV(subjects: SubjectData[], studentName: string, closeMenu: (val: boolean) => void) {
    closeMenu(false);
    const headers = ['Subject', ...LEVELS.flatMap(l => [`${l} No`, `${l} Name`])];
    const rows: string[][] = [];

    function flattenNode(node: SyllabusNode, path: (string|number)[]) {
        const newPath = [...path, node.no, node.name];
        if (!node.children || node.children.length === 0) {
            rows.push(newPath.map(String));
        } else {
            node.children.forEach(child => flattenNode(child, newPath));
        }
    }
    
    subjects.forEach(subject => {
        subject.chapters.forEach(chapter => {
            flattenNode(chapter, [subject.subject]);
        });
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => {
            const paddedRow = [...row];
            while(paddedRow.length < headers.length) paddedRow.push('');
            return paddedRow.map(val => `"${val.replace(/"/g, '""')}"`).join(',');
        })
    ].join('\n');

    const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `syllabus_${studentName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleExportJSON(subjects: SubjectData[], studentName: string, closeMenu: (val: boolean) => void) {
    closeMenu(false);
    const jsonContent = JSON.stringify(subjects, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8," });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `syllabus_${studentName.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleDownloadDemoCSV(studentName: string) {
    const headers = ["Subject", "Chapter No", "Chapter Name", "Topic No", "Topic Name", "SubTopic No", "SubTopic Name", "MiniTopic No", "MiniTopic Name"];
    const demoRows = [
        ['Biology (Cambridge IGCSE)', '1', 'Characteristics and Classification of Living Organisms', '1.1', 'Characteristics of Living Organisms', '1.1.1', 'Movement', '1.1.1.a', 'Locomotion in animals'],
        ['Biology (Cambridge IGCSE)', '1', 'Characteristics and Classification of Living Organisms', '1.1', 'Characteristics of Living Organisms', '1.1.1', 'Movement', '1.1.1.b', 'Tropisms in plants'],
    ];

    const csvContent = [
        headers.join(','),
        ...demoRows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `demo_syllabus_format.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleDownloadDemoJSON() {
    const demoJSON = [
      {
        "subject": "Physics",
        "chapters": [
          { "no": "1", "name": "Kinematics" },
          { 
            "no": "2", 
            "name": "Laws of Motion",
            "children": [
              { "no": "2.1", "name": "Newton's First Law" },
              { "no": "2.2", "name": "Newton's Second Law" }
            ]
          }
        ]
      },
       {
        "subject": "Chemistry",
        "chapters": [
          { "no": "1", "name": "Structure of Atom" }
        ]
      }
    ];
    const jsonContent = JSON.stringify(demoJSON, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8," });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `demo_syllabus_format.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}