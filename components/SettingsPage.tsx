
import React, { useState } from 'react';
import { MistakeTypeDefinition, Student, SubjectData } from '../types';
import AdministratorSettings from './settings/AdministratorSettings';
import StudentPasswordSettings from './settings/StudentPasswordSettings';
import MistakeTypeSettings from './settings/MistakeTypeSettings';
import AppearanceSettings from './settings/AppearanceSettings';
import PermissionSettings from './settings/PermissionSettings';
import AreaSettings from './settings/AreaSettings';
import UserCircleIcon from './icons/UserCircleIcon';
import KeyIcon from './icons/KeyIcon';
import WrenchScrewdriverIcon from './icons/WrenchScrewdriverIcon';
import SunIcon from './icons/SunIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import TagIcon from './icons/TagIcon';

interface SettingsPageProps {
    darkMode: boolean;
    onToggleDarkMode: () => void;
    customMistakeTypes: MistakeTypeDefinition[];
    onSaveMistakeTypes: (types: MistakeTypeDefinition[]) => void;
    students: Student[];
    onSaveStudent: (student: Student) => void;
    subjectAreas: { [key: string]: string[] };
    onSaveSubjectAreas: (areas: { [key: string]: string[] }) => void;
    allStudentSubjects: { [key: string]: { studentId: string; subjects: SubjectData[] } };
}

type SettingsTab = 'administrator' | 'passwords' | 'mistakes' | 'manage-subject-areas' | 'appearance' | 'permissions';

const SettingsPage: React.FC<SettingsPageProps> = (props) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('administrator');

    const tabs = [
        { id: 'administrator', label: 'Administrator', icon: UserCircleIcon },
        { id: 'passwords', label: 'Student Passwords', icon: KeyIcon },
        { id: 'mistakes', label: 'Mistake Types', icon: WrenchScrewdriverIcon },
        { id: 'manage-subject-areas', label: 'Subject Areas', icon: TagIcon },
        { id: 'appearance', label: 'Appearance', icon: SunIcon },
        { id: 'permissions', label: 'Permissions', icon: ShieldCheckIcon },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'administrator':
                return <AdministratorSettings />;
            case 'passwords':
                return <StudentPasswordSettings students={props.students} onSaveStudent={props.onSaveStudent} />;
            case 'mistakes':
                return <MistakeTypeSettings customMistakeTypes={props.customMistakeTypes} onSaveMistakeTypes={props.onSaveMistakeTypes} />;
            case 'manage-subject-areas':
                return <AreaSettings 
                            subjectAreas={props.subjectAreas} 
                            onSaveSubjectAreas={props.onSaveSubjectAreas} 
                            allStudentSubjects={props.allStudentSubjects} 
                        />;
            case 'appearance':
                return <AppearanceSettings darkMode={props.darkMode} onToggleDarkMode={props.onToggleDarkMode} />;
            case 'permissions':
                return <PermissionSettings />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12 h-[calc(100vh-112px)]">
            <aside className="md:w-64 flex-shrink-0">
                <nav className="space-y-1">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab(id as SettingsTab);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                                activeTab === id
                                    ? 'bg-brand-blue/10 text-brand-blue'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                            }`}
                        >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>
            </aside>
            <main className="flex-grow min-w-0 overflow-y-auto thin-scrollbar">
                {renderContent()}
            </main>
        </div>
    );
};

export default SettingsPage;
