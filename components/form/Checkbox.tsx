import React from 'react';
import CheckIcon from '../icons/CheckIcon';

interface CheckboxProps {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, disabled = false }) => {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={() => !disabled && onChange()}
            disabled={disabled}
            className={`
                relative w-6 h-6 flex-shrink-0 rounded-full border-2
                flex items-center justify-center
                transition-all duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary dark:focus:ring-offset-card
                ${checked ? 'bg-primary border-primary' : 'bg-transparent border-border'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <CheckIcon
                className={`
                    w-4 h-4 text-primary-foreground
                    transition-transform duration-200 ease-in-out
                    ${checked ? 'scale-100' : 'scale-0'}
                `}
            />
        </button>
    );
};

export default Checkbox;