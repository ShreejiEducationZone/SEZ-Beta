import React from 'react';
import { FaBookOpen } from 'react-icons/fa';

const SplashScreenLoader: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center transition-colors duration-300">
            <div className="flex items-center text-6xl md:text-8xl font-bold tracking-widest text-brand-blue">
                <span className="splash-letter splash-letter-s">S</span>
                <span className="splash-letter splash-letter-e">E</span>
                <span className="splash-letter splash-letter-z">Z</span>
            </div>
            <div className="flex items-center gap-2 mt-4 text-gray-500 dark:text-gray-400 splash-letter" style={{ animationDelay: '1.2s' }}>
                <FaBookOpen className="h-5 w-5" />
                <p className="font-semibold">Dashboard</p>
            </div>
        </div>
    );
};

export default SplashScreenLoader;