import React from 'react';
import SelectField from './form/SelectField';

interface ReportsFilterBarProps {
    filters: {
        searchQuery: string;
        strongestSubject: string;
    };
    onFilterChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onClearFilters: () => void;
    allSubjects: string[];
}

const ReportsFilterBar: React.FC<ReportsFilterBarProps> = ({ filters, onFilterChange, onClearFilters, allSubjects }) => {
    return (
        <div className="bg-light-card dark:bg-dark-card p-4 rounded-2xl shadow-sm mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Search Bar */}
            <div className="relative lg:col-span-2">
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
                        className="block w-full h-10 pl-10 pr-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-brand-blue"
                        placeholder="e.g. Rohan Sharma"
                        value={filters.searchQuery}
                        onChange={onFilterChange}
                    />
                </div>
            </div>

            {/* Filters */}
            <SelectField name="strongestSubject" value={filters.strongestSubject} onChange={onFilterChange} options={allSubjects} label="Strongest Subject" />
            
            {/* Clear Button */}
            <div>
                <button 
                    onClick={onClearFilters}
                    className="w-full h-10 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-medium"
                >
                    Clear Filters
                </button>
            </div>
        </div>
    );
};

export default ReportsFilterBar;