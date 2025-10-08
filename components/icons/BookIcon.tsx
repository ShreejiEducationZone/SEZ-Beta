import React from 'react';

const BookIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494M12 6.253a2.25 2.25 0 01-2.25-2.25H7.5a2.25 2.25 0 00-2.25 2.25v11.5c0 1.242 1.008 2.25 2.25 2.25h9a2.25 2.25 0 002.25-2.25v-11.5a2.25 2.25 0 00-2.25-2.25h-2.25A2.25 2.25 0 0112 6.253z" />
    </svg>
);

export default BookIcon;
