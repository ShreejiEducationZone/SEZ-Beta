import React from 'react';

const SkeletonFilterBar: React.FC = () => (
    <div className="bg-card p-4 rounded-2xl shadow-soft border border-border mb-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end animate-pulse">
        {/* Search Bar Placeholder */}
        <div className="md:col-span-3 lg:col-span-2">
            <div className="h-5 w-24 bg-muted rounded mb-1"></div>
            <div className="h-10 w-full bg-muted rounded-lg"></div>
        </div>

        {/* Filter Placeholders */}
        <div>
            <div className="h-5 w-16 bg-muted rounded mb-1"></div>
            <div className="h-10 w-full bg-muted rounded-lg"></div>
        </div>
        <div>
            <div className="h-5 w-16 bg-muted rounded mb-1"></div>
            <div className="h-10 w-full bg-muted rounded-lg"></div>
        </div>
        <div>
            <div className="h-5 w-16 bg-muted rounded mb-1"></div>
            <div className="h-10 w-full bg-muted rounded-lg"></div>
        </div>
        
        {/* Clear Button Placeholder */}
        <div>
            <div className="h-10 w-full bg-muted rounded-lg"></div>
        </div>
    </div>
);

export default SkeletonFilterBar;
