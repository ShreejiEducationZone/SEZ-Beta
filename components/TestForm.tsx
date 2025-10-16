import React, { useState, useEffect, useMemo } from 'react';
import { Student, SubjectData, Test, TestStatus, TestPriority, TestType, Chapter, MistakeTypeDefinition, SyllabusNode } from '../types';
import { TEST_PRIORITIES, TEST_TYPES } from '../constants';
import InputField from './form/InputField';
import SelectField from './form/SelectField';

interface SyllabusAreaNodeProps {
    node: SyllabusNode;
    type: 'strong' | 'weak';
    selectedStrong: Set<string>;
    selectedWeak: Set<string>;
    onToggle: (nodeNo: string, type: 'strong' | 'weak') => void;
}

const SyllabusAreaNode: React.FC<SyllabusAreaNodeProps> = ({ node, type, selectedStrong, selectedWeak, onToggle }) => {
    const isSelected = type === 'strong' ? selectedStrong.has(String(node.no)) : selectedWeak.has(String(node.no));
    const isDisabled = type === 'strong' ? selectedWeak.has(String(node.no)) : selectedStrong.has(String(node.no));

    return (
        <div className="pl-4">
            <label className={`flex items-center gap-2 p-1.5 rounded-md transition-colors ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted'}`}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => onToggle(String(node.no), type)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-foreground text-sm">{node.no}. {node.name}</span>
            </label>
            {node.children && node.children.length > 0 && (
                <div className="border-l-2 border-border ml-3">
                    {node.children.map(child => (
                        <SyllabusAreaNode 
                            key={String(child.no)}
                            node={child}
                            type={type}
                            selectedStrong={selectedStrong}
                            selectedWeak={selectedWeak}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


interface TestFormProps {
    student: Student;
    studentSubjects: SubjectData[];
    test?: Test | null;
    onSave: (test: Test) => void;
    onCancel: () => void;
    allMistakeTypes: MistakeTypeDefinition[];
}

const TestForm: React.FC<TestFormProps> = ({ student, studentSubjects, test, onSave, onCancel, allMistakeTypes }) => {
    const isEditMode = !!test;
    const [status, setStatus] = useState<TestStatus>(test?.status === 'Upcoming' ? 'Completed' : (test?.status || 'Upcoming'));
    const [isAbsent, setIsAbsent] = useState(test?.status === 'Absent');
    
    const [formData, setFormData] = useState({
        title: test?.title || '',
        subject: test?.subject || '',
        testDate: test?.testDate || '',
        priority: test?.priority || 'Medium',
        testType: test?.testType || '',
        marksObtained: test?.marksObtained?.toString() || '',
        totalMarks: test?.totalMarks?.toString() || '',
        retestRequired: test?.retestRequired || 'No',
    });
    
    const getAreasForState = (areas: string | string[] | undefined): string[] => {
        if (!areas) return [];
        if (Array.isArray(areas)) return areas;
        return [String(areas)];
    };
    
    const [selectedChapters, setSelectedChapters] = useState<Chapter[]>(test?.chapters || []);
    const [mistakeTypes, setMistakeTypes] = useState<Set<string>>(new Set(test?.mistakeTypes || []));
    const [strongAreas, setStrongAreas] = useState<Set<string>>(new Set(getAreasForState(test?.strongArea)));
    const [weakAreas, setWeakAreas] = useState<Set<string>>(new Set(getAreasForState(test?.weakArea)));
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const availableChapters = useMemo(() => {
        if (!formData.subject) return [];
        return studentSubjects.find(s => s.subject === formData.subject)?.chapters || [];
    }, [formData.subject, studentSubjects]);

    useEffect(() => {
        if (!isEditMode) {
            setSelectedChapters([]);
        }
    }, [formData.subject, isEditMode]);
    
    useEffect(() => {
        if(status === 'Completed' && test?.status === 'Absent') {
            setIsAbsent(true);
        } else {
            setIsAbsent(false);
        }
    }, [status, test]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleChapterToggle = (chapter: Chapter) => {
        setSelectedChapters(prev => {
            const isSelected = prev.some(c => c.no === chapter.no && c.name === chapter.name);
            if (isSelected) {
                return prev.filter(c => !(c.no === chapter.no && c.name === chapter.name));
            } else {
                return [...prev, chapter];
            }
        });
    };

    const handleMistakeTypeToggle = (title: string) => {
        setMistakeTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(title)) {
                newSet.delete(title);
            } else {
                newSet.add(title);
            }
            return newSet;
        });
    };
    
    const handleAreaToggle = (nodeNo: string, type: 'strong' | 'weak') => {
        if (type === 'strong') {
            setStrongAreas(prev => {
                const newSet = new Set(prev);
                if (newSet.has(nodeNo)) newSet.delete(nodeNo);
                else newSet.add(nodeNo);
                return newSet;
            });
        } else {
            setWeakAreas(prev => {
                const newSet = new Set(prev);
                if (newSet.has(nodeNo)) newSet.delete(nodeNo);
                else newSet.add(nodeNo);
                return newSet;
            });
        }
    };


    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.subject) newErrors.subject = 'Subject is required';
        if (status === 'Upcoming' && !formData.testType) newErrors.testType = 'Test Type is required';
        if (!formData.testDate) newErrors.testDate = 'Test Date is required';
        if (selectedChapters.length === 0) newErrors.chapters = 'At least one chapter must be selected';

        if (status === 'Completed' && !isAbsent) {
            if (!formData.testType) newErrors.testType = 'Test Type is required';
            const marks = parseFloat(formData.marksObtained);
            const total = parseFloat(formData.totalMarks);
            if (formData.marksObtained === '' || isNaN(marks)) newErrors.marksObtained = 'Must be a number';
            if (formData.totalMarks === '' || isNaN(total)) newErrors.totalMarks = 'Must be a number';
            if (!isNaN(marks) && !isNaN(total) && marks > total) newErrors.marksObtained = 'Cannot exceed total marks';
            if (!isNaN(total) && total <= 0) newErrors.totalMarks = 'Must be positive';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        let finalStatus: TestStatus = status;
        if (status === 'Completed' && isAbsent) {
            finalStatus = 'Absent';
        }

        const finalTest: Test = {
            id: test?.id || `t_${Date.now()}`,
            studentId: student.id,
            status: finalStatus,
            title: formData.title.trim(),
            subject: formData.subject,
            chapters: selectedChapters,
            testDate: formData.testDate,
            priority: formData.priority as TestPriority,
            testType: formData.testType as TestType,
            marksObtained: finalStatus === 'Completed' ? parseFloat(formData.marksObtained) : undefined,
            totalMarks: finalStatus === 'Completed' ? parseFloat(formData.totalMarks) : undefined,
            mistakeTypes: finalStatus === 'Completed' ? Array.from(mistakeTypes) : undefined,
            strongArea: finalStatus === 'Completed' ? Array.from(strongAreas) : undefined,
            weakArea: finalStatus === 'Completed' ? Array.from(weakAreas) : undefined,
            retestRequired: finalStatus === 'Completed' ? (formData.retestRequired as 'Yes' | 'No') : undefined,
        };
        
        onSave(finalTest);
        onCancel();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-card/80 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto thin-scrollbar" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-1 text-foreground">{isEditMode ? 'Edit Test Record' : 'Add New Test Record'}</h2>
                <p className="text-sm text-muted-foreground mb-6">For {student.name}</p>

                <div className="flex bg-muted rounded-lg p-1 mb-6">
                    <button
                        onClick={() => setStatus('Upcoming')}
                        className={`w-1/2 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${status === 'Upcoming' ? 'bg-background shadow-soft text-foreground' : 'text-muted-foreground'}`}
                    >
                        📝 Upcoming Test
                    </button>
                    <button
                        onClick={() => setStatus('Completed')}
                        className={`w-1/2 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${(status === 'Completed' || status === 'Absent') ? 'bg-background shadow-soft text-foreground' : 'text-muted-foreground'}`}
                    >
                        ✅ Completed Test
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField label="Test Title" name="title" value={formData.title} onChange={handleChange} error={errors.title} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectField label="Subject" name="subject" value={formData.subject} onChange={handleChange} options={studentSubjects.map(s => s.subject)} error={errors.subject} required />
                        <SelectField label="Test Type" name="testType" value={formData.testType} onChange={handleChange} options={TEST_TYPES} error={errors.testType} required={status !== 'Upcoming'} />
                        <InputField label="Test Date" name="testDate" type="date" value={formData.testDate} onChange={handleChange} error={errors.testDate} required />
                        <SelectField label="Priority" name="priority" value={formData.priority} onChange={handleChange} options={TEST_PRIORITIES} required />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Chapters / Syllabus {errors.chapters && <span className="text-danger">*</span>}</label>
                        {errors.chapters && <p className="text-danger text-xs mt-1">{errors.chapters}</p>}
                        <div className="mt-2 max-h-40 overflow-y-auto border border-border rounded-lg p-2 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-background">
                            {availableChapters.length > 0 ? availableChapters.map(chap => (
                                <label key={`${chap.no}-${chap.name}`} className="flex items-center space-x-2 p-2 rounded hover:bg-muted cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedChapters.some(c => c.no === chap.no && c.name === chap.name)}
                                        onChange={() => handleChapterToggle(chap as Chapter)}
                                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                    />
                                    <span className="text-foreground">Ch {chap.no} - {chap.name}</span>
                                </label>
                            )) : <p className="text-sm text-muted-foreground p-2">Select a subject to see chapters.</p>}
                        </div>
                    </div>

                    {(status === 'Completed' || status === 'Absent') && (
                        <div className="space-y-4 pt-4 border-t border-border">
                             <div>
                                <label className="block text-sm font-medium text-muted-foreground">Attendance</label>
                                <div className="mt-2 flex gap-4">
                                    <label className="flex items-center gap-2"><input type="radio" name="attendance" value="present" checked={!isAbsent} onChange={() => setIsAbsent(false)} className="h-4 w-4 text-primary focus:ring-primary" /> Present</label>
                                    <label className="flex items-center gap-2"><input type="radio" name="attendance" value="absent" checked={isAbsent} onChange={() => setIsAbsent(true)} className="h-4 w-4 text-primary focus:ring-primary" /> Absent</label>
                                </div>
                            </div>
                            
                            {!isAbsent && (
                                <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField label="Marks Obtained" name="marksObtained" type="number" value={formData.marksObtained} onChange={handleChange} error={errors.marksObtained} required />
                                    <InputField label="Total Marks" name="totalMarks" type="number" value={formData.totalMarks} onChange={handleChange} error={errors.totalMarks} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground">Mistake Types</label>
                                    <div className="mt-2 max-h-40 overflow-y-auto thin-scrollbar border border-border rounded-lg p-2 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-background">
                                        {allMistakeTypes.map(type => (
                                            <label key={type.title} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted has-[:checked]:bg-primary/10 cursor-pointer" title={type.description}>
                                                <input
                                                    type="checkbox"
                                                    checked={mistakeTypes.has(type.title)}
                                                    onChange={() => handleMistakeTypeToggle(type.title)}
                                                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                                />
                                                <span className="font-semibold text-sm text-foreground">{type.title}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">To add or remove mistake types, go to the Settings page.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground">Strong Areas</label>
                                        <div className="mt-2 max-h-52 overflow-y-auto thin-scrollbar border border-border rounded-lg p-2 space-y-1 bg-background">
                                            {availableChapters.length > 0 ? availableChapters.map(chapter => (
                                                <SyllabusAreaNode
                                                    key={`strong-${String(chapter.no)}`}
                                                    node={chapter}
                                                    type="strong"
                                                    selectedStrong={strongAreas}
                                                    selectedWeak={weakAreas}
                                                    onToggle={handleAreaToggle}
                                                />
                                            )) : <p className="text-sm text-muted-foreground italic p-2">Select a subject to see syllabus.</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground">Weak Areas</label>
                                        <div className="mt-2 max-h-52 overflow-y-auto thin-scrollbar border border-border rounded-lg p-2 space-y-1 bg-background">
                                            {availableChapters.length > 0 ? availableChapters.map(chapter => (
                                                <SyllabusAreaNode
                                                    key={`weak-${String(chapter.no)}`}
                                                    node={chapter}
                                                    type="weak"
                                                    selectedStrong={strongAreas}
                                                    selectedWeak={weakAreas}
                                                    onToggle={handleAreaToggle}
                                                />
                                            )) : <p className="text-sm text-muted-foreground italic p-2">Select a subject to see syllabus.</p>}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground">Retest Required?</label>
                                    <div className="mt-2 flex gap-4">
                                        <label className="flex items-center gap-2"><input type="radio" name="retestRequired" value="No" checked={formData.retestRequired === 'No'} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary" /> No</label>
                                        <label className="flex items-center gap-2"><input type="radio" name="retestRequired" value="Yes" checked={formData.retestRequired === 'Yes'} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary" /> Yes</label>
                                    </div>
                                </div>
                                </>
                             )}
                        </div>
                    )}
                    
                    <div className="flex justify-end space-x-4 pt-6">
                       <button type="button" onClick={onCancel} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold">Cancel</button>
                       <button type="submit" className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold">Save Record</button>
                   </div>
                </form>
            </div>
        </div>
    );
};

export default TestForm;
