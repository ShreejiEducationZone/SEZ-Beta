import React, { useState, useMemo } from 'react';
import { Test } from '../types';
import SelectField from './form/SelectField';
import EditIcon from './icons/EditIcon';
import DeleteIcon from './icons/DeleteIcon';

interface CompletedTestsTableProps {
    tests: Test[];
    onTestSelect: (test: Test) => void;
    onEditTest: (test: Test) => void;
    onDeleteTest: (testId: string) => void;
}

const CompletedTestsTable: React.FC<CompletedTestsTableProps> = ({ tests, onTestSelect, onEditTest, onDeleteTest }) => {
    const [filters, setFilters] = useState({
        subject: '',
        tag: 'All',
    });
    
    const uniqueSubjects = useMemo(() => Array.from(new Set(tests.map(t => t.subject))).sort(), [tests]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const clearFilters = () => {
        setFilters({ subject: '', tag: 'All' });
    };

    const TAG_OPTIONS = ['All', 'Good Score', 'Medium Score', 'Low Score', 'Absent', 'Retest'];

    const filteredTests = useMemo(() => {
        return tests.filter(test => {
            if (filters.subject && test.subject !== filters.subject) return false;
            
            const score = (test.marksObtained != null && test.totalMarks != null && test.totalMarks > 0)
                ? (test.marksObtained / test.totalMarks) * 100
                : null;
            
            switch (filters.tag) {
                case 'Good Score':
                    if (score == null || score < 80) return false;
                    break;
                case 'Medium Score':
                    if (score == null || score < 60 || score >= 80) return false;
                    break;
                case 'Low Score':
                    if (score == null || score >= 60) return false;
                    break;
                case 'Absent':
                    if (test.status !== 'Absent') return false;
                    break;
                case 'Retest':
                    if (test.retestRequired !== 'Yes') return false;
                    break;
                default:
                    break;
            }
            
            return true;
        }).sort((a,b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
    }, [tests, filters]);

    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold mb-4">Completed Test Log</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 items-end">
                <SelectField label="Subject" name="subject" value={filters.subject} onChange={handleFilterChange} options={uniqueSubjects} />
                <SelectField label="Tags" name="tag" value={filters.tag} onChange={handleFilterChange} options={TAG_OPTIONS} />
                <button
                    onClick={clearFilters}
                    className="h-10 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-medium"
                >
                    Clear Filters
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50 dark:bg-white/10 text-xs text-gray-700 dark:text-gray-300 uppercase">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Test Title</th>
                            <th className="px-4 py-3">Subject</th>
                            <th className="px-4 py-3">Score</th>
                            <th className="px-4 py-3">Tags</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTests.map(test => {
                            const score = (test.marksObtained != null && test.totalMarks != null && test.totalMarks > 0)
                                ? Math.round((test.marksObtained / test.totalMarks) * 100)
                                : null;
                            const isLowScore = score != null && score < 60;
                            
                            return (
                                <tr key={test.id} onClick={() => onTestSelect(test)} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                                    <td className="px-4 py-3">{new Date(test.testDate).toLocaleDateString('en-CA', {timeZone: 'UTC'})}</td>
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{test.title}</td>
                                    <td className="px-4 py-3">{test.subject}</td>
                                    <td className={`px-4 py-3 font-semibold ${isLowScore ? 'text-red-500' : ''}`}>
                                        {test.status === 'Absent' ? 'Absent' : score != null ? `${score}%` : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {test.status === 'Absent' ? (
                                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Absent</span>
                                            ) : score !== null ? (
                                                score >= 80 ? (
                                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Good Score</span>
                                                ) : score >= 60 ? (
                                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Medium Score</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Low Score</span>
                                                )
                                            ) : null}
                                            {test.retestRequired === 'Yes' && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Retest</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end">
                                            <button onClick={(e) => { e.stopPropagation(); onEditTest(test); }} title="Edit" className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"><EditIcon className="h-4 w-4" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); onDeleteTest(test.id); }} title="Delete" className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md"><DeleteIcon className="h-4 w-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                         {filteredTests.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500">No completed tests match the filters.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CompletedTestsTable;
