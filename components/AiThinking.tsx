import React from 'react';

const AiThinking: React.FC = () => (
    <div className="flex items-center gap-2 px-2 py-1">
        <span className="h-2 w-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
        <span className="h-2 w-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
        <span className="h-2 w-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
    </div>
);

export default AiThinking;
