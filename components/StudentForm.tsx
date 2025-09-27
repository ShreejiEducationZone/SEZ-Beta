

import React, { useState, useEffect } from 'react';
import { Student, Board, Gender } from '../types';
import { BOARDS, GRADES, TIME_SLOTS, GENDERS } from '../constants';
import { getProgramStage, getBatchFromTime } from '../utils/studentUtils';
import InputField from './form/InputField';
import SelectField from './form/SelectField';
import TextareaField from './form/TextareaField';
import PlaceholderAvatar from './PlaceholderAvatar';

interface StudentFormProps {
    student: Partial<Student> | null;
    onSave: (student: Student) => Promise<void>;
    onCancel: () => void;
}

const resizeImage = (file: File, options: { maxSize: number; targetByteSize: number }): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error('Could not read file.'));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
                const { maxSize, targetByteSize } = options;

                // --- 1. Initial resize based on maxSize ---
                if (width > height) {
                    if (width > maxSize) {
                        height = Math.round(height * (maxSize / width));
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = Math.round(width * (maxSize / height));
                        height = maxSize;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);

                // --- 2. Iteratively compress to meet targetByteSize ---
                let quality = 0.9;
                let dataUrl = canvas.toDataURL('image/jpeg', quality);

                // Reduce quality first
                while (dataUrl.length > targetByteSize && quality > 0.1) {
                    quality -= 0.1;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }

                // If still too large, reduce dimensions
                while (dataUrl.length > targetByteSize && canvas.width > 200) {
                    width *= 0.9;
                    height *= 0.9;
                    canvas.width = Math.round(width);
                    canvas.height = Math.round(height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                }

                if (dataUrl.length > targetByteSize) {
                    // Final attempt with very low quality if needed
                    dataUrl = canvas.toDataURL('image/jpeg', 0.5);
                     if (dataUrl.length > targetByteSize) {
                        return reject(new Error('Image could not be compressed enough. Please use a smaller file.'));
                    }
                }
                
                resolve(dataUrl);
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
};


const StudentForm: React.FC<StudentFormProps> = ({ student, onSave, onCancel }) => {
    const isEditMode = !!student?.id;
    const [formData, setFormData] = useState({
        id: student?.id || null, 
        name: student?.name || '', 
        school: student?.school || '',
        board: student?.board || '', 
        grade: student?.grade || '', 
        timeSlot: student?.timeSlot || '',
        avatarUrl: student?.avatarUrl || null, 
        personalPhone: student?.personalPhone || '',
        fatherPhone: student?.fatherPhone || '', 
        motherPhone: student?.motherPhone || '',
        address: student?.address || '', 
        isArchived: student?.isArchived || false,
        programStage: student?.programStage || '',
        batch: student?.batch || '',
        notes: student?.notes || '',
        fatherName: student?.fatherName || '',
        motherName: student?.motherName || '',
        occupation: student?.occupation || '',
        gender: student?.gender || '',
        email: student?.email || '',
        dob: student?.dob || '',
    });
    const [age, setAge] = useState<string>('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isSaving, setIsSaving] = useState(false);

    const calculateAge = (dob: string): string => {
        if (!dob) return '';
        try {
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age >= 0 ? age.toString() : '';
        } catch {
            return '';
        }
    };
    
    useEffect(() => {
        const programStage = getProgramStage(formData.board as Board, formData.grade);
        const batch = getBatchFromTime(formData.timeSlot);
        const calculatedAge = calculateAge(formData.dob);
        setFormData(prev => ({ ...prev, programStage: programStage || '', batch }));
        setAge(calculatedAge);
    }, [formData.board, formData.grade, formData.timeSlot, formData.dob]);
    
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file.');
                return;
            }
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert('File is too large. Please select an image under 10MB.');
                return;
            }
            try {
                const resizedDataUrl = await resizeImage(file, {
                    maxSize: 1024,
                    targetByteSize: 1000000 // Target < 1MB
                });
                setFormData(prev => ({ ...prev, avatarUrl: resizedDataUrl }));
            } catch (error: any) {
                console.error("Error resizing image:", error);
                alert(`Could not process the image: ${error.message}`);
            }
        }
    };
    
    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name.trim()) newErrors.name = 'Full Name is required';
        if (!formData.school.trim()) newErrors.school = 'School is required';
        if (!formData.board) newErrors.board = 'Board is required';
        if (!formData.grade) newErrors.grade = 'Grade is required';
        if (!formData.timeSlot) newErrors.timeSlot = 'Time Slot is required';
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
             newErrors.email = 'Invalid email address';
        }
        ['personalPhone', 'fatherPhone', 'motherPhone'].forEach(key => {
            const phoneKey = key as keyof typeof formData;
            const phone = formData[phoneKey];
            if (phone && !/^\d{10}$/.test(phone as string)) {
                newErrors[key] = 'Must be a 10-digit number';
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving || !validate()) return;

        setIsSaving(true);
        try {
            await onSave({
                ...formData,
                id: formData.id || `s_${Date.now()}`,
                gender: formData.gender as Gender,
            } as Student);
        } catch (error) {
            console.error("Save failed, re-enabling form.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onCancel}>
           <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-lg p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
               <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'Edit Student' : 'Add New Student'}</h2>
               <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="flex items-center space-x-6">
                       <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                           {formData.avatarUrl ? <img src={formData.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" /> : <PlaceholderAvatar/>}
                       </div>
                       <label className="block">
                           <span className="sr-only">Choose profile photo</span>
                           <input type="file" onChange={handleAvatarChange} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-blue-700"/>
                       </label>
                   </div>

                    {/* Personal Details */}
                   <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Personal Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Full Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} required />
                            <SelectField label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={GENDERS} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                           <InputField type="date" label="Date of Birth" name="dob" value={formData.dob} onChange={handleChange} />
                           <InputField label="Age" name="age" value={age ? `${age} years old` : 'Enter DOB'} readOnly />
                        </div>
                   </div>

                    {/* Academic Details */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Academic Details</h3>
                        <InputField label="School" name="school" value={formData.school} onChange={handleChange} error={errors.school} required />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <SelectField label="Board" name="board" value={formData.board} onChange={handleChange} options={BOARDS} error={errors.board} required />
                            <SelectField label="Grade" name="grade" value={formData.grade} onChange={handleChange} options={GRADES} error={errors.grade} required />
                            {(formData.board === 'Cambridge' || formData.board === 'IB') && (
                                <InputField label="Program Stage" name="programStage" value={formData.programStage || 'Auto-filled'} readOnly />
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <SelectField label="Time Slot" name="timeSlot" value={formData.timeSlot} onChange={handleChange} options={TIME_SLOTS} error={errors.timeSlot} required />
                            <InputField label="Batch" name="batch" value={formData.batch || 'Auto-filled'} readOnly />
                        </div>
                    </div>

                    {/* Parent & Contact Details */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Parent & Contact Details (Optional)</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleChange} />
                            <InputField label="Mother's Name" name="motherName" value={formData.motherName} onChange={handleChange} />
                        </div>
                        <div className="mt-4">
                            <InputField label="Parent's Occupation" name="occupation" value={formData.occupation} onChange={handleChange} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <InputField type="tel" label="Personal Phone" name="personalPhone" value={formData.personalPhone} onChange={handleChange} error={errors.personalPhone} />
                            <InputField type="tel" label="Father's Phone" name="fatherPhone" value={formData.fatherPhone} onChange={handleChange} error={errors.fatherPhone} />
                            <InputField type="tel" label="Mother's Phone" name="motherPhone" value={formData.motherPhone} onChange={handleChange} error={errors.motherPhone} />
                        </div>
                        <div className="mt-4">
                            <InputField type="email" label="Email" name="email" value={formData.email} onChange={handleChange} error={errors.email} />
                        </div>
                        <div className="mt-4">
                            <TextareaField label="Address" name="address" value={formData.address} onChange={handleChange} />
                        </div>
                    </div>
                    
                    {/* Notes */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <TextareaField label="Notes (Private)" name="notes" value={formData.notes} onChange={handleChange} />
                    </div>

                    <div className="flex justify-end space-x-4 pt-6">
                       <button type="button" onClick={onCancel} className="py-2 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Cancel</button>
                       <button 
                            type="submit"
                            disabled={isSaving}
                            className="h-10 px-4 rounded-md bg-brand-blue text-white hover:bg-blue-600 text-sm font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[110px]"
                        >
                            {isSaving ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : (
                                'Save Student'
                            )}
                        </button>
                   </div>
               </form>
           </div>
       </div>
    );
};

export default StudentForm;