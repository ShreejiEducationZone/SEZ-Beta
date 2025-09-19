import React, { useState, useMemo } from 'react';
import { Test } from '../types';
import { TEST_TYPES } from '../constants';
import SelectField from './form/SelectField';
import InputField from './form/InputField';
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
        testType: '',
        minScore: '',
        status: 'All'
    });
    
    const uniqueSubjects = useMemo(() => Array.from(new Set(tests.map(t => t.subject))).sort(), [tests]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const filteredTests = useMemo(() => {
        return tests.filter(test => {
            if (filters.subject && test.subject !== filters.subject) return false;
            if (filters.testType && test.testType !== filters.testType) return false;
            
            const score = (test.marksObtained != null && test.totalMarks != null && test.totalMarks > 0)
                ? (test.marksObtained / test.totalMarks) * 100
                : null;
            
            if (filters.minScore && (score == null || score < parseInt(filters.minScore, 10))) return false;
            if (filters.status === 'Retests' && test.retestRequired !== 'Yes') return false;
            if (filters.status === 'Low Score' && (score == null || score >= 60)) return false;
            
            return true;
        }).sort((a,b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());
    }, [tests, filters]);

    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-sm">
            <h3 className="text-xl font-bold mb-4">Completed Test Log</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 items-end">
                <SelectField label="Subject" name="subject" value={filters.subject} onChange={handleFilterChange} options={uniqueSubjects} />
                <SelectField label="Test Type" name="testType" value={filters.testType} onChange={handleFilterChange} options={TEST_TYPES} />
                <InputField label="Min Score %" name="minScore" type="number" value={filters.minScore} onChange={handleFilterChange} />
                <SelectField label="Status" name="status" value={filters.status} onChange={handleFilterChange} options={['All', 'Retests', 'Low Score']} />
                <button
                    onClick={() => setFilters({ subject: '', testType: '', minScore: '', status: 'All' })}
                    className="h-10 px-4 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-medium"
                >
                    Clear
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
                                    <td className={`px-4 py-3 font-semibold ${isLowScore ? 'text-red-500' : ''}`}>{score != null ? `${score}%` : 'N/A'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {test.retestRequired === 'Yes' && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Retest</span>}
                                            {isLowScore && <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Low Score</span>}
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
