
import React from 'react';

const SkeletonCard: React.FC = () => {
    return (
        <div className="relative h-80 bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/80 dark:border-white/30 p-5 flex flex-col items-center text-center">
            <div className="w-full animate-pulse">
                {/* Placeholder for Attendance Badge */}
                <div className="absolute top-4 right-4 h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>

                {/* Placeholder for Avatar */}
                <div className="relative flex-shrink-0 w-24 h-24 mt-4 mb-4 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full"></div>

                {/* Placeholder for Student Info */}
                <div className="flex-grow flex flex-col items-center min-w-0 w-full space-y-2">
                    <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
                
                {/* Placeholder for Bottom Details */}
                <footer className="w-full mt-auto pt-4 border-t border-gray-900/10 dark:border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default SkeletonCard;
