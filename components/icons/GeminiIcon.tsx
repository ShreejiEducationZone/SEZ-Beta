
import React from 'react';

const GeminiIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className || "h-6 w-6"}
        aria-hidden="true"
    >
        <path d="M12 2.25a.75.75 0 0 1 .75.75v5.06l3.5-3.5a.75.75 0 0 1 1.06 1.06l-3.5 3.5h5.06a.75.75 0 0 1 0 1.5h-5.06l3.5 3.5a.75.75 0 0 1-1.06 1.06l-3.5-3.5v5.06a.75.75 0 0 1-1.5 0v-5.06l-3.5 3.5a.75.75 0 0 1-1.06-1.06l3.5-3.5H4.94a.75.75 0 0 1 0-1.5h5.06l-3.5-3.5a.75.75 0 0 1 1.06-1.06l3.5 3.5V3a.75.75 0 0 1 .75-.75Z" />
    </svg>
);

export default GeminiIcon;
