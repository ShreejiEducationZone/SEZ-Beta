

import React, { useState, useEffect, useMemo } from 'react';
import { Student, SubjectData, WorkItem, WorkStatus, WorkPriority } from '../types';
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

const WorkForm: React.FC<WorkFormProps> = ({ student, subjects, workItem, workItems, onSave, onCancel }) => {
    const isEditMode = !!workItem;
    const [formData, setFormData] = useState({
        title: workItem?.title || '',
        subject: workItem?.subject || '',
        chapter: workItem ? `${workItem.chapterNo}::${workItem.chapterName}` : '',
        topic: workItem?.topic || '',
        description: workItem?.description || '',
        dueDate: workItem?.dueDate || '',
        status: workItem?.status || 'Assign',
        priority: workItem?.priority || 'Medium',
        links: workItem?.links?.join(', ') || '',
        mentorNote: workItem?.mentorNote || '',
    });
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

    useEffect(() => {
        // Reset chapter when subject changes if not in edit mode initially
        if (!isEditMode) {
             setFormData(prev => ({ ...prev, chapter: '' }));
        }
    }, [formData.subject, isEditMode]);
    

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

        // Duplicate check - only if basic validation passes for relevant fields
        if (!newErrors.title && !newErrors.subject && !newErrors.chapter && !newErrors.description) {
            const formTitle = formData.title.trim().toLowerCase();
            const formDescription = formData.description.trim().toLowerCase();
            const [formChapterNo] = formData.chapter.split('::');

            const isDuplicate = workItems.some(existingItem => {
                // Ignore self when editing
                if (isEditMode && existingItem.id === workItem.id) {
                    return false;
                }

                // Only check for tasks for the same student that are not completed
                if (existingItem.studentId !== student.id || existingItem.status === 'Completed') {
                    return false;
                }

                const titleMatch = existingItem.title.trim().toLowerCase() === formTitle;
                const subjectMatch = existingItem.subject === formData.subject;
                const chapterNoMatch = String(existingItem.chapterNo) === formChapterNo;
                const descriptionMatch = existingItem.description.trim().toLowerCase() === formDescription;

                return titleMatch && subjectMatch && chapterNoMatch && descriptionMatch;
            });

            if (isDuplicate) {
                newErrors.title = '❗ Duplicate task detected. A similar task already exists for this student.';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const [chapterNo, chapterName] = formData.chapter.split('::');

        const finalWorkItem: WorkItem = {
            // Properties from the original item that aren't on the form,
            // ensuring they are preserved during an edit.
            id: workItem?.id || `w_${Date.now()}`,
            studentId: student.id,
            dateCreated: workItem?.dateCreated || new Date().toISOString().split('T')[0],
            linkedDoubtId: workItem?.linkedDoubtId,
            source: workItem?.source,

            // Properties from the form state.
            title: formData.title.trim(),
            subject: formData.subject,
            chapterNo,
            chapterName,
            topic: formData.topic.trim(),
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
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
           <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
               <h2 className="text-2xl font-bold mb-1">{isEditMode ? 'Edit Work' : 'Add New Work'} for <span className="text-brand-blue">{student.name}</span></h2>
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Assign a new task or update an existing one.</p>
               <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField label="Title" name="title" value={formData.title} onChange={handleChange} error={errors.title} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <SelectField label="Subject" name="subject" value={formData.subject} onChange={handleChange} options={subjects.map(s => s.subject)} error={errors.subject} required />
                         <div>
                            <label htmlFor="chapter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chapter <span className="text-red-500">*</span></label>
                            <select id="chapter" name="chapter" value={formData.chapter} onChange={handleChange} disabled={!formData.subject} className="mt-1 block w-full h-10 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800">
                                <option value="">Select Chapter</option>
                                {chapterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            {errors.chapter && <p className="text-red-500 text-xs mt-1">{errors.chapter}</p>}
                        </div>
                    </div>
                    <InputField label="Topic (Optional)" name="topic" value={formData.topic} onChange={handleChange} />
                    <TextareaField label="Description" name="description" value={formData.description} onChange={handleChange} error={errors.description} required />
                    <InputField label="Due Date" name="dueDate" type="date" value={formData.dueDate} onChange={handleChange} error={errors.dueDate} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectField label="Status" name="status" value={formData.status} onChange={handleChange} options={WORK_STATUSES} />
                        <SelectField label="Priority" name="priority" value={formData.priority} onChange={handleChange} options={WORK_PRIORITIES} />
                    </div>
                    <TextareaField label="Links (comma-separated)" name="links" value={formData.links} onChange={handleChange} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Files</label>
                        <input type="file" multiple onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-blue-700" />
                        <div className="mt-2 space-y-2">
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-md text-sm">
                                    <span className="truncate">{file.name}</span>
                                    <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-700 font-bold ml-4">&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <TextareaField label="Mentor Note (Optional)" name="mentorNote" value={formData.mentorNote} onChange={handleChange} />
                    <div className="flex justify-end space-x-4 pt-6">
                       <button type="button" onClick={onCancel} className="py-2 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Cancel</button>
                       <button type="submit" className="h-10 px-4 rounded-md bg-brand-blue text-white hover:bg-blue-600 text-sm font-semibold">Save Work</button>
                   </div>
               </form>
           </div>
       </div>
    );
};

export default WorkForm;