import React, { useState, useMemo } from 'react';
import { useStudent } from '../context/StudentContext';
import { Student } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';

interface AssignVideoStudentSelectModalProps {
    onClose: () => void;
    onSelectStudent: (student: Student) => void;
}

const AssignVideoStudentSelectModal: React.FC<AssignVideoStudentSelectModalProps> = ({ onClose, onSelectStudent }) => {
    const { students } = useStudent();
    const [searchQuery, setSearchQuery] = useState('');

    const activeStudents = useMemo(() => students.filter(s => !s.isArchived), [students]);

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return activeStudents;
        return activeStudents.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [activeStudents, searchQuery]);

    // Card component for students in the grid
    const StudentGridCard: React.FC<{ student: Student, onClick: () => void }> = ({ student, onClick }) => (
        <div 
            onClick={onClick} 
            className="group flex flex-col items-center text-center gap-2 p-4 rounded-xl cursor-pointer hover:bg-muted border border-transparent hover:border-border transition-all duration-200"
            role="button"
            aria-label={`Select student ${student.name}`}
        >
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-offset-2 ring-offset-card ring-transparent group-hover:ring-primary transition-all duration-200">
                {student.avatarUrl ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
            </div>
            <div className="w-full">
                <p className="font-semibold text-foreground truncate" title={student.name}>{student.name}</p>
                <p className="text-xs text-muted-foreground">Grade {student.grade} • {student.board}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-card/90 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl p-6 w-full max-w-4xl h-[80vh] flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold text-foreground mb-4 flex-shrink-0">Select a Student to Assign Video</h3>
                <input
                    type="search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search for a student..."
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background mb-4 flex-shrink-0"
                    autoFocus
                />
                <div className="flex-grow overflow-y-auto thin-scrollbar pr-2 -mr-4">
                    {filteredStudents.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {filteredStudents.map(student => (
                                <StudentGridCard key={student.id} student={student} onClick={() => onSelectStudent(student)} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No students found.</p>
                    )}
                </div>
                <div className="mt-6 flex justify-end flex-shrink-0">
                    <button onClick={onClose} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default AssignVideoStudentSelectModal;
