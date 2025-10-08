
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
        <label htmlFor={name} className="block text-sm font-medium text-muted-foreground">
            {label} {required && <span className="text-danger">*</span>}
        </label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            className={`mt-1 block w-full h-10 px-3 rounded-lg border border-border focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-200
            ${readOnly ? 'bg-muted cursor-not-allowed' : 'bg-background'}`}
        />
        {error && <p className="text-danger text-xs mt-1">{error}</p>}
    </div>
);

export default InputField;