
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
         <label htmlFor={name} className="block text-sm font-medium text-muted-foreground">
            {label} {required && <span className="text-danger">*</span>}
        </label>
         <textarea
             id={name}
             name={name}
             value={value}
             onChange={onChange}
             rows={3}
             className="mt-1 block w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors duration-200"
         ></textarea>
         {error && <p className="text-danger text-xs mt-1">{error}</p>}
    </div>
);

export default TextareaField;