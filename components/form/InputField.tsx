
import React from 'react';

interface InputFieldProps {
    label: string;
    name: string;
    value: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    required?: boolean;
    readOnly?: boolean;
    type?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange, error, required, readOnly = false, type = 'text' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            className={`mt-1 block w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors duration-200
            ${readOnly ? 'bg-gray-200 dark:bg-gray-800 cursor-not-allowed' : 'bg-gray-50 dark:bg-gray-700/50'}`}
        />
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

export default InputField;