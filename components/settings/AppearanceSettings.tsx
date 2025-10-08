
import React from 'react';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange }) => (
    <button
        type="button"
        className={`${
            checked ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
        } relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 dark:focus:ring-offset-dark-card`}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
    >
        <span
            aria-hidden="true"
            className={`${
                checked ? 'translate-x-6' : 'translate-x-0'
            } pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);

interface AppearanceSettingsProps {
    darkMode: boolean;
    onToggleDarkMode: () => void;
}

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ darkMode, onToggleDarkMode }) => {
    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Appearance</h2>
            <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 min-h-[56px]">
                    <span className="font-medium">Dark Mode</span>
                    <ToggleSwitch checked={darkMode} onChange={onToggleDarkMode} />
                </div>
            </div>
        </div>
    );
};

export default AppearanceSettings;
