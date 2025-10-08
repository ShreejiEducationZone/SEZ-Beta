import React from 'react';
import StudentDetailReport from './StudentDetailReport';

const DetailCard: React.FC<{ title: string; children: React.ReactNode; colorClass?: string }> = ({ title, children, colorClass = 'border-gray-300 dark:border-gray-600' }) => (
    <div className={`p-4 border rounded-lg ${colorClass}`}>
        <h4 className={`font-semibold mb-2 text-base`}>{title}</h4>
        {children}
    </div>
);

// Helper function to format snake_case or camelCase keys into Title Case headers
const formatHeader = (key: string) => {
    return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
};

const GenericTable: React.FC<{ data: object[] }> = ({ data }) => {
    if (data.length === 0) return null;
    const headers = Object.keys(data[0]);

    const renderCellContent = (value: any): React.ReactNode => {
        if (value === null || typeof value === 'undefined') {
            return <span className="text-gray-500">N/A</span>;
        }

        if (Array.isArray(value)) {
            if (value.length === 0) return <span className="text-gray-500 italic">Empty list</span>;
            
            // Array of objects
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
            
            // Array of primitives
            return value.join(', ');
        }
        
        // Plain object (not an array)
        if (typeof value === 'object' && value !== null) {
            return <pre className="text-xs whitespace-pre-wrap bg-gray-100 dark:bg-gray-900/50 p-2 rounded">{JSON.stringify(value, null, 2)}</pre>;
        }

        // Primitive value
        return String(value);
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
                <thead className="text-left">
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                        {headers.map(header => (
                            <th key={header} className="p-2 font-semibold align-top">{formatHeader(header)}</th>
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

const AnalyticsReport: React.FC<{ data: any }> = ({ data }) => {
    if (!data) return null;

    // --- Specific report types ---
    if (typeof data === 'object' && data !== null && data.studentDetails) {
        return <StudentDetailReport details={data.studentDetails} />;
    }

    // --- Handle top-level array data ---
    if (Array.isArray(data)) {
        if (data.length === 0) {
            return (
                <DetailCard title="Query Results">
                    <p className="text-sm text-gray-500 italic">The AI returned no results for this query.</p>
                </DetailCard>
            );
        }
        if (typeof data[0] === 'object' && data[0] !== null) {
            return (
                 <DetailCard title="Query Results">
                    <GenericTable data={data} />
                </DetailCard>
            );
        }
        return (
            <DetailCard title="Query Results">
                <ul className="list-disc ml-5 space-y-1 text-sm">
                    {data.map((item, i) => <li key={i}>{String(item)}</li>)}
                </ul>
            </DetailCard>
        );
    }

    // --- Generic object data rendering ---
    if (typeof data === 'object' && data !== null) {
        const objectKeys = Object.keys(data);
        
        // Handle case where AI returns an object where all values are empty arrays, e.g., {"students": []}
        const allValuesAreEmptyArrays = objectKeys.length > 0 && objectKeys.every(key => 
            Array.isArray(data[key]) && data[key].length === 0
        );

        if (allValuesAreEmptyArrays) {
            return (
                <DetailCard title="AI Response">
                    <p className="text-sm text-gray-500 italic">I couldn't find any specific data matching your request in the database.</p>
                </DetailCard>
            );
        }

        // Separate keys into different types for varied rendering
        const primitiveData: Record<string, string|number|boolean> = {};
        const complexData: Record<string, any> = {};

        objectKeys.forEach(key => {
            const value = data[key];
            if ((typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') && !Array.isArray(value)) {
                primitiveData[key] = value;
            } else {
                complexData[key] = value;
            }
        });

        return (
            <div className="space-y-4 text-gray-800 dark:text-gray-200">
                 {/* Render primitive stats in a grid */}
                {Object.keys(primitiveData).length > 0 && (
                    <div className={`p-4 border rounded-lg border-gray-300 dark:border-gray-600 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2`}>
                        {Object.entries(primitiveData).map(([key, value]) => (
                            <div key={key} className="text-center p-2">
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{formatHeader(key)}</p>
                                <p className="text-3xl font-bold text-gray-800 dark:text-white">{String(value)}</p>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Render complex data in separate cards */}
                {Object.entries(complexData).map(([key, value]) => {
                    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                        return (
                            <DetailCard key={key} title={formatHeader(key)}>
                                <GenericTable data={value} />
                            </DetailCard>
                        );
                    }
                    if (Array.isArray(value)) {
                         return (
                            <DetailCard key={key} title={formatHeader(key)}>
                                {value.length > 0 ? (
                                    <ul className="list-disc ml-5 space-y-1 text-sm">
                                        {value.map((item, i) => <li key={i}>{String(item)}</li>)}
                                    </ul>
                                ) : (
                                    <p className="text-sm italic text-gray-500">No items found.</p>
                                )}
                            </DetailCard>
                        )
                    }
                    if (value !== null && typeof value === 'object') {
                        return (
                            <DetailCard key={key} title={formatHeader(key)}>
                                <pre className="text-xs whitespace-pre-wrap bg-gray-100 dark:bg-gray-900/50 p-2 rounded">{JSON.stringify(value, null, 2)}</pre>
                            </DetailCard>
                        );
                    }
                    return null;
                })}
            </div>
        );
    }
    
    // Fallback for primitive types, should not happen often with JSON parsing
    return <p>{String(data)}</p>;
};

export default AnalyticsReport;