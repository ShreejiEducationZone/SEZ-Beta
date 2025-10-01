
import React from 'react';
import { BOARDS, GRADES, BATCHES } from '../constants';
import SelectField from './form/SelectField';

interface FilterBarProps {
    filters: { board: string; grade?: string; batch: string; status?: string; };
    onFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onClearFilters: () => void;
    searchQuery: string;
    onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    statusOptions?: readonly string[];
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onClearFilters, searchQuery, onSearchChange, statusOptions }) => (
    <div className="bg-light-card dark:bg-dark-card p-4 rounded-2xl shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
        {/* Search Bar */}
        <div className="relative md:col-span-3 lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Search by Name
            </label>
            <div className="mt-1 relative rounded-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                </div>
                <input
                    type="text"
                    name="search"
                    id="search"
                    className="block w-full h-10 pl-10 pr-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors duration-200"
                    placeholder="e.g. Rohan Sharma"
                    value={searchQuery}
                    onChange={onSearchChange}
                />
            </div>
        </div>

        {/* Filters */}
        <SelectField name="board" value={filters.board} onChange={onFilterChange} options={BOARDS} label="Board" />
        {filters.grade !== undefined && <SelectField name="grade" value={filters.grade} onChange={onFilterChange} options={GRADES} label="Grade" />}
        <SelectField name="batch" value={filters.batch} onChange={onFilterChange} options={BATCHES} label="Batch" />
        {filters.status !== undefined && statusOptions && (
            <SelectField name="status" value={filters.status} onChange={onFilterChange} options={statusOptions} label="Status" />
        )}
        
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

export default FilterBar;