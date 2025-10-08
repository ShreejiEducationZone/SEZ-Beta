import React, { useState, useMemo, FC } from 'react';
import { useData } from '../context/DataContext';
import { Student, VideoLink, SyllabusNode, WorkPriority, WorkItem } from '../types';
import { WORK_PRIORITIES } from '../constants';
import SelectField from './form/SelectField';
import InputField from './form/InputField';
import { FaTimes, FaYoutube } from 'react-icons/fa';

interface AssignVideoModalProps {
    info: {
        video: VideoLink;
        node: Partial<SyllabusNode>;
        subject: string;
    };
    onClose: () => void;
}

const AssignVideoModal: FC<AssignVideoModalProps> = ({ info, onClose }) => {
    const { students, handleSaveWorkItem, showToast } = useData();
    const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState<WorkPriority>('Medium');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const activeStudents = useMemo(() => students.filter(s => !s.isArchived), [students]);

    const filteredStudents = useMemo(() => {
        const selectedIds = new Set(selectedStudents.map(s => s.id));
        return activeStudents.filter(student => 
            !selectedIds.has(student.id) &&
            student.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [activeStudents, selectedStudents, searchQuery]);

    const addStudent = (student: Student) => {
        setSelectedStudents(prev => [...prev, student]);
        setSearchQuery('');
    };

    const removeStudent = (studentId: string) => {
        setSelectedStudents(prev => prev.filter(s => s.id !== studentId));
    };

    const handleAssign = async () => {
        if (selectedStudents.length === 0) {
            setError('Please select at least one student.');
            return;
        }
        if (!dueDate) {
            setError('Please set a due date.');
            return;
        }
        setError('');
        setIsSaving(true);
        
        const workPromises = selectedStudents.map(student => {
            const newWorkItem: WorkItem = {
                id: `w_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                studentId: student.id,
                title: `Watch: ${info.video.title}`,
                subject: info.subject,
                chapterNo: info.node.no || '',
                chapterName: info.node.name || 'General',
                topic: info.node.level > 1 ? info.node.name : undefined,
                description: `Please watch the assigned video: "${info.video.title}"`,
                dueDate: dueDate,
                status: 'Assign',
                priority: priority,
                links: [info.video.url],
                dateCreated: new Date().toISOString().split('T')[0],
                source: 'syllabus',
            };
            return handleSaveWorkItem(newWorkItem, false);
        });

        try {
            await Promise.all(workPromises);
            showToast(`Assigned video to ${selectedStudents.length} student(s).`, 'success');
            onClose();
        } catch (err) {
            showToast('Failed to assign video. Please try again.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card/90 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0">
                    <h3 className="text-xl font-bold text-foreground">Assign Video to Student(s)</h3>
                    <div className="flex items-center gap-3 mt-2 p-3 bg-muted/50 rounded-lg">
                        <FaYoutube className="h-5 w-5 text-red-500 flex-shrink-0" />
                        <p className="font-semibold truncate">{info.video.title}</p>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto space-y-4 mt-4 thin-scrollbar pr-2 -mr-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Select Students</label>
                        <div className="p-2 border border-border rounded-lg bg-background">
                            {selectedStudents.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {selectedStudents.map(student => (
                                        <div key={student.id} className="flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium pl-3 pr-1 py-1 rounded-full">
                                            <span>{student.name}</span>
                                            <button onClick={() => removeStudent(student.id)} className="w-5 h-5 rounded-full bg-primary/20 hover:bg-primary/40 flex items-center justify-center">
                                                <FaTimes className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search for students to add..."
                                    className="w-full h-10 px-3 rounded-md border border-border bg-background"
                                />
                                {searchQuery && filteredStudents.length > 0 && (
                                    <ul className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                        {filteredStudents.map(student => (
                                            <li key={student.id} onClick={() => addStudent(student)} className="px-3 py-2 cursor-pointer hover:bg-muted">
                                                {student.name} <span className="text-xs text-muted-foreground"> (Grade {student.grade})</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField type="date" label="Due Date" name="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
                        <SelectField label="Priority" name="priority" value={priority} onChange={e => setPriority(e.target.value as WorkPriority)} options={WORK_PRIORITIES} />
                    </div>
                    {error && <p className="text-sm text-danger">{error}</p>}
                </div>

                <div className="mt-6 flex justify-end space-x-3 flex-shrink-0">
                    <button onClick={onClose} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold">Cancel</button>
                    <button onClick={handleAssign} disabled={isSaving} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:bg-muted disabled:cursor-wait min-w-[120px]">
                        {isSaving ? 'Assigning...' : 'Assign'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignVideoModal;