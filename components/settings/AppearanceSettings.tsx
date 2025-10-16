import React from 'react';

interface AppearanceSettingsProps {
    darkMode: boolean;
    onToggleDarkMode: () => void;
}

const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ darkMode, onToggleDarkMode }) => {
    return (
        <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-8">Appearance</h2>
            <div className="p-6 bg-muted/50 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-foreground">Dark Mode</h3>
                        <p className="text-sm text-muted-foreground">Toggle between light and dark themes.</p>
                    </div>
                    <button
                        type="button"
                        className={`${
                            darkMode ? 'bg-primary' : 'bg-border'
                        } relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-card`}
                        role="switch"
                        aria-checked={darkMode}
                        onClick={onToggleDarkMode}
                    >
                        <span className="sr-only">Use setting</span>
                        <span
                            aria-hidden="true"
                            className={`${
                                darkMode ? 'translate-x-6' : 'translate-x-0'
                            } pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppearanceSettings;