
import React, { useMemo, useState } from 'react';
import { Test } from '../types';
import StarIcon from './icons/StarIcon';

interface OverallStrengthsWeaknessesProps {
    tests: Test[];
}

const OverallStrengthsWeaknesses: React.FC<OverallStrengthsWeaknessesProps> = ({ tests }) => {
    const [selectedSubject, setSelectedSubject] = useState('All');

    const { allSubjects, fullAnalysis } = useMemo(() => {
        const scoreMap: Record<string, Record<string, number>> = {}; // { subject: { area: score } }

        tests.forEach(test => {
            const subject = test.subject;
            if (!scoreMap[subject]) {
                scoreMap[subject] = {};
            }

            const getAreasAsArray = (areas: string | string[] | undefined): string[] => {
                if (!areas) return [];
                if (Array.isArray(areas)) return areas;
                return [String(areas)];
            };

            const strongAreas = getAreasAsArray(test.strongArea);
            const weakAreas = getAreasAsArray(test.weakArea);

            strongAreas.forEach(area => {
                scoreMap[subject][area] = (scoreMap[subject][area] || 0) + 1;
            });

            weakAreas.forEach(area => {
                scoreMap[subject][area] = (scoreMap[subject][area] || 0) - 1;
            });
        });

        const strong: Record<string, { area: string; count: number }[]> = {};
        const weak: Record<string, { area: string; count: number }[]> = {};

        Object.entries(scoreMap).forEach(([subject, areas]) => {
            Object.entries(areas).forEach(([area, score]) => {
                if (score > 0) {
                    if (!strong[subject]) strong[subject] = [];
                    strong[subject].push({ area, count: score });
                } else if (score < 0) {
                    if (!weak[subject]) weak[subject] = [];
                    weak[subject].push({ area, count: Math.abs(score) });
                }
            });
        });

        for (const subject in strong) {
            strong[subject].sort((a, b) => b.count - a.count);
        }
        for (const subject in weak) {
            weak[subject].sort((a, b) => b.count - a.count);
        }
        
        const subjects = new Set([...Object.keys(strong), ...Object.keys(weak)]);

        return {
            allSubjects: Array.from(subjects).sort(),
            fullAnalysis: { strong, weak }
        };
    }, [tests]);

    const analysis = useMemo(() => {
        if (selectedSubject === 'All') {
            return fullAnalysis;
        }
        const strong = fullAnalysis.strong[selectedSubject] ? { [selectedSubject]: fullAnalysis.strong[selectedSubject] } : {};
        const weak = fullAnalysis.weak[selectedSubject] ? { [selectedSubject]: fullAnalysis.weak[selectedSubject] } : {};
        return { strong, weak };
    }, [selectedSubject, fullAnalysis]);


    const hasStrongData = Object.keys(analysis.strong).length > 0;
    const hasWeakData = Object.keys(analysis.weak).length > 0;
    const hasAnyData = Object.keys(fullAnalysis.strong).length > 0 || Object.keys(fullAnalysis.weak).length > 0;

    return (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-bold">Overall Strengths & Weaknesses</h3>
                <div className="w-full sm:w-56">
                    <label htmlFor="subject-filter" className="sr-only">Filter by subject</label>
                    <select
                        id="subject-filter"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-brand-blue"
                    >
                        <option value="All">All Subjects</option>
                        {allSubjects.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strong Areas Column */}
                <div>
                    <h4 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-3 pb-2 border-b-2 border-green-200 dark:border-green-800">Strong Areas</h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto thin-scrollbar pr-2">
                        {hasStrongData ? (
                            Object.entries(analysis.strong).map(([subject, areas]: [string, { area: string; count: number }[]]) => (
                                <div key={subject}>
                                    <h5 className="font-semibold text-gray-700 dark:text-gray-300">{subject}</h5>
                                    <div className="mt-2 space-y-2">
                                        {areas.map(({ area, count }) => (
                                            <div key={area} className="flex justify-between items-center text-sm p-2 rounded-md bg-green-50 dark:bg-green-500/10">
                                                <span>{area}</span>
                                                <div className="flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-300" title={`${count} net positive ratings`}>
                                                    <span>({count})</span>
                                                    <StarIcon className="h-4 w-4 text-yellow-400" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic mt-4">No strong areas for this selection.</p>
                        )}
                    </div>
                </div>

                {/* Weak Areas Column */}
                <div>
                    <h4 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3 pb-2 border-b-2 border-red-200 dark:border-red-800">Weak Areas</h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto thin-scrollbar pr-2">
                        {hasWeakData ? (
                            Object.entries(analysis.weak).map(([subject, areas]: [string, { area: string; count: number }[]]) => (
                                <div key={subject}>
                                    <h5 className="font-semibold text-gray-700 dark:text-gray-300">{subject}</h5>
                                    <div className="mt-2 space-y-2">
                                        {areas.map(({ area, count }) => (
                                            <div key={area} className="flex justify-between items-center text-sm p-2 rounded-md bg-red-50 dark:bg-red-500/10">
                                                <span>{area}</span>
                                                 <div className="flex items-center gap-1 text-xs font-bold text-red-700 dark:text-red-300" title={`${count} net negative ratings`}>
                                                    <span>({count})</span>
                                                    <StarIcon className="h-4 w-4 text-gray-400 dark:text-gray-600" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic mt-4">No weak areas for this selection.</p>
                        )}
                    </div>
                </div>
            </div>
             {!hasAnyData && (
                <div className="text-center py-10 text-gray-500">
                    <p>Log completed tests with strong/weak areas to see the analysis.</p>
                </div>
            )}
        </div>
    );
};

export default OverallStrengthsWeaknesses;