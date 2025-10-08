import React from 'react';

const FaceIdIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 8V6a2 2 0 0 1 2-2h2"/>
        <path d="M4 16v2a2 2 0 0 0 2 2h2"/>
        <path d="M16 4h2a2 2 0 0 1 2 2v2"/>
        <path d="M16 20h2a2 2 0 0 0 2-2v-2"/>
        <line x1="9" x2="15" y1="12" y2="12"/>
    </svg>
);

export default FaceIdIcon;