
import React from 'react';

const TagIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM12 14l-4 4m0-4l4 4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 3h-2.5a1.5 1.5 0 00-1.5 1.5V12a1.5 1.5 0 001.5 1.5H17a1.5 1.5 0 001.5-1.5V4.5A1.5 1.5 0 0017 3z" />
    </svg>
);

export default TagIcon;
