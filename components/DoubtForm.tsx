


import React, { useState, useEffect, useMemo, FC } from 'react';
import { Student, SubjectData, WorkItem, Doubt, DoubtOrigin, SyllabusNode } from '../types';
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

const SyllabusNodeSelect: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: SyllabusNode[]}> = ({label, value, onChange, options}) => (
    <div>
        <label className="block text-sm font-medium text-muted-foreground">{label}</label>
        <select value={value} onChange={onChange} className="mt-1 block w-full h-10 px-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50">
            <option value="">Select {label.replace(' (Optional)','')}</option>
            {options.map(opt => <option key={String(opt.no)} value={String(opt.no)}>{opt.no} - {opt.name}</option>)}
        </select>
    </div>
);


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
    
    const [selectedTopicNo, setSelectedTopicNo] = useState('');
    const [topicOptions, setTopicOptions] = useState<SyllabusNode[]>([]);
    const [selectedSubTopicNo, setSelectedSubTopicNo] = useState('');
    const [subTopicOptions, setSubTopicOptions] = useState<SyllabusNode[]>([]);
    const [selectedMiniTopicNo, setSelectedMiniTopicNo] = useState('');
    const [miniTopicOptions, setMiniTopicOptions] = useState<SyllabusNode[]>([]);

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

    // Effects for managing hierarchical topic selection
    useEffect(() => { if (!isEditMode) setFormData(prev => ({ ...prev, chapter: '', worksheet: '' })); }, [formData.subject, isEditMode]);
    useEffect(() => {
        const [chapterNo] = formData.chapter.split('::');
        const selectedSubjectData = subjects.find(s => s.subject === formData.subject);
        const chapterNode = selectedSubjectData?.chapters.find(c => String(c.no) === String(chapterNo));
        setTopicOptions(chapterNode?.children || []);
        setSelectedTopicNo('');
    }, [formData.chapter, formData.subject, subjects]);
    useEffect(() => {
        const topicNode = topicOptions.find(t => String(t.no) === selectedTopicNo);
        setSubTopicOptions(topicNode?.children || []);
        setSelectedSubTopicNo('');
    }, [selectedTopicNo, topicOptions]);
    useEffect(() => {
        const subTopicNode = subTopicOptions.find(st => String(st.no) === selectedSubTopicNo);
        setMiniTopicOptions(subTopicNode?.children || []);
        setSelectedMiniTopicNo('');
    }, [selectedSubTopicNo, subTopicOptions]);

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
        
        let topicName = '';
        let node: SyllabusNode | undefined;
        if (selectedMiniTopicNo) node = miniTopicOptions.find(o => String(o.no) === selectedMiniTopicNo);
        else if (selectedSubTopicNo) node = subTopicOptions.find(o => String(o.no) === selectedSubTopicNo);
        else if (selectedTopicNo) node = topicOptions.find(o => String(o.no) === selectedTopicNo);
        topicName = node ? node.name : '';

        const finalDoubt: Doubt = {
            id: doubt?.id || `d_${Date.now()}`,
            studentId: student.id,
            subject: formData.subject,
            chapterNo: chapterNo || undefined,
            chapterName: chapterName || undefined,
            topic: topicName || undefined,
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-card/80 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto thin-scrollbar" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-1">{isEditMode ? 'Edit Doubt' : 'Add New Doubt'} for <span className="text-primary">{student.name}</span></h2>
                <p className="text-sm text-muted-foreground mb-6">Log a new query or update an existing one.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectField label="Subject" name="subject" value={formData.subject} onChange={handleChange} options={subjects.map(s => s.subject)} error={errors.subject} required />
                         <div>
                            <label htmlFor="chapter" className="block text-sm font-medium text-muted-foreground">Chapter (Optional)</label>
                            <select id="chapter" name="chapter" value={formData.chapter} onChange={handleChange} disabled={!formData.subject} className="mt-1 block w-full h-10 px-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 disabled:bg-muted">
                                <option value="">Select Chapter</option>
                                {chapterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    </div>
                    {isEditMode && doubt?.topic && <p className="text-xs text-muted-foreground -mt-2">Current Topic: {doubt.topic}. To change, please re-select from the dropdowns below.</p>}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         {topicOptions.length > 0 && <SyllabusNodeSelect label="Topic (Optional)" value={selectedTopicNo} onChange={(e) => setSelectedTopicNo(e.target.value)} options={topicOptions} />}
                         {subTopicOptions.length > 0 && <SyllabusNodeSelect label="Sub-topic (Optional)" value={selectedSubTopicNo} onChange={(e) => setSelectedSubTopicNo(e.target.value)} options={subTopicOptions} />}
                         {miniTopicOptions.length > 0 && <SyllabusNodeSelect label="Mini-topic (Optional)" value={selectedMiniTopicNo} onChange={(e) => setSelectedMiniTopicNo(e.target.value)} options={miniTopicOptions} />}
                    </div>

                    <TextareaField label="Doubt" name="text" value={formData.text} onChange={handleChange} error={errors.text} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectField label="Priority" name="priority" value={formData.priority} onChange={handleChange} options={DOUBT_PRIORITIES} required />
                        <SelectField label="When did this doubt arise?" name="origin" value={formData.origin} onChange={handleChange} options={DOUBT_ORIGINS} error={errors.origin} required />
                    </div>
                    
                    {formData.origin === 'During Work Task' && (
                        <div>
                            <label htmlFor="worksheet" className="block text-sm font-medium text-muted-foreground">Related Work Task (Optional)</label>
                            <select id="worksheet" name="worksheet" value={formData.worksheet} onChange={handleChange} disabled={worksheetOptions.length === 0} className="mt-1 block w-full h-10 px-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 disabled:bg-muted">
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
                            <label className="block text-sm font-medium text-muted-foreground">Attachment</label>
                            <input type="file" onChange={(e) => handleFileChange(e, 'attachment')} className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                            {attachment && <p className="text-xs mt-1 truncate text-muted-foreground">{attachment.name}</p>}
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-muted-foreground">Voice Note</label>
                            <input type="file" onChange={(e) => handleFileChange(e, 'voiceNote')} accept="audio/*" className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                            {voiceNote && <p className="text-xs mt-1 truncate text-muted-foreground">{voiceNote.name}</p>}
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-6">
                       <button type="button" onClick={onCancel} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold">Cancel</button>
                       <button type="submit" className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold">Save Doubt</button>
                   </div>
                </form>
            </div>
        </div>
    );
}

export default DoubtForm;