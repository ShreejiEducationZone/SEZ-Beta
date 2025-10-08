import React from 'react';
import { Board } from '../types';
import { FaBookOpen, FaLeaf, FaUniversity, FaGlobeEurope, FaLightbulb, FaGlobe } from 'react-icons/fa';
import { HiUsers } from 'react-icons/hi';
import { MdLibraryBooks } from 'react-icons/md';

interface LibraryCardProps {
    board?: Board;
    grade?: string;
    studentCount?: number;
    subjectCount?: number;
    isUniversal?: boolean;
    onClick: () => void;
}

const boardConfig: Record<Board | 'Universal', { icon: React.ElementType, color: string }> = {
    CBSE: { icon: FaBookOpen, color: 'hsl(30, 95%, 60%)' }, // Orange
    ICSE: { icon: FaLeaf, color: 'hsl(142, 71%, 45%)' }, // Green
    GSEB: { icon: FaUniversity, color: 'hsl(240, 5%, 65%)' }, // Gray
    Cambridge: { icon: FaGlobeEurope, color: 'hsl(217, 91%, 60%)' }, // Blue
    IB: { icon: FaLightbulb, color: 'hsl(340, 82%, 60%)' }, // Pink
    Universal: { icon: FaGlobe, color: 'hsl(262, 83%, 58%)' } // Purple
};

const LibraryCard: React.FC<LibraryCardProps> = ({ board, grade, studentCount, subjectCount, isUniversal = false, onClick }) => {
    
    const config = isUniversal ? boardConfig.Universal : boardConfig[board!];
    const Icon = config.icon;
    const title = isUniversal ? "Universal Library" : `${board} - Grade ${grade}`;
    const subtitle = isUniversal ? "General & informational videos" : "";

    return (
        <div 
            onClick={onClick}
            className="group relative bg-card rounded-2xl shadow-soft border border-border p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg flex flex-col overflow-hidden"
            style={{ '--board-color': config.color } as React.CSSProperties}
        >
            <div className="absolute top-0 left-0 w-full h-2 bg-[var(--board-color)]"></div>
            
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex-shrink-0 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center border border-border">
                        <Icon className="h-8 w-8" style={{ color: config.color }} />
                    </div>
                </div>

                <div className="flex-grow">
                    <h3 className="text-xl font-bold text-foreground leading-tight">{title}</h3>
                    {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
                </div>

                {!isUniversal && (
                    <div className="mt-6 pt-4 border-t border-border flex justify-between items-center text-sm text-muted-foreground">
                        <div className="flex items-center gap-2" title={`${studentCount} students`}>
                            <HiUsers className="h-4 w-4" />
                            <span className="font-semibold">{studentCount} Student(s)</span>
                        </div>
                        <div className="flex items-center gap-2" title={`${subjectCount} subjects`}>
                            <MdLibraryBooks className="h-4 w-4" />
                            <span className="font-semibold">{subjectCount} Subject(s)</span>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="absolute bottom-4 right-4 h-8 w-8 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-300">
                <span className="text-lg font-bold text-foreground">&rarr;</span>
            </div>
        </div>
    );
};

export default LibraryCard;