import React, { useState, useEffect, useRef } from 'react';
import { Student, CambridgeSubjectData, CambridgeSyllabusNode } from '../types';
import UploadIcon from './icons/UploadIcon';
import DownloadIcon from './icons/DownloadIcon';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';
import { useData } from '../context/DataContext';

const SyllabusNodeView: React.FC<{ node: CambridgeSyllabusNode; level: number }> = ({ node, level }) => {
    const [isExpanded, setIsExpanded] = useState(level < 2);
    const paddingLeft = `${level * 1.5}rem`;

    return (
        <div>
            <div
                style={{ paddingLeft }}
                className="flex items-center cursor-pointer py-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded group"
                onClick={() => node.children && setIsExpanded(!isExpanded)}
            >
                {node.children && (
                    <svg className={`h-4 w-4 mr-2 transition-transform flex-shrink-0 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                )}
                <span className="font-mono text-xs text-gray-500 mr-2 w-12 text-right flex-shrink-0">{node.no}.</span>
                <span className="font-medium text-sm">{node.name}</span>
            </div>
            {isExpanded && node.children && (
                <div>
                    {node.children.map(child => (
                        <SyllabusNodeView key={`${child.no}-${child.name}`} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

interface CambridgeSubjectManagerDrawerProps {
    student: Student | null;
    studentSubjects: CambridgeSubjectData[] | undefined;
    onSave: (studentId: string, subjects: CambridgeSubjectData[]) => void;
    onClose: () => void;
}

const CambridgeSubjectManagerDrawer: React.FC<CambridgeSubjectManagerDrawerProps> = ({ student, studentSubjects, onSave, onClose }) => {
    const { showToast } = useData();
    const [isEditMode, setIsEditMode] = useState(false);
    const [subjects, setSubjects] = useState<CambridgeSubjectData[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Deep copy to prevent mutation of original data
        setSubjects(studentSubjects ? JSON.parse(JSON.stringify(studentSubjects)) : []);
        setIsEditMode(false);
    }, [student, studentSubjects]);

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            try {
                const parsedSubjects = parseCSVToHierarchy(text);
                
                // --- NEW MERGE LOGIC ---
                setSubjects(prevSubjects => {
                    const newSubjectsState = prevSubjects ? JSON.parse(JSON.stringify(prevSubjects)) : [];

                    const mergeNodes = (existingNodes: CambridgeSyllabusNode[], newNodes: CambridgeSyllabusNode[]) => {
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
                            (s: CambridgeSubjectData) => s.subject.trim().toLowerCase() === newSubject.subject.trim().toLowerCase()
                        );

                        if (existingSubject) {
                            mergeNodes(existingSubject.chapters, newSubject.chapters);
                        } else {
                            newSubjectsState.push(newSubject);
                        }
                    });

                    return newSubjectsState;
                });
                // --- END MERGE LOGIC ---

                setIsEditMode(true);
                showToast(`Syllabus from ${file.name} has been merged. Press 'Save' to confirm.`, 'info');
            } catch (error: any) {
                showToast(`Error parsing CSV: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const handleSave = () => {
        if (student) {
            onSave(student.id, subjects);
            onClose();
        }
    };
    
    const handleCancel = () => {
        setSubjects(studentSubjects ? JSON.parse(JSON.stringify(studentSubjects)) : []);
        setIsEditMode(false);
    };

    const handleEnterManually = () => {
        setSubjects([{ subject: 'New Subject', chapters: [] }]);
        setIsEditMode(true);
    };

    // --- State Update Handlers ---
    const childLabels = ['Topic', 'Sub-topic', 'Mini-topic'];
    const generateNextNo = (parentNo: string | number, children: CambridgeSyllabusNode[] | undefined, level: number): string => {
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
    
    const addSubject = () => {
        setSubjects(prev => [...prev, { subject: 'New Subject', chapters: [] }]);
    };
    
    const deleteSubject = (sIdx: number) => {
        setSubjects(prev => prev.filter((_, i) => i !== sIdx));
    };
    
    const addChapter = (sIdx: number) => {
        setSubjects(current => {
            const newSubjects = JSON.parse(JSON.stringify(current));
            const chapters = newSubjects[sIdx].chapters;
            const existingNos = chapters.map((c: any) => parseInt(c.no, 10)).filter((n: number) => !isNaN(n));
            const maxNo = existingNos.length > 0 ? Math.max(...existingNos) : 0;
            chapters.push({ no: (maxNo + 1).toString(), name: '', children: [] });
            return newSubjects;
        });
    };
    
    const addChildNode = (path: number[]) => {
        setSubjects(current => {
            const newSubjects = JSON.parse(JSON.stringify(current));
            let parentNode: any = newSubjects[path[0]];
            for (let i = 1; i < path.length; i++) {
                parentNode = i === 1 ? parentNode.chapters[path[i]] : parentNode.children[path[i]];
            }
            if (!parentNode.children) parentNode.children = [];
            
            const level = path.length;
            const newNo = generateNextNo(parentNode.no, parentNode.children, level);
            
            const newNode: Partial<CambridgeSyllabusNode> = { no: newNo, name: '' };
            // A mini-topic is created under a sub-topic. Path to parent sub-topic has length 4.
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
            const newSubjects = JSON.parse(JSON.stringify(current));
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
            const newSubjects = JSON.parse(JSON.stringify(current));
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
    
    // --- Render Functions ---
    const renderEditableNode = (node: CambridgeSyllabusNode, path: number[]): React.ReactNode => {
        const level = path.length - 2;
        return (
            <div key={path.join('-')} className="ml-6 my-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                    <input value={node.no} onChange={e => handleNodeChange(path, 'no', e.target.value)} placeholder="No." className="w-24 p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600" />
                    <input value={node.name} onChange={e => handleNodeChange(path, 'name', e.target.value)} placeholder="Name" className="w-full p-2 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600" />
                    <button onClick={() => deleteNode(path)} title="Delete Item" className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0"><DeleteIcon /></button>
                </div>
                {node.children && node.children.map((child, index) => renderEditableNode(child, [...path, index]))}
                {level < 2 && <button onClick={() => addChildNode(path)} className="text-brand-blue font-semibold text-sm hover:underline mt-2">+ Add {childLabels[level + 1]}</button>}
            </div>
        );
    };

    const noSubjectsContent = () => (
        <div className="text-center py-16 px-4 bg-gray-50 dark:bg-dark-bg/30 rounded-lg">
            <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-300">No syllabus set for {student?.name}.</h4>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Get started by importing a CSV or entering data manually.</p>
            <div className="mt-6 flex justify-center flex-wrap gap-4">
                 <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 transition-colors dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700 dark:hover:bg-blue-900/80">
                    <UploadIcon className="h-5 w-5" /> Import CSV
                </button>
                 <button onClick={() => handleDownloadDemo(student?.name || 'student')} className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
                    <DownloadIcon className="h-5 w-5" /> Download Demo Format
                </button>
                <button onClick={handleEnterManually} className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
                    <EditIcon className="h-5 w-5" /> Enter Manually
                </button>
            </div>
        </div>
    );
    
    if (!student) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-end" onClick={onClose}>
            <div className="w-full max-w-2xl h-full bg-light-card dark:bg-dark-card shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                     <div className="flex justify-between items-start">
                        <div>
                             <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{student.name}'s Subjects</h2>
                             <p className="text-gray-500 dark:text-gray-400">{`Grade ${student.grade} • ${student.board}`}</p>
                        </div>
                        {!isEditMode && subjects.length > 0 && (
                            <div className="flex gap-2">
                                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 py-2 px-4 rounded-lg font-semibold bg-blue-100 text-blue-800 text-sm hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900">
                                    <UploadIcon className="h-4 w-4" /> Import CSV
                                </button>
                                <button onClick={() => exportToCSV(subjects, student.name)} className="flex items-center gap-2 py-2 px-4 rounded-lg font-semibold bg-gray-100 text-gray-800 text-sm hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                                    <DownloadIcon className="h-4 w-4" /> Export CSV
                                </button>
                                <button onClick={() => setIsEditMode(true)} className="flex items-center gap-2 py-2 px-4 rounded-lg font-semibold bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <EditIcon className="h-4 w-4" /> Edit
                                </button>
                            </div>
                        )}
                         <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileImport} className="hidden" />
                     </div>
                </header>
                <main className="flex-grow overflow-y-auto p-6 space-y-4">
                    {isEditMode ? (
                        <>
                        {subjects.map((subject, sIdx) => (
                            <div key={sIdx} className="bg-light-bg/50 dark:bg-dark-bg/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center mb-2">
                                    <input value={subject.subject} onChange={e => handleSubjectChange(sIdx, e.target.value)} placeholder="Subject Name" className="text-lg font-semibold w-full bg-transparent p-1 focus:outline-none border-b-2 border-gray-300 dark:border-gray-600 focus:border-brand-blue" />
                                    <button onClick={() => deleteSubject(sIdx)} title="Delete Subject" className="text-gray-400 hover:text-red-500 p-1 ml-2 flex-shrink-0"><DeleteIcon /></button>
                                </div>
                                {subject.chapters.map((chapter, cIdx) => renderEditableNode(chapter, [sIdx, cIdx]))}
                                <button onClick={() => addChapter(sIdx)} className="text-brand-blue font-semibold text-sm hover:underline mt-2">+ Add Chapter</button>
                            </div>
                        ))}
                         <button onClick={addSubject} className="w-full text-center mt-2 py-2 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300/50 dark:border-gray-600/50 transition-colors">+ Add Subject</button>
                        </>
                    ) : subjects.length > 0 ? (
                        subjects.map(subject => (
                            <div key={subject.subject} className="bg-light-bg/50 dark:bg-dark-bg/50 p-4 rounded-lg">
                                <h3 className="text-lg font-bold mb-2">{subject.subject}</h3>
                                {subject.chapters.map(chapter => (
                                    <SyllabusNodeView key={`${chapter.no}-${chapter.name}`} node={chapter} level={0} />
                                ))}
                            </div>
                        ))
                    ) : noSubjectsContent()}
                </main>
                 <footer className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                    {isEditMode ? (
                        <>
                            <button onClick={handleCancel} className="py-2 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 font-semibold">Cancel</button>
                            <button onClick={handleSave} className="h-10 px-4 rounded-md bg-brand-blue text-white font-semibold">Save Syllabus</button>
                        </>
                    ) : (
                        <button onClick={onClose} className="py-2 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 font-semibold">Close</button>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default CambridgeSubjectManagerDrawer;

// CSV Parsing and Export Logic
const LEVELS = ['Chapter', 'Topic', 'SubTopic', 'MiniTopic'];

function parseCSVToHierarchy(csvText: string): CambridgeSubjectData[] {
    const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const subjectIndex = headers.indexOf('Subject');
    if (subjectIndex === -1) throw new Error('CSV must have a "Subject" column.');

    const subjectsMap = new Map<string, CambridgeSubjectData>();

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const subjectName = values[subjectIndex];
        if (!subjectName) continue;

        if (!subjectsMap.has(subjectName)) {
            subjectsMap.set(subjectName, { subject: subjectName, chapters: [] });
        }
        const currentSubject = subjectsMap.get(subjectName)!;
        let parentCollection: CambridgeSyllabusNode[] = currentSubject.chapters;

        for (let levelIndex = 0; levelIndex < LEVELS.length; levelIndex++) {
            const level = LEVELS[levelIndex];
            const noIndex = headers.indexOf(`${level} No`);
            const nameIndex = headers.indexOf(`${level} Name`);

            if (noIndex === -1 || nameIndex === -1 || !values[noIndex] || !values[nameIndex]) break;

            const no = values[noIndex];
            const name = values[nameIndex];
            
            let node = parentCollection.find(item => item.no == no);
            if (!node) {
                const newNode: Partial<CambridgeSyllabusNode> = { no, name };
                if (levelIndex < LEVELS.length - 1) { // If it's not a MiniTopic, it can have children
                    newNode.children = [];
                }
                node = newNode as CambridgeSyllabusNode;
                parentCollection.push(node);
            }

            if (!node.children) break; // Stop descending if the node is terminal

            parentCollection = node.children;
        }
    }
    
    const cleanChildren = (node: CambridgeSyllabusNode) => {
        if (node.children) {
            if (node.children.length === 0) delete node.children;
            else node.children.forEach(cleanChildren);
        }
    };
    subjectsMap.forEach(subject => subject.chapters.forEach(cleanChildren));

    return Array.from(subjectsMap.values());
}


function exportToCSV(subjects: CambridgeSubjectData[], studentName: string) {
    const headers = ['Subject', ...LEVELS.flatMap(l => [`${l} No`, `${l} Name`])];
    const rows: string[][] = [];

    function flattenNode(node: CambridgeSyllabusNode, path: (string|number)[]) {
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

function handleDownloadDemo(studentName: string) {
    const headers = ["Subject", "Chapter No", "Chapter Name", "Topic No", "Topic Name", "SubTopic No", "SubTopic Name", "MiniTopic No", "MiniTopic Name"];
    const demoRows = [
        ['Biology (Cambridge IGCSE)', '1', 'Characteristics and Classification of Living Organisms', '1.1', 'Characteristics of Living Organisms', '1.1.1', 'Movement', '1.1.1.a', 'Locomotion in animals'],
        ['Biology (Cambridge IGCSE)', '1', 'Characteristics and Classification of Living Organisms', '1.1', 'Characteristics of Living Organisms', '1.1.1', 'Movement', '1.1.1.b', 'Tropisms in plants'],
        ['Biology (Cambridge IGCSE)', '1', 'Characteristics and Classification of Living Organisms', '1.1', 'Characteristics of Living Organisms', '1.1.2', 'Respiration', '1.1.2.a', 'Aerobic respiration'],
        ['Biology (Cambridge IGCSE)', '1', 'Characteristics and Classification of Living Organisms', '1.1', 'Characteristics of Living Organisms', '1.1.2', 'Respiration', '1.1.2.b', 'Anaerobic respiration'],
        ['Biology (Cambridge IGCSE)', '1', 'Characteristics and Classification of Living Organisms', '1.2', 'Classification of Living Organisms', '1.2.1', 'Five Kingdom Classification', '1.2.1.a', 'Monera'],
        ['Biology (Cambridge IGCSE)', '1', 'Characteristics and Classification of Living Organisms', '1.2', 'Classification of Living Organisms', '1.2.1', 'Five Kingdom Classification', '1.2.1.b', 'Protista'],
        ['Biology (Cambridge IGCSE)', '2', 'Cell Structure', '2.1', 'Cell Types', '2.1.1', 'Prokaryotic cells', '2.1.1.a', 'Structure'],
        ['Biology (Cambridge IGCSE)', '2', 'Cell Structure', '2.1', 'Cell Types', '2.1.1', 'Prokaryotic cells', '2.1.1.b', 'Functions'],
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