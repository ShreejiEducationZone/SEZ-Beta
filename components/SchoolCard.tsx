import React from 'react';
import { FaSchool, FaBook } from 'react-icons/fa';
import { HiUsers } from 'react-icons/hi';

interface SchoolCardProps {
    schoolName: string;
    studentCount: number;
    boardCount: number;
    onClick: () => void;
}

const SchoolCard: React.FC<SchoolCardProps> = ({ schoolName, studentCount, boardCount, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="group relative bg-card rounded-2xl shadow-soft border border-border p-6 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg flex flex-col overflow-hidden"
        >
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-2xl transition-all duration-500 group-hover:bg-primary/20"></div>
            
            <div className="relative z-10 flex flex-col h-full">
                <div className="flex-shrink-0 mb-4">
                    <div className="w-16 h-16 rounded-2xl bg-card/80 backdrop-blur-sm flex items-center justify-center border border-border shadow-soft">
                        <FaSchool className="h-8 w-8 text-primary" />
                    </div>
                </div>

                <div className="flex-grow">
                    <h3 className="text-xl font-bold text-foreground leading-tight">{schoolName}</h3>
                </div>

                <div className="mt-6 pt-4 border-t border-border flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2" title={`${studentCount} students`}>
                        <HiUsers className="h-4 w-4 text-primary/80" />
                        <span className="font-semibold">{studentCount} Students</span>
                    </div>
                    <div className="flex items-center gap-2" title={`${boardCount} boards`}>
                        <FaBook className="h-4 w-4 text-primary/80" />
                        <span className="font-semibold">{boardCount} Board(s)</span>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-110 duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <span className="text-xl font-bold">&rarr;</span>
            </div>
        </div>
    );
};

export default SchoolCard;