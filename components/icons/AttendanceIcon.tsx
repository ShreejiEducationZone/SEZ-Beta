import React from 'react';

const AttendanceIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.285 18.285A10 10 0 0012 2c-5.523 0-10 4.477-10 10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.715 18.285A10 10 0 0112 22c5.523 0 10-4.477 10-10" />
    </svg>
);

export default AttendanceIcon;