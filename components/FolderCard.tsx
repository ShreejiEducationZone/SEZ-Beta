import React from 'react';
import FolderIcon from './icons/FolderIcon';

interface FolderCardProps {
    name: string;
    details: string;
    onClick: () => void;
    colorClass?: string;
}

const FolderCard: React.FC<FolderCardProps> = ({ name, details, onClick, colorClass = 'text-primary' }) => {
    return (
        <div 
            onClick={onClick}
            className="group flex flex-col items-center text-center p-2 cursor-pointer rounded-2xl hover:bg-muted transition-colors"
            role="button"
            aria-label={`Open ${name}`}
        >
            <FolderIcon className={`w-24 h-24 drop-shadow-sm transition-transform group-hover:-translate-y-1 ${colorClass}`} />
            <h3 className="mt-2 text-sm font-semibold text-foreground truncate w-full">{name}</h3>
            <p className="text-xs text-muted-foreground">{details}</p>
        </div>
    );
};

export default FolderCard;
