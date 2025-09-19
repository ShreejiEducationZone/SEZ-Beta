
import React, { useState, useEffect, useMemo, FC } from 'react';
import { Student, SubjectData, WorkItem, Doubt, DoubtOrigin } from '../types';
import { DOUBT_PRIORITIES, DOUBT_ORIGINS } from '../constants';
import InputField from './form/InputField';
import SelectField from './form/SelectField';
import TextareaField from './form/TextareaField';

interface DoubtFormProps {
    student: Student;
    subjects: SubjectData[];
    workItems: WorkItem[];
    doubt?: Doubt;
    onSave: (doubt: Doubt) => void;
    onCancel: () => void;
}

const DoubtForm: FC<DoubtFormProps> = ({ student, subjects, workItems, doubt, onSave, onCancel }) => {
    const isEditMode = !!doubt;

    const [formData, setFormData] = useState({
        subject: doubt?.subject || '',
        chapter: doubt?.chapterNo ? `${doubt.chapterNo}::${doubt.chapterName}` : '',
        origin: doubt?.origin || '',
        worksheet: '', // Stores WorkItem ID
        testId: doubt?.testId || '',
        text: doubt?.text || '',
        priority: doubt?.priority || 'Medium',
    });
    
    const [attachment, setAttachment] = useState(doubt?.attachment || null);
    const [voiceNote, setVoiceNote] = useState(doubt?.voiceNote || null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const chapterOptions = useMemo(() => {
        if (!formData.subject) return [];
        const selectedSubject = subjects.find(s => s.subject === formData.subject);
        return selectedSubject?.chapters.map(c => ({
            label: `Ch ${c.no} – ${c.name}`,
            value: `${c.no}::${c.name}`
        })) || [];
    }, [formData.subject, subjects]);
    
    const worksheetOptions = useMemo(() => {
        if (formData.origin !== 'During Work Task' || !formData.subject) return [];
        return workItems.filter(item => {
            const subjectMatch = item.subject === formData.subject;
            if (!formData.chapter) return subjectMatch; // Match only subject if chapter not selected
            const [chapterNo] = formData.chapter.split('::');
            return subjectMatch && String(item.chapterNo) === chapterNo;
        });
    }, [formData.origin, formData.subject, formData.chapter, workItems]);

    useEffect(() => {
        // Reset chapter when subject changes if not in edit mode initially
        if (!isEditMode) {
             setFormData(prev => ({ ...prev, chapter: '', worksheet: '' }));
        }
    }, [formData.subject, isEditMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'attachment' | 'voiceNote') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const fileData = { name: file.name, dataUrl: event.target?.result as string };
                if (fileType === 'attachment') setAttachment(fileData);
                else setVoiceNote(fileData);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.subject) newErrors.subject = 'Subject is required';
        if (!formData.origin) newErrors.origin = 'Origin is required';
        if (!formData.text.trim()) newErrors.text = 'Doubt text is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const [chapterNo, chapterName] = formData.chapter.split('::');
        
        const finalDoubt: Doubt = {
            id: doubt?.id || `d_${Date.now()}`,
            studentId: student.id,
            subject: formData.subject,
            chapterNo: chapterNo || undefined,
            chapterName: chapterName || undefined,
            testId: formData.testId || undefined,
            text: formData.text.trim(),
            priority: formData.priority as Doubt['priority'],
            origin: formData.origin as DoubtOrigin,
            createdAt: doubt?.createdAt || new Date().toISOString().split('T')[0],
            status: doubt?.status || 'Open',
            resolvedAt: doubt?.resolvedAt,
            attachment: attachment || undefined,
            voiceNote: voiceNote || undefined,
        };

        onSave(finalDoubt);
        onCancel();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-1">{isEditMode ? 'Edit Doubt' : 'Add New Doubt'} for <span className="text-brand-blue">{student.name}</span></h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Log a new query or update an existing one.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectField label="Subject" name="subject" value={formData.subject} onChange={handleChange} options={subjects.map(s => s.subject)} error={errors.subject} required />
                         <div>
                            <label htmlFor="chapter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chapter (Optional)</label>
                            <select id="chapter" name="chapter" value={formData.chapter} onChange={handleChange} disabled={!formData.subject} className="mt-1 block w-full h-10 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800">
                                <option value="">Select Chapter</option>
                                {chapterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <TextareaField label="Doubt" name="text" value={formData.text} onChange={handleChange} error={errors.text} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectField label="Priority" name="priority" value={formData.priority} onChange={handleChange} options={DOUBT_PRIORITIES} required />
                        <SelectField label="When did this doubt arise?" name="origin" value={formData.origin} onChange={handleChange} options={DOUBT_ORIGINS} error={errors.origin} required />
                    </div>
                    
                    {formData.origin === 'During Work Task' && (
                        <div>
                            <label htmlFor="worksheet" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Related Work Task (Optional)</label>
                            <select id="worksheet" name="worksheet" value={formData.worksheet} onChange={handleChange} disabled={worksheetOptions.length === 0} className="mt-1 block w-full h-10 px-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm dark:bg-gray-700 dark:border-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800">
                                <option value="">Select a work task</option>
                                {worksheetOptions.map(item => <option key={item.id} value={item.id}>{item.title} — {item.chapterName}</option>)}
                            </select>
                        </div>
                    )}
                    {(formData.origin === 'Before Test' || formData.origin === 'After Test') && (
                        <InputField label="Test Name / ID (Optional)" name="testId" value={formData.testId} onChange={handleChange} />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attachment</label>
                            <input type="file" onChange={(e) => handleFileChange(e, 'attachment')} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue/80 file:text-white hover:file:bg-brand-blue"/>
                            {attachment && <p className="text-xs mt-1 truncate text-gray-500">{attachment.name}</p>}
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Voice Note</label>
                            <input type="file" onChange={(e) => handleFileChange(e, 'voiceNote')} accept="audio/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue/80 file:text-white hover:file:bg-brand-blue"/>
                            {voiceNote && <p className="text-xs mt-1 truncate text-gray-500">{voiceNote.name}</p>}
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-6">
                       <button type="button" onClick={onCancel} className="py-2 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Cancel</button>
                       <button type="submit" className="h-10 px-4 rounded-md bg-brand-blue text-white hover:bg-blue-600 text-sm font-semibold">Save Doubt</button>
                   </div>
                </form>
            </div>
        </div>
    );
}

export default DoubtForm;
