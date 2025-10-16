import React, { useMemo, useState } from 'react';
import { Test, SubjectData, SyllabusNode } from '../types';
import StarIcon from './icons/StarIcon';
import SelectField from './form/SelectField';

interface OverallStrengthsWeaknessesProps {
    tests: Test[];
    studentSubjects: SubjectData[];
}

const OverallStrengthsWeaknesses: React.FC<OverallStrengthsWeaknessesProps> = ({ tests, studentSubjects }) => {
    const [selectedSubject, setSelectedSubject] = useState('All');

    const syllabusMap = useMemo(() => {
        const map = new Map<string, Map<string, string>>();
        studentSubjects.forEach(subjectData => {
            const nodeMap = new Map<string, string>();
            const recurse = (nodes: SyllabusNode[]) => {
                nodes.forEach(node => {
                    nodeMap.set(String(node.no), node.name);
                    if (node.children) recurse(node.children);
                });
            };
            recurse(subjectData.chapters);
            map.set(subjectData.subject, nodeMap);
        });
        return map;
    }, [studentSubjects]);

    const { allSubjects, fullAnalysis } = useMemo(() => {
        const scoreMap: Record<string, Record<string, number>> = {}; // { subject: { areaNodeNo: score } }

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
        <div className="bg-card p-6 rounded-2xl shadow-soft border border-border">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-bold">Overall Strengths & Weaknesses</h3>
                <div className="w-full sm:w-56">
                    <SelectField
                        label="Filter by subject"
                        name="subject-filter"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        options={['All', ...allSubjects]}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strong Areas Column */}
                <div>
                    <h4 className="text-lg font-semibold text-success mb-3 pb-2 border-b-2 border-success/20">Strong Areas</h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto thin-scrollbar pr-2">
                        {hasStrongData ? (
                            Object.entries(analysis.strong).map(([subject, areas]: [string, { area: string; count: number }[]]) => {
                                const subjectNodeMap = syllabusMap.get(subject);
                                return (
                                <div key={subject}>
                                    <h5 className="font-semibold text-muted-foreground">{subject}</h5>
                                    <div className="mt-2 space-y-2">
                                        {areas.map(({ area, count }) => (
                                            <div key={area} className="flex justify-between items-center text-sm p-2 rounded-md bg-success-muted">
                                                <span className="font-medium text-success-muted-foreground">{subjectNodeMap?.get(area) ? `${area}. ${subjectNodeMap.get(area)}` : `Area #${area}`}</span>
                                                <div className="flex items-center gap-1 text-xs font-bold text-success" title={`${count} net positive ratings`}>
                                                    <span>({count})</span>
                                                    <StarIcon className="h-4 w-4 text-yellow-400" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )})
                        ) : (
                            <p className="text-sm text-muted-foreground italic mt-4">No strong areas for this selection.</p>
                        )}
                    </div>
                </div>

                {/* Weak Areas Column */}
                <div>
                    <h4 className="text-lg font-semibold text-danger mb-3 pb-2 border-b-2 border-danger/20">Weak Areas</h4>
                    <div className="space-y-4 max-h-96 overflow-y-auto thin-scrollbar pr-2">
                        {hasWeakData ? (
                            Object.entries(analysis.weak).map(([subject, areas]: [string, { area: string; count: number }[]]) => {
                                const subjectNodeMap = syllabusMap.get(subject);
                                return (
                                <div key={subject}>
                                    <h5 className="font-semibold text-muted-foreground">{subject}</h5>
                                    <div className="mt-2 space-y-2">
                                        {areas.map(({ area, count }) => (
                                            <div key={area} className="flex justify-between items-center text-sm p-2 rounded-md bg-danger-muted">
                                                <span className="font-medium text-danger-muted-foreground">{subjectNodeMap?.get(area) ? `${area}. ${subjectNodeMap.get(area)}` : `Area #${area}`}</span>
                                                 <div className="flex items-center gap-1 text-xs font-bold text-danger" title={`${count} net negative ratings`}>
                                                    <span>({count})</span>
                                                    <StarIcon className="h-4 w-4 text-muted" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )})
                        ) : (
                            <p className="text-sm text-muted-foreground italic mt-4">No weak areas for this selection.</p>
                        )}
                    </div>
                </div>
            </div>
             {!hasAnyData && (
                <div className="text-center py-10 text-muted-foreground">
                    <p>Log completed tests with strong/weak areas to see the analysis.</p>
                </div>
            )}
        </div>
    );
};

export default OverallStrengthsWeaknesses;
