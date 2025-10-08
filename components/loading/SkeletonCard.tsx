import React from 'react';

const SkeletonCard: React.FC = () => {
    return (
        <div className="bg-card rounded-2xl shadow-soft border border-border flex flex-col">
            <div className="animate-pulse">
                {/* Banner */}
                <div className="h-28 rounded-t-2xl bg-muted"></div>
                
                {/* Avatar & Info */}
                <div className="flex flex-col items-center -mt-14 px-6 pb-6 text-center">
                    <div className="w-24 h-24 rounded-full bg-muted ring-4 ring-card"></div>
                    
                    <div className="h-6 w-3/4 bg-muted rounded mt-4"></div>
                    <div className="h-4 w-1/2 bg-muted rounded mt-2"></div>

                    {/* Stats */}
                    <div className="w-full bg-muted/50 rounded-xl p-3 mt-4 flex justify-around items-center h-16">
                         <div className="h-6 w-12 bg-muted rounded"></div>
                         <div className="h-6 w-12 bg-muted rounded"></div>
                         <div className="h-6 w-12 bg-muted rounded"></div>
                    </div>

                    {/* View Profile Button */}
                    <div className="mt-4 w-full h-10 rounded-xl bg-muted/50"></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonCard;
