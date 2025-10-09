import React, { useState, useEffect, useMemo } from 'react';
import { Student, SubjectData, WorkItem, WorkStatus, WorkPriority, SyllabusNode } from '../types';
import { WORK_STATUSES, WORK_PRIORITIES } from '../constants';
import InputField from './form/InputField';
import SelectField from './form/SelectField';
import TextareaField from './form/TextareaField';

interface WorkFormProps {
    student: Student;
    subjects: SubjectData[];
    workItems: WorkItem[];
    workItem?: WorkItem;
    onSave: (item: WorkItem) => void;
    onCancel: () => void;
}

const SyllabusNodeSelect: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: SyllabusNode[]}> = ({label, value, onChange, options}) => (
    <div>
        <label className="block text-sm font-medium text-muted-foreground">{label}</label>
        <select value={value} onChange={onChange} className="mt-1 block w-full h-10 px-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50">
            <option value="">Select {label.replace(' (Optional)','')}</option>
            {options.map(opt => <option key={String(opt.no)} value={String(opt.no)}>{opt.no} - {opt.name}</option>)}
        </select>
    </div>
);

const WorkForm: React.FC<WorkFormProps> = ({ student, subjects, workItem, workItems, onSave, onCancel }) => {
    const isEditMode = !!workItem;
    const [formData, setFormData] = useState({
        title: workItem?.title || '',
        subject: workItem?.subject || '',
        chapter: workItem ? `${workItem.chapterNo}::${workItem.chapterName}` : '',
        description: workItem?.description || '',
        dueDate: workItem?.dueDate || '',
        status: workItem?.status || 'Assign',
        priority: workItem?.priority || 'Medium',
        links: workItem?.links?.join(', ') || '',
        mentorNote: workItem?.mentorNote || '',
    });

    const [selectedTopicNo, setSelectedTopicNo] = useState('');
    const [topicOptions, setTopicOptions] = useState<SyllabusNode[]>([]);
    const [selectedSubTopicNo, setSelectedSubTopicNo] = useState('');
    const [subTopicOptions, setSubTopicOptions] = useState<SyllabusNode[]>([]);
    const [selectedMiniTopicNo, setSelectedMiniTopicNo] = useState('');
    const [miniTopicOptions, setMiniTopicOptions] = useState<SyllabusNode[]>([]);
    
    const [files, setFiles] = useState<{ name: string; dataUrl: string }[]>(workItem?.files || []);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const chapterOptions = useMemo(() => {
        if (!formData.subject) return [];
        const selectedSubject = subjects.find(s => s.subject === formData.subject);
        return selectedSubject?.chapters.map(c => ({
            label: `Ch ${c.no} – ${c.name}`,
            value: `${c.no}::${c.name}`
        })) || [];
    }, [formData.subject, subjects]);

    // Effect to reset children when subject changes
    useEffect(() => {
        if (!isEditMode) {
             setFormData(prev => ({ ...prev, chapter: '' }));
        }
    }, [formData.subject, isEditMode]);

    // Effect to manage topic dropdown
    useEffect(() => {
        const [chapterNo] = formData.chapter.split('::');
        const selectedSubjectData = subjects.find(s => s.subject === formData.subject);
        const chapterNode = selectedSubjectData?.chapters.find(c => String(c.no) === String(chapterNo));
        
        setTopicOptions(chapterNode?.children || []);
        setSelectedTopicNo('');
    }, [formData.chapter, formData.subject, subjects]);

    // Effect to manage sub-topic dropdown
    useEffect(() => {
        const topicNode = topicOptions.find(t => String(t.no) === selectedTopicNo);
        setSubTopicOptions(topicNode?.children || []);
        setSelectedSubTopicNo('');
    }, [selectedTopicNo, topicOptions]);

    // Effect to manage mini-topic dropdown
    useEffect(() => {
        const subTopicNode = subTopicOptions.find(st => String(st.no) === selectedSubTopicNo);
        setMiniTopicOptions(subTopicNode?.children || []);
        setSelectedMiniTopicNo('');
    }, [selectedSubTopicNo, subTopicOptions]);
    

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        selectedFiles.forEach((file: File) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFiles(prev => [...prev, { name: file.name, dataUrl: event.target?.result as string }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.subject) newErrors.subject = 'Subject is required';
        if (!formData.chapter) newErrors.chapter = 'Chapter is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.dueDate) newErrors.dueDate = 'Due Date is required';

        if (!newErrors.title && !newErrors.subject && !newErrors.chapter && !newErrors.description) {
            const formTitle = formData.title.trim().toLowerCase();
            const formDescription = formData.description.trim().toLowerCase();
            const [formChapterNo] = formData.chapter.split('::');

            const isDuplicate = workItems.some(existingItem => {
                if (isEditMode && existingItem.id === workItem.id) return false;
                if (existingItem.studentId !== student.id || existingItem.status === 'Completed') return false;

                return existingItem.title.trim().toLowerCase() === formTitle &&
                       existingItem.subject === formData.subject &&
                       String(existingItem.chapterNo) === formChapterNo &&
                       existingItem.description.trim().toLowerCase() === formDescription;
            });

            if (isDuplicate) newErrors.title = '❗ Duplicate task detected.';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
    
        const [chapterNo, chapterName] = formData.chapter.split('::');
        
        let topicName = '';
        let node: SyllabusNode | undefined;
        if (selectedMiniTopicNo) node = miniTopicOptions.find(o => String(o.no) === selectedMiniTopicNo);
        else if (selectedSubTopicNo) node = subTopicOptions.find(o => String(o.no) === selectedSubTopicNo);
        else if (selectedTopicNo) node = topicOptions.find(o => String(o.no) === selectedTopicNo);
        topicName = node ? node.name : '';
    
        // Create a base object from the original work item (if editing) or a new object.
        // This preserves all properties not on the form, like source, sheetTaskIds, etc.
        const baseItem = workItem ? { ...workItem } : {
            id: `w_${Date.now()}`,
            dateCreated: new Date().toISOString().split('T')[0],
        };
    
        const finalWorkItem: WorkItem = {
            ...(baseItem as WorkItem), // Cast to WorkItem
    
            // Overwrite with form data
            studentId: student.id,
            title: formData.title.trim(),
            subject: formData.subject,
            chapterNo,
            chapterName,
            topic: topicName || undefined, // Ensure topic is undefined if empty
            description: formData.description.trim(),
            dueDate: formData.dueDate,
            status: formData.status as WorkStatus,
            priority: formData.priority as WorkPriority,
            links: formData.links.split(',').map(l => l.trim()).filter(Boolean),
            files: files,
            mentorNote: formData.mentorNote.trim(),
        };
    
        onSave(finalWorkItem);
        onCancel();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
           <div className="bg-card/80 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto thin-scrollbar" onClick={e => e.stopPropagation()}>
               <h2 className="text-2xl font-bold mb-1">{isEditMode ? 'Edit Work' : 'Add New Work'} for <span className="text-primary">{student.name}</span></h2>
               <p className="text-sm text-muted-foreground mb-6">Assign a new task or update an existing one.</p>
               <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField label="Title" name="title" value={formData.title} onChange={handleChange} error={errors.title} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <SelectField label="Subject" name="subject" value={formData.subject} onChange={handleChange} options={subjects.map(s => s.subject)} error={errors.subject} required />
                         <div>
                            <label htmlFor="chapter" className="block text-sm font-medium text-muted-foreground">Chapter <span className="text-red-500">*</span></label>
                            <select id="chapter" name="chapter" value={formData.chapter} onChange={handleChange} disabled={!formData.subject} className="mt-1 block w-full h-10 px-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 disabled:bg-muted">
                                <option value="">Select Chapter</option>
                                {chapterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            {errors.chapter && <p className="text-red-500 text-xs mt-1">{errors.chapter}</p>}
                        </div>
                    </div>

                    {isEditMode && workItem?.topic && <p className="text-xs text-muted-foreground -mt-2">Current Topic: {workItem.topic}. To change, please re-select from the dropdowns below.</p>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         {topicOptions.length > 0 && <SyllabusNodeSelect label="Topic (Optional)" value={selectedTopicNo} onChange={(e) => setSelectedTopicNo(e.target.value)} options={topicOptions} />}
                         {subTopicOptions.length > 0 && <SyllabusNodeSelect label="Sub-topic (Optional)" value={selectedSubTopicNo} onChange={(e) => setSelectedSubTopicNo(e.target.value)} options={subTopicOptions} />}
                         {miniTopicOptions.length > 0 && <SyllabusNodeSelect label="Mini-topic (Optional)" value={selectedMiniTopicNo} onChange={(e) => setSelectedMiniTopicNo(e.target.value)} options={miniTopicOptions} />}
                    </div>

                    <TextareaField label="Description" name="description" value={formData.description} onChange={handleChange} error={errors.description} required />
                    <InputField label="Due Date" name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} error={errors.dueDate} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectField label="Status" name="status" value={formData.status} onChange={handleChange} options={WORK_STATUSES} />
                        <SelectField label="Priority" name="priority" value={formData.priority} onChange={handleChange} options={WORK_PRIORITIES} />
                    </div>
                    <TextareaField label="Links (comma-separated)" name="links" value={formData.links} onChange={handleChange} />
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Files</label>
                        <input type="file" multiple onChange={handleFileChange} className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                        <div className="mt-2 space-y-2">
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded-md text-sm">
                                    <span className="truncate">{file.name}</span>
                                    <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700 font-bold ml-4">&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <TextareaField label="Mentor Note (Optional)" name="mentorNote" value={formData.mentorNote} onChange={handleChange} />
                    <div className="flex justify-end space-x-4 pt-6">
                       <button type="button" onClick={onCancel} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold">Cancel</button>
                       <button type="submit" className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold">Save Work</button>
                   </div>
               </form>
           </div>
       </div>
    );
};

export default WorkForm;