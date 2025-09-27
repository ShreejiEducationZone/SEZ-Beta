import React, { useState, useEffect } from 'react';

const thinkingMessages = [
    "Finding in database...",
    "Analyzing the data...",
    "Filtering for accurate results...",
    "Compiling the report...",
];

const AiThinking: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setMessageIndex(prevIndex => (prevIndex + 1) % thinkingMessages.length);
        }, 1500);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>
                {thinkingMessages[messageIndex]}
            </span>
        </div>
    );
};

export default AiThinking;
