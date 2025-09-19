
import React, { useState, useEffect } from 'react';
import { Student, Board } from '../types';
import { BOARDS, GRADES, TIME_SLOTS } from '../constants';
import { getProgramStage, getBatchFromTime } from '../utils/studentUtils';
import InputField from './form/InputField';
import SelectField from './form/SelectField';
import TextareaField from './form/TextareaField';
import PlaceholderAvatar from './PlaceholderAvatar';

interface StudentFormProps {
    student: Partial<Student> | null;
    onSave: (student: Student) => void;
    onCancel: () => void;
}

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
    });
    
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        const programStage = getProgramStage(formData.board as Board, formData.grade);
        const batch = getBatchFromTime(formData.timeSlot);
        setFormData(prev => ({ ...prev, programStage: programStage || '', batch }));
    }, [formData.board, formData.grade, formData.timeSlot]);
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const validate = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name.trim()) newErrors.name = 'Full Name is required';
        if (!formData.school.trim()) newErrors.school = 'School is required';
        if (!formData.board) newErrors.board = 'Board is required';
        if (!formData.grade) newErrors.grade = 'Grade is required';
        if (!formData.timeSlot) newErrors.timeSlot = 'Time Slot is required';
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSave({
                ...formData,
                id: formData.id || `s_${Date.now()}`,
            } as Student);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
           <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
               <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'Edit Student' : 'Add New Student'}</h2>
               <form onSubmit={handleSubmit} className="space-y-4">
                   <div className="flex items-center space-x-6">
                       <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                           {formData.avatarUrl ? <img src={formData.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" /> : <PlaceholderAvatar/>}
                       </div>
                       <label className="block">
                           <span className="sr-only">Choose profile photo</span>
                           <input type="file" onChange={handleAvatarChange} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-blue-700"/>
                       </label>
                   </div>
                   <InputField label="Full Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} required />
                   <InputField label="School" name="school" value={formData.school} onChange={handleChange} error={errors.school} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <SelectField label="Board" name="board" value={formData.board} onChange={handleChange} options={BOARDS} error={errors.board} required />
                       <SelectField label="Grade" name="grade" value={formData.grade} onChange={handleChange} options={GRADES} error={errors.grade} required />
                   </div>
                    {(formData.board === 'Cambridge' || formData.board === 'IB') && (
                       <InputField label="Program Stage" name="programStage" value={formData.programStage || 'Auto-filled'} readOnly />
                   )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectField label="Time Slot" name="timeSlot" value={formData.timeSlot} onChange={handleChange} options={TIME_SLOTS} error={errors.timeSlot} required />
                        <InputField label="Batch" name="batch" value={formData.batch || 'Auto-filled'} readOnly />
                    </div>
                    <h3 className="text-lg font-semibold pt-4 border-t border-gray-200 dark:border-gray-700">Contact Details (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField type="tel" label="Personal Phone" name="personalPhone" value={formData.personalPhone} onChange={handleChange} error={errors.personalPhone} />
                        <InputField type="tel" label="Father's Phone" name="fatherPhone" value={formData.fatherPhone} onChange={handleChange} error={errors.fatherPhone} />
                        <InputField type="tel" label="Mother's Phone" name="motherPhone" value={formData.motherPhone} onChange={handleChange} error={errors.motherPhone} />
                    </div>
                   <TextareaField label="Address" name="address" value={formData.address} onChange={handleChange} />
                    <div className="flex justify-end space-x-4 pt-6">
                       <button type="button" onClick={onCancel} className="py-2 px-5 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold">Cancel</button>
                       <button type="submit" className="h-10 px-4 rounded-md bg-brand-blue text-white hover:bg-blue-600 text-sm font-semibold">Save</button>
                   </div>
               </form>
           </div>
       </div>
    );
};

export default StudentForm;
