import React, { useState, useEffect, useMemo } from 'react';
import { Student, SubjectData, Test, TestStatus, TestPriority, TestType, Chapter } from '../types';
import { TEST_PRIORITIES, TEST_TYPES } from '../constants';
import InputField from './form/InputField';
import SelectField from './form/SelectField';
import TextareaField from './form/TextareaField';

interface TestFormProps {
    student: Student;
    studentSubjects: SubjectData[];
    test?: Test | null;
    onSave: (test: Test) => void;
    onCancel: () => void;
    allMistakeTypes: string[];
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
        remarks: test?.remarks || '',
        strongArea: test?.strongArea || '',
        weakArea: test?.weakArea || '',
        retestRequired: test?.retestRequired || 'No',
    });
    
    const [selectedChapters, setSelectedChapters] = useState<Chapter[]>(test?.chapters || []);
    const [mistakeTypes, setMistakeTypes] = useState<Set<string>>(new Set(test?.mistakeTypes || []));
    const [otherMistakeText, setOtherMistakeText] = useState('');
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

    useEffect(() => {
        if (test?.mistakeTypes) {
            const predefinedMistakes = new Set(allMistakeTypes);
            const customMistake = test.mistakeTypes.find(m => !predefinedMistakes.has(m));
            if (customMistake) {
                setMistakeTypes(prev => {
                    const newSet = new Set(prev);
                    // Remove custom text and add 'Other' to check the box
                    if (newSet.has(customMistake)) {
                        newSet.delete(customMistake);
                    }
                    newSet.add('Other');
                    return newSet;
                });
                setOtherMistakeText(customMistake);
            }
        }
    }, [test, allMistakeTypes]);

    const availableMistakeTypes = useMemo(() => {
        return allMistakeTypes.filter(m => m !== 'Other');
    }, [allMistakeTypes]);


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

    const handleMistakeTypeToggle = (type: string) => {
        setMistakeTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(type)) {
                newSet.delete(type);
            } else {
                newSet.add(type);
            }
            return newSet;
        });
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
            if(mistakeTypes.has('Other') && !otherMistakeText.trim()) newErrors.otherMistake = 'Please specify the mistake';
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

        const finalMistakes = new Set(mistakeTypes);
        if (finalMistakes.has('Other')) {
            finalMistakes.delete('Other');
            if (otherMistakeText.trim()) {
                finalMistakes.add(otherMistakeText.trim());
            }
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
            mistakeTypes: finalStatus === 'Completed' ? Array.from(finalMistakes) : undefined,
            remarks: finalStatus === 'Completed' ? formData.remarks.trim() : undefined,
            strongArea: finalStatus === 'Completed' ? formData.strongArea.trim() : undefined,
            weakArea: finalStatus === 'Completed' ? formData.weakArea.trim() : undefined,
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
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {availableMistakeTypes.map(type => (
                                            <label key={type} className="flex items-center space-x-2 p-2 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/50 has-[:checked]:border-blue-500">
                                                <input
                                                    type="checkbox"
                                                    checked={mistakeTypes.has(type)}
                                                    onChange={() => handleMistakeTypeToggle(type)}
                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm">{type}</span>
                                            </label>
                                        ))}
                                        <label key="Other" className="flex items-center space-x-2 p-2 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/50 has-[:checked]:border-blue-500">
                                            <input
                                                type="checkbox"
                                                checked={mistakeTypes.has('Other')}
                                                onChange={() => handleMistakeTypeToggle('Other')}
                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm">Other</span>
                                        </label>
                                    </div>
                                    {mistakeTypes.has('Other') && (
                                        <div className="mt-2">
                                            <InputField label="Specify Other Mistake" name="otherMistake" value={otherMistakeText} onChange={(e) => setOtherMistakeText(e.target.value)} error={errors.otherMistake} required />
                                        </div>
                                    )}
                                </div>
                                <TextareaField label="Remarks" name="remarks" value={formData.remarks} onChange={handleChange} />
                                <TextareaField label="Strong Area" name="strongArea" value={formData.strongArea} onChange={handleChange} />
                                <TextareaField label="Weak Area" name="weakArea" value={formData.weakArea} onChange={handleChange} />
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