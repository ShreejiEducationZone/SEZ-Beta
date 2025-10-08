import React from 'react';
import CheckIcon from '../icons/CheckIcon';

interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, disabled = false }) => {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            onClick={() => !disabled && onChange(!checked)}
            disabled={disabled}
            className={`
                relative w-6 h-6 flex-shrink-0 rounded-full border-2
                flex items-center justify-center
                transition-all duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue dark:focus:ring-offset-dark-card
                ${checked ? 'bg-brand-blue border-brand-blue' : 'bg-transparent border-gray-300 dark:border-gray-500'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <CheckIcon
                className={`
                    w-4 h-4 text-white
                    transition-transform duration-200 ease-in-out
                    ${checked ? 'scale-100' : 'scale-0'}
                `}
            />
        </button>
    );
};

export default Checkbox;