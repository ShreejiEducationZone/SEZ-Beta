
import React from 'react';

interface TextareaFieldProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    error?: string;
    required?: boolean;
}

const TextareaField: React.FC<TextareaFieldProps> = ({ label, name, value, onChange, error, required }) => (
    <div>
         <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
         <textarea
             id={name}
             name={name}
             value={value}
             onChange={onChange}
             rows={3}
             className="mt-1 block w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition-colors duration-200"
         ></textarea>
         {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

export default TextareaField;