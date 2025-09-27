

import React, { useState, useEffect, useMemo } from 'react';
import { Student, SubjectData, Test, TestStatus, TestPriority, TestType, Chapter, MistakeTypeDefinition, AreaDefinition } from '../types';
import { TEST_PRIORITIES, TEST_TYPES } from '../constants';
import InputField from './form/InputField';
import SelectField from './form/SelectField';

interface TestFormProps {
    student: Student;
    studentSubjects: SubjectData[];
    test?: Test | null;
    onSave: (test: Test) => void;
    onCancel: () => void;
    allMistakeTypes: MistakeTypeDefinition[];
    subjectAreas: { [key: string]: AreaDefinition[] };
}

const TestForm: React.FC<TestFormProps> = ({ student, studentSubjects, test, onSave, onCancel, allMistakeTypes, subjectAreas }) => {
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
    
    // Helper to safely convert legacy string data to an array for state initialization
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

    const availableAreas = useMemo(() => {
        if (!formData.subject) return [];
        const areasForSubject = subjectAreas[formData.subject] || [];
        return areasForSubject.map(areaDef => areaDef.title);
    }, [formData.subject, subjectAreas]);

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
    
    const handleAreaToggle = (area: string, type: 'strong' | 'weak') => {
        if (type === 'strong') {
            setStrongAreas(prev => {
                const newSet = new Set(prev);
                if (newSet.has(area)) newSet.delete(area);
                else newSet.add(area);
                return newSet;
            });
        } else {
            setWeakAreas(prev => {
                const newSet = new Set(prev);
                if (newSet.has(area)) newSet.delete(area);
                else newSet.add(area);
                return newSet;
            });
        }
    };


    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.subject) newErrors.subject = 'Subject is required';
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
            // Clear completed data if not in a completed/absent state or if absent
            testType: finalStatus === 'Completed' ? (formData.testType as TestType) : undefined,
            marksObtained: finalStatus === 'Completed' && formData.marksObtained !== '' ? parseFloat(formData.marksObtained) : undefined,
            totalMarks: finalStatus === 'Completed' && formData.totalMarks !== '' ? parseFloat(formData.totalMarks) : undefined,
            mistakeTypes: finalStatus === 'Completed' ? Array.from(mistakeTypes) : undefined,
            strongArea: finalStatus === 'Completed' ? Array.from(strongAreas) : undefined,
            weakArea: finalStatus === 'Completed' ? Array.from(weakAreas) : undefined,
            retestRequired: finalStatus === 'Completed' ? (formData.retestRequired as 'Yes' | 'No') : undefined,
        };
        
        onSave(finalTest);
        onCancel();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-lg p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto thin-scrollbar" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-1">{isEditMode ? 'Edit Test Record' : 'Add New Test Record'}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">For {student.name}</p>

                <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1 mb-6">
                    <button
                        onClick={() => setStatus('Upcoming')}
                        className={`w-1/2 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${status === 'Upcoming' ? 'bg-white dark:bg-dark-card shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        📝 Upcoming Test
                    </button>
                    <button
                        onClick={() => setStatus('Completed')}
                        className={`w-1/2 px-3 py-2 text-sm font-semibold rounded-md transition-colors ${(status === 'Completed' || status === 'Absent') ? 'bg-white dark:bg-dark-card shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        ✅ Completed Test
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField label="Test Title" name="title" value={formData.title} onChange={handleChange} error={errors.title} required />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SelectField label="Subject" name="subject" value={formData.subject} onChange={handleChange} options={studentSubjects.map(s => s.subject)} error={errors.subject} required />
                        <InputField label="Test Date" name="testDate" type="date" value={formData.testDate} onChange={handleChange} error={errors.testDate} required />
                        <SelectField label="Priority" name="priority" value={formData.priority} onChange={handleChange} options={TEST_PRIORITIES} required />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chapters / Syllabus {errors.chapters && <span className="text-red-500">*</span>}</label>
                        {errors.chapters && <p className="text-red-500 text-xs mt-1">{errors.chapters}</p>}
                        <div className="mt-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {availableChapters.length > 0 ? availableChapters.map(chap => (
                                <label key={`${chap.no}-${chap.name}`} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedChapters.some(c => c.no === chap.no && c.name === chap.name)}
                                        onChange={() => handleChapterToggle(chap)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>Ch {chap.no} - {chap.name}</span>
                                </label>
                            )) : <p className="text-sm text-gray-500 p-2">Select a subject to see chapters.</p>}
                        </div>
                    </div>

                    {(status === 'Completed' || status === 'Absent') && (
                        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attendance</label>
                                <div className="mt-2 flex gap-4">
                                    <label><input type="radio" name="attendance" value="present" checked={!isAbsent} onChange={() => setIsAbsent(false)} className="mr-1" /> Present</label>
                                    <label><input type="radio" name="attendance" value="absent" checked={isAbsent} onChange={() => setIsAbsent(true)} className="mr-1" /> Absent</label>
                                </div>
                            </div>
                            
                            {!isAbsent && (
                                <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <SelectField label="Test Type" name="testType" value={formData.testType} onChange={handleChange} options={TEST_TYPES} error={errors.testType} required />
                                    <InputField label="Marks Obtained" name="marksObtained" type="number" value={formData.marksObtained} onChange={handleChange} error={errors.marksObtained} required />
                                    <InputField label="Total Marks" name="totalMarks" type="number" value={formData.totalMarks} onChange={handleChange} error={errors.totalMarks} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mistake Types</label>
                                    <div className="mt-2 max-h-40 overflow-y-auto thin-scrollbar border border-gray-300 dark:border-gray-600 rounded-lg p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {allMistakeTypes.map(type => (
                                            <label key={type.title} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/50" title={type.description}>
                                                <input
                                                    type="checkbox"
                                                    checked={mistakeTypes.has(type.title)}
                                                    onChange={() => handleMistakeTypeToggle(type.title)}
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="font-semibold text-sm">{type.title}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">To add or remove mistake types, go to the Settings page.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Strong Areas</label>
                                        <div className="mt-2 max-h-52 overflow-y-auto thin-scrollbar border border-gray-300 dark:border-gray-600 rounded-lg p-2 space-y-2">
                                            {availableAreas.length > 0 ? availableAreas.map(area => (
                                                <label key={`strong-${area}`} className={`flex items-center gap-2 p-2 rounded-md transition-colors ${weakAreas.has(area) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 has-[:checked]:bg-green-50 dark:has-[:checked]:bg-green-900/50'}`} title={subjectAreas[formData.subject]?.find(def => def.title === area)?.description || ''}>
                                                    <input type="checkbox" checked={strongAreas.has(area)} onChange={() => handleAreaToggle(area, 'strong')} disabled={weakAreas.has(area)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                                                    <span>{area}</span>
                                                </label>
                                            )) : <p className="text-sm text-gray-500 italic p-2">No areas defined for this subject. Add them in Settings.</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weak Areas</label>
                                        <div className="mt-2 max-h-52 overflow-y-auto thin-scrollbar border border-gray-300 dark:border-gray-600 rounded-lg p-2 space-y-2">
                                             {availableAreas.length > 0 ? availableAreas.map(area => (
                                                <label key={`weak-${area}`} className={`flex items-center gap-2 p-2 rounded-md transition-colors ${strongAreas.has(area) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 has-[:checked]:bg-red-50 dark:has-[:checked]:bg-red-900/50'}`} title={subjectAreas[formData.subject]?.find(def => def.title === area)?.description || ''}>
                                                    <input type="checkbox" checked={weakAreas.has(area)} onChange={() => handleAreaToggle(area, 'weak')} disabled={strongAreas.has(area)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                                                    <span>{area}</span>
                                                </label>
                                            )) : <p className="text-sm text-gray-500 italic p-2">No areas defined for this subject. Add them in Settings.</p>}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Retest Required?</label>
                                    <div className="mt-2 flex gap-4">
                                        <label><input type="radio" name="retestRequired" value="No" checked={formData.retestRequired === 'No'} onChange={handleChange} className="mr-1" /> No</label>
                                        <label><input type="radio" name="retestRequired" value="Yes" checked={formData.retestRequired === 'Yes'} onChange={handleChange} className="mr-1" /> Yes</label>
                                    </div>
                                </div>
                                </>
                             )}
                        </div>
                    )}
                    
                    <div className="flex justify-end space-x-4 pt-6">
                       <button type="button" onClick={onCancel} className="py-2 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Cancel</button>
                       <button type="submit" className="h-10 px-4 rounded-md bg-brand-blue text-white hover:bg-blue-600 text-sm font-semibold">Save Record</button>
                   </div>
                </form>
            </div>
        </div>
    );
};

export default TestForm;
