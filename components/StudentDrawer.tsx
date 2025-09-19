import React, { useState, useEffect } from 'react';
import { Student } from '../types';
import PlaceholderAvatar from './PlaceholderAvatar';

interface StudentDrawerProps {
    student: Student | null;
    onClose: () => void;
    onEdit: (student: Student) => void;
    onArchive: (id: string) => void;
    onDelete: (id: string) => void;
}

const StudentDrawer: React.FC<StudentDrawerProps> = ({ student, onClose, onEdit, onArchive, onDelete }) => {
    if (!student) return null;

    const [activeTab, setActiveTab] = useState('Personal');
    const tabs: { [key: string]: number } = { 'Personal': 1, 'Contact': 1, 'Notes': 1 };

    useEffect(() => {
        console.log("StudentDrawer mounted for:", student?.name, "ID:", student?.id);
    }, [student]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-end" onClick={onClose}>
            <div
                className="w-full max-w-md h-full bg-light-card dark:bg-dark-card shadow-2xl p-6 flex flex-col transform transition-transform duration-300 translate-x-0"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 dark:hover:text-white text-3xl font-light">&times;</button>
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                            {student.avatarUrl
                                ? <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                                : <PlaceholderAvatar />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{student.name}</h2>
                            <p className="text-gray-600 dark:text-gray-400">{student.board} • Grade {student.grade}</p>
                        </div>
                    </div>

                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8">
                            {Object.keys(tabs).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === tab
                                            ? 'border-brand-blue text-brand-blue dark:border-brand-blue dark:text-brand-blue'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 dark:text-gray-400 dark:hover:border-gray-500'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                <div className="mt-6 flex-grow overflow-y-auto">
                    {activeTab === 'Personal' && (
                        <div className="space-y-4">
                            <div><strong className="text-gray-500 dark:text-gray-400 w-28 inline-block">Grade:</strong> {student.grade}</div>
                            {student.programStage && (
                                <div><strong className="text-gray-500 dark:text-gray-400 w-28 inline-block">Program:</strong> {student.programStage}</div>
                            )}
                            <div><strong className="text-gray-500 dark:text-gray-400 w-28 inline-block">School:</strong> {student.school}</div>
                            <div><strong className="text-gray-500 dark:text-gray-400 w-28 inline-block">Batch:</strong> {student.batch}</div>
                            <div><strong className="text-gray-500 dark:text-gray-400 w-28 inline-block">Time Slot:</strong> {student.timeSlot}</div>
                        </div>
                    )}

                    {activeTab === 'Contact' && (
                        <div className="space-y-4">
                            <div><strong className="text-gray-500 dark:text-gray-400 w-28 inline-block">Personal:</strong> {student.personalPhone || 'N/A'}</div>
                            <div><strong className="text-gray-500 dark:text-gray-400 w-28 inline-block">Father:</strong> {student.fatherPhone || 'N/A'}</div>
                            <div><strong className="text-gray-500 dark:text-gray-400 w-28 inline-block">Mother:</strong> {student.motherPhone || 'N/A'}</div>
                            <div><strong className="text-gray-500 dark:text-gray-400 w-28 inline-block align-top">Address:</strong> <span className="inline-block w-60">{student.address || 'N/A'}</span></div>
                        </div>
                    )}

                    {activeTab === 'Notes' && (
                        <p className="text-gray-500 dark:text-gray-400">This is a read-only notes section. No editing here.</p>
                    )}
                </div>

                <div className="mt-6 flex-shrink-0 flex space-x-2">
                    {/* Archive Button */}
                    <button
                        onClick={() => onArchive(student.id)}
                        className="flex-1 py-2 px-4 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors"
                    >
                        {student.isArchived ? 'Unarchive' : 'Archive'}
                    </button>

                    {/* Edit Button */}
                    <button
                        onClick={() => onEdit(student)}
                        className="flex-1 py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                        Edit
                    </button>

                    {/* Delete Button — Only for Archived Students */}
                    {student.isArchived && (
                        <button
                            onClick={() => {
                                console.log("Deleting student ID:", student.id);
                                onDelete(student.id);
                            }}
                            title="Delete Student Permanently"
                            className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDrawer;