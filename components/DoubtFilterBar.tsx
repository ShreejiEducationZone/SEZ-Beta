import React, { useState, useEffect, useRef } from 'react';
import { Student, DoubtPriority, DoubtStatus, Board } from '../types';
import SelectField from './form/SelectField';

interface DoubtFilterBarProps {
    filters: {
        subject: string;
        priority: string;
        status: string;
        board: string;
        grade: string;
        batch: string;
        searchQuery: string;
    };
    onFilterChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSuggestionSelect: (name: string) => void;
    onClearFilters: () => void;
    studentSuggestions: Student[];
    allSubjects: string[];
    allPriorities: readonly DoubtPriority[];
    allStatuses: readonly DoubtStatus[];
    allBoards: readonly Board[];
    allGrades: string[];
    allBatches: string[];
}

const DoubtFilterBar: React.FC<DoubtFilterBarProps> = ({
    filters,
    onFilterChange,
    onSearchChange,
    onSuggestionSelect,
    onClearFilters,
    studentSuggestions,
    allSubjects,
    allPriorities,
    allStatuses,
    allBoards,
    allGrades,
    allBatches
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSearchChange(e);
        setShowSuggestions(true);
    };

    return (
        <div className="bg-light-card dark:bg-dark-card p-4 rounded-xl shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
            {/* Search Bar */}
            <div className="relative sm:col-span-2 md:col-span-4 lg:col-span-2" ref={searchRef}>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Search by Student Name
                </label>
                <div className="mt-1 relative rounded-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        name="searchQuery"
                        id="search"
                        autoComplete="off"
                        className="block w-full h-10 pl-10 pr-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 text-sm dark:bg-gray-700 dark:border-gray-600"
                        placeholder="e.g. Priya Patel"
                        value={filters.searchQuery}
                        onChange={handleSearchInputChange}
                        onFocus={() => setShowSuggestions(true)}
                    />
                    {showSuggestions && studentSuggestions.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md mt-1 shadow-lg max-h-60 overflow-auto">
                            {studentSuggestions.map(student => (
                                <li
                                    key={student.id}
                                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onMouseDown={() => {
                                        onSuggestionSelect(student.name);
                                        setShowSuggestions(false);
                                    }}
                                >
                                    {student.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Filters */}
            <SelectField name="subject" value={filters.subject} onChange={onFilterChange} options={allSubjects} label="Subject" />
            <SelectField name="priority" value={filters.priority} onChange={onFilterChange} options={allPriorities} label="Priority" />
            <SelectField name="status" value={filters.status} onChange={onFilterChange} options={allStatuses} label="Status" />
            <SelectField name="board" value={filters.board} onChange={onFilterChange} options={allBoards} label="Board" />
            <SelectField name="grade" value={filters.grade} onChange={onFilterChange} options={allGrades} label="Grade" />
            
            {/* Clear Button */}
            <div>
                <button
                    onClick={onClearFilters}
                    className="w-full h-10 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-medium"
                >
                    Clear All
                </button>
            </div>
        </div>
    );
};

export default DoubtFilterBar;
