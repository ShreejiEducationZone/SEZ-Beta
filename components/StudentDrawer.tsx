import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';
import ConfirmDeleteModal from './ConfirmDeleteModal';

interface StudentDrawerProps {
    student: Student | null;
    onClose: () => void;
    onEdit: (student: Student) => void;
    onArchive: (id: string) => void;
    onDelete: (id: string) => void;
}

const StudentDrawer: React.FC<StudentDrawerProps> = ({ student, onClose, onEdit, onArchive, onDelete }) => {
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    
    useEffect(() => {
        if (!student) setIsConfirmModalOpen(false);
    }, [student]);
    
    if (!student) return null;

    const [activeTab, setActiveTab] = useState('Personal');
    const tabs = ['Personal', 'Contact', 'Notes'];
    const activeTabIndex = tabs.indexOf(activeTab);

    const calculateAge = (dob: string | undefined): string => {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age.toString();
    };
    
    const handleDeleteClick = () => setIsConfirmModalOpen(true);
    const handleConfirmDelete = () => { onDelete(student.id); setIsConfirmModalOpen(false); onClose(); };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose}></div>
            <div
                className="fixed top-0 right-0 w-full max-w-md h-full bg-card/80 dark:bg-card/70 backdrop-blur-lg border-l border-border shadow-2xl p-6 flex flex-col transition-transform duration-300 ease-in-out translate-x-0 z-50 rounded-l-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">&times;</button>
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex-shrink-0">
                            {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{student.name}</h2>
                            <p className="text-muted-foreground">{student.board} • Grade {student.grade}</p>
                        </div>
                    </div>
                    
                    <div className="relative flex items-center bg-muted p-1 rounded-full">
                        <div className="absolute h-[calc(100%-0.5rem)] w-1/3 bg-background rounded-full shadow-soft transition-transform duration-300" style={{ transform: `translateX(${activeTabIndex * 100}%)` }}></div>
                        {tabs.map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`relative w-1/3 z-10 py-1.5 text-sm font-semibold transition-colors ${activeTab === tab ? 'text-foreground' : 'text-muted-foreground'}`}>{tab}</button>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex-grow overflow-y-auto thin-scrollbar pr-2 -mr-4">
                    {activeTab === 'Personal' && (
                        <div className="space-y-4">
                            <div><strong className="text-muted-foreground w-28 inline-block">Gender:</strong> {student.gender || 'N/A'}</div>
                            <div><strong className="text-muted-foreground w-28 inline-block">Date of Birth:</strong> {student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : 'N/A'}</div>
                            <div><strong className="text-muted-foreground w-28 inline-block">Age:</strong> {calculateAge(student.dob)}</div>
                            <div className="border-t border-border my-4"></div>
                            <div><strong className="text-muted-foreground w-28 inline-block">Grade:</strong> {student.grade}</div>
                            {student.programStage && <div><strong className="text-muted-foreground w-28 inline-block">Program:</strong> {student.programStage}</div>}
                            <div><strong className="text-muted-foreground w-28 inline-block">School:</strong> {student.school}</div>
                            {student.branch && <div><strong className="text-muted-foreground w-28 inline-block">Branch:</strong> {student.branch}</div>}
                            <div><strong className="text-muted-foreground w-28 inline-block">Batch:</strong> {student.batch}</div>
                            <div><strong className="text-muted-foreground w-28 inline-block">Time Slot:</strong> {student.timeSlot}</div>
                        </div>
                    )}
                    {activeTab === 'Contact' && (
                        <div className="space-y-4">
                            <div><strong className="text-muted-foreground w-28 inline-block">Father's Name:</strong> {student.fatherName || 'N/A'}</div>
                            <div><strong className="text-muted-foreground w-28 inline-block">Mother's Name:</strong> {student.motherName || 'N/A'}</div>
                            <div><strong className="text-muted-foreground w-28 inline-block">Occupation:</strong> {student.occupation || 'N/A'}</div>
                            <div className="border-t border-border my-4"></div>
                            <div><strong className="text-muted-foreground w-28 inline-block">Email:</strong> {student.email || 'N/A'}</div>
                            <div><strong className="text-muted-foreground w-28 inline-block">Personal Phone:</strong> {student.personalPhone || 'N/A'}</div>
                            <div><strong className="text-muted-foreground w-28 inline-block">Father's Phone:</strong> {student.fatherPhone || 'N/A'}</div>
                            <div><strong className="text-muted-foreground w-28 inline-block">Mother's Phone:</strong> {student.motherPhone || 'N/A'}</div>
                            <div><strong className="text-muted-foreground w-28 inline-block align-top">Address:</strong> <span className="inline-block w-60">{student.address || 'N/A'}</span></div>
                        </div>
                    )}
                    {activeTab === 'Notes' && (
                        <div className="whitespace-pre-wrap text-card-foreground">
                            {student.notes ? student.notes : <p className="text-muted-foreground italic">No notes added yet. Click 'Edit' to add notes.</p>}
                        </div>
                    )}
                </div>

                <div className="mt-6 flex-shrink-0 flex space-x-2">
                    <button onClick={() => onArchive(student.id)} className="flex-1 py-2 px-4 rounded-lg bg-warning text-warning-foreground hover:bg-warning/90 transition-colors">{student.isArchived ? 'Unarchive' : 'Archive'}</button>
                    <button onClick={() => onEdit(student)} className="flex-1 py-2 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Edit</button>
                    {student.isArchived && <button onClick={handleDeleteClick} title="Delete Student Permanently" className="flex-1 py-2 px-4 rounded-lg bg-danger text-danger-foreground hover:bg-danger/90 transition-colors">Delete</button>}
                </div>
            </div>

            <ConfirmDeleteModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmDelete} studentName={student.name} />
        </>
    );
};

export default StudentDrawer;