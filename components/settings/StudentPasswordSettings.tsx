import React, { useState } from 'react';
import { Student } from '../../types';
import PlaceholderAvatar from '../PlaceholderAvatar';
import ChevronRightIcon from '../icons/ChevronRightIcon';
import EyeIcon from '../icons/EyeIcon';
import EyeSlashIcon from '../icons/EyeSlashIcon';
import { FaKey } from 'react-icons/fa';


interface PasswordManagerModalProps {
    student: Student;
    onSave: (student: Student) => void;
    onClose: () => void;
}

const PasswordManagerModal: React.FC<PasswordManagerModalProps> = ({ student, onSave, onClose }) => {
    const [password, setPassword] = useState(student.password || '');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const generatePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let newPassword = '';
        for (let i = 0; i < 8; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(newPassword);
    };

    const handleSave = () => {
        const updatedStudent: Student = { ...student, password: password.trim() ? password.trim() : undefined };
        onSave(updatedStudent);
        onClose();
    };

    const handleRemove = () => {
        const updatedStudent: Student = { ...student };
        delete updatedStudent.password;
        onSave(updatedStudent);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card/80 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-foreground mb-2">Manage Password</h2>
                <p className="text-muted-foreground mb-4">for {student.name}</p>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="password-input" className="text-sm font-medium text-muted-foreground">Password</label>
                        <div className="relative mt-1">
                            <input
                                id="password-input"
                                type={isPasswordVisible ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-12 px-4 rounded-lg border border-border bg-background pr-10 focus:ring-2 focus:ring-primary/50"
                            />
                            <button
                                type="button"
                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground"
                            >
                                {isPasswordVisible ? <EyeSlashIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={generatePassword}
                        className="w-full h-10 px-4 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-primary/10"
                    >
                        Generate Secure Password
                    </button>
                </div>
                
                <div className="flex items-center gap-3 mt-6">
                    <button onClick={onClose} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold flex-grow">Cancel</button>
                    {(student.password || password) && (
                        <button onClick={handleRemove} className="h-10 px-4 rounded-lg bg-danger text-danger-foreground hover:bg-danger/90 text-sm font-semibold">Remove</button>
                    )}
                    <button onClick={handleSave} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold flex-grow">Save</button>
                </div>
            </div>
        </div>
    );
};


interface StudentPasswordSettingsProps {
    students: Student[];
    onSaveStudent: (student: Student) => void;
}

const StudentPasswordSettings: React.FC<StudentPasswordSettingsProps> = ({ students, onSaveStudent }) => {
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    return (
        <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-8">Student Passwords</h2>
            <div className="bg-muted/50 rounded-xl border border-border">
                {students.map((student, index) => (
                    <div key={student.id} className={`flex items-center justify-between p-3 ${index > 0 ? 'border-t border-border' : ''}`}>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{student.name}</p>
                                 <div className={`flex items-center gap-1.5 text-xs font-medium ${student.password ? 'text-success' : 'text-warning'}`}>
                                    <FaKey className="h-3 w-3" />
                                    <span>{student.password ? 'Password set' : 'Not set'}</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedStudent(student)} 
                            className="flex items-center gap-1 h-8 px-4 rounded-lg bg-background border border-border hover:bg-border text-sm font-semibold text-foreground"
                        >
                            Manage
                            <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                ))}
                 {students.length === 0 && <p className="text-center text-muted-foreground p-8">No active students found.</p>}
            </div>
            {selectedStudent && (
                <PasswordManagerModal
                    student={selectedStudent}
                    onSave={onSaveStudent}
                    onClose={() => setSelectedStudent(null)}
                />
            )}
        </div>
    );
};

export default StudentPasswordSettings;