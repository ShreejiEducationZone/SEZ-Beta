import React from 'react';

const JsonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9.5h8M8 14.5h8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2" />
    </svg>
);

export default JsonIcon;
