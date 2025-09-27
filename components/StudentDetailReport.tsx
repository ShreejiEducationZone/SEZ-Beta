import React from 'react';

// Helper function to format snake_case or camelCase keys into Title Case headers
const formatHeader = (key: string) => {
    return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
};

const GenericTable: React.FC<{ data: object[] }> = ({ data }) => {
    if (!data || data.length === 0) {
        return <p className="text-sm text-gray-500 italic">No records found for this section.</p>;
    }
    // Defensive check for non-object elements in array
    if(typeof data[0] !== 'object' || data[0] === null) {
        return <p className="text-sm text-gray-500 italic">Data is not in a tabular format.</p>;
    }
    const headers = Object.keys(data[0]);

    const renderCellContent = (value: any): React.ReactNode => {
        if (value === null || typeof value === 'undefined') {
            return <span className="text-gray-500">N/A</span>;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) return <span className="text-gray-500 italic">Empty list</span>;
            
            if (typeof value[0] === 'object' && value[0] !== null) {
                return (
                    <ul className="space-y-1.5 pl-0 list-none">
                        {value.map((item, index) => (
                            <li key={index} className="p-2 bg-gray-100 dark:bg-gray-900/50 rounded">
                                {Object.entries(item).map(([key, val]) => (
                                    <div key={key} className="text-xs grid grid-cols-[auto,1fr] gap-x-2">
                                        <strong className="font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatHeader(key)}:</strong>
                                        <div className="break-words">{renderCellContent(val)}</div>
                                    </div>
                                ))}
                            </li>
                        ))}
                    </ul>
                );
            }
            
            return value.join(', ');
        }
        
        if (typeof value === 'object' && value !== null) {
            return <pre className="text-xs whitespace-pre-wrap bg-gray-100 dark:bg-gray-900/50 p-2 rounded">{JSON.stringify(value, null, 2)}</pre>;
        }

        return String(value);
    };

    return (
        <div className="overflow-x-auto thin-scrollbar -mr-2 pr-2">
            <table className="w-full text-sm border-collapse">
                <thead className="text-left">
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                        {headers.map(header => (
                            <th key={header} className="p-2 font-semibold align-top whitespace-nowrap">{formatHeader(header)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                            {headers.map(header => (
                                <td key={header} className="p-2 align-top">
                                    {renderCellContent((row as any)[header])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-light-bg/50 dark:bg-dark-bg/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">{title}</h3>
        {children}
    </div>
);

const StudentDetailReport: React.FC<{ details: any }> = ({ details }) => {
    const {
        name, grade, board, batch, fatherName,
        subjects = [],
        progressEntries = [],
        workAssignments = [],
        doubts = [],
        tests = [],
        attendance = []
    } = details;

    return (
        <div className="space-y-6">
            <header className="text-center p-4 bg-light-card dark:bg-dark-card rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold text-brand-blue">{name}</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Grade {grade} • {board} • Batch {batch}
                </p>
                {fatherName && <p className="text-sm text-gray-500">Father: {fatherName}</p>}
            </header>

            <Section title="Subjects & Syllabus">
                {subjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {subjects.map((s: any) => (
                            <div key={s.subject}>
                                <h4 className="font-semibold">{s.subject}</h4>
                                <ul className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-0.5">
                                    {s.chapters.map((c: any) => (
                                        <li key={`${c.no}-${c.name}`}>{c.name}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : (
                     <p className="text-sm text-gray-500 italic">No subjects found.</p>
                )}
            </Section>

            <Section title="Work Assignments">
                <GenericTable data={workAssignments} />
            </Section>
            
            <Section title="Test Results">
                <GenericTable data={tests} />
            </Section>

            <Section title="Syllabus Progress">
                 <GenericTable data={progressEntries} />
            </Section>

            <Section title="Attendance Log">
                <GenericTable data={attendance} />
            </Section>

            <Section title="Doubts">
                <GenericTable data={doubts} />
            </Section>
        </div>
    );
};

export default StudentDetailReport;
