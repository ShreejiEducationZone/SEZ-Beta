import React, { useState } from 'react';
import { Student, SubjectData, AreaDefinition } from '../types';
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
import PinIcon from './icons/PinIcon';
import BranchSettings from './settings/BranchSettings';
import { useData } from '../context/DataContext';
import { useStudent } from '../context/StudentContext';
import { useSyllabus } from '../context/SyllabusContext';

type SettingsTab = 'administrator' | 'passwords' | 'mistakes' | 'manage-subject-areas' | 'branches' | 'appearance' | 'permissions';

const SettingsPage: React.FC = () => {
    const { 
        darkMode, 
        setDarkMode, 
        customMistakeTypes, 
        handleSaveCustomMistakeTypes,
        branches,
        handleSaveBranches
    } = useData();
    
    const { allStudentSubjects, subjectAreas, handleSaveSubjectAreas } = useSyllabus();
    const { students, handleSaveStudent } = useStudent();

    const [activeTab, setActiveTab] = useState<SettingsTab>('administrator');

    const tabs = [
        { id: 'administrator', label: 'Administrator', icon: UserCircleIcon },
        { id: 'passwords', label: 'Student Passwords', icon: KeyIcon },
        { id: 'branches', label: 'Branches', icon: PinIcon },
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
                return <StudentPasswordSettings students={students.filter(s => !s.isArchived)} onSaveStudent={handleSaveStudent} />;
            case 'branches':
                return <BranchSettings branches={branches} onSaveBranches={handleSaveBranches} />;
            case 'mistakes':
                return <MistakeTypeSettings customMistakeTypes={customMistakeTypes} onSaveMistakeTypes={handleSaveCustomMistakeTypes} />;
            case 'manage-subject-areas':
                return <AreaSettings 
                            subjectAreas={subjectAreas} 
                            onSaveSubjectAreas={handleSaveSubjectAreas} 
                            allStudentSubjects={allStudentSubjects} 
                        />;
            case 'appearance':
                return <AppearanceSettings darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />;
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
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted/50'
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