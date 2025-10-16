import React, { useState, useMemo, useEffect } from 'react';
import AdministratorSettings from './settings/AdministratorSettings';
import StudentPasswordSettings from './settings/StudentPasswordSettings';
import MistakeTypeSettings from './settings/MistakeTypeSettings';
import AppearanceSettings from './settings/AppearanceSettings';
import PermissionSettings from './settings/PermissionSettings';
import UserCircleIcon from './icons/UserCircleIcon';
import KeyIcon from './icons/KeyIcon';
import WrenchScrewdriverIcon from './icons/WrenchScrewdriverIcon';
import SunIcon from './icons/SunIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import PinIcon from './icons/PinIcon';
import BranchSettings from './settings/BranchSettings';
import { useData } from '../context/DataContext';
import { useStudent } from '../context/StudentContext';
import { FaSearch } from 'react-icons/fa';
import ChevronLeftIcon from './icons/ChevronLeftIcon';

type SettingsTab = 'administrator' | 'passwords' | 'mistakes' | 'branches' | 'appearance' | 'permissions';

const tabs: { id: SettingsTab; label: string; icon: React.FC<{className?: string}>; color: string }[] = [
    { id: 'administrator', label: 'Administrator', icon: UserCircleIcon, color: 'bg-gray-500' },
    { id: 'passwords', label: 'Student Passwords', icon: KeyIcon, color: 'bg-blue-500' },
    { id: 'branches', label: 'Branches', icon: PinIcon, color: 'bg-orange-500' },
    { id: 'mistakes', label: 'Mistake Types', icon: WrenchScrewdriverIcon, color: 'bg-red-500' },
    { id: 'appearance', label: 'Appearance', icon: SunIcon, color: 'bg-indigo-500' },
    { id: 'permissions', label: 'Permissions', icon: ShieldCheckIcon, color: 'bg-teal-500' },
];

const SettingsPage: React.FC = () => {
    const { 
        darkMode, 
        setDarkMode, 
        customMistakeTypes, 
        handleSaveCustomMistakeTypes,
        branches,
        handleSaveBranches
    } = useData();
    const { students, handleSaveStudent } = useStudent();

    const [activeTab, setActiveTab] = useState<SettingsTab>('administrator');
    const [mobileActiveTab, setMobileActiveTab] = useState<SettingsTab | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Check screen size for initial mobile view setup
    const isMobileView = useMemo(() => window.innerWidth < 768, []);
    
    const filteredTabs = useMemo(() => {
        if (!searchQuery) return tabs;
        return tabs.filter(tab => tab.label.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery]);

    const handleSelectTab = (tabId: SettingsTab) => {
        setActiveTab(tabId);
        if (isMobileView) {
            setMobileActiveTab(tabId);
        }
    };

    const handleBackToMenu = () => {
        setMobileActiveTab(null);
    };

    const renderContent = (currentTab: SettingsTab) => {
        switch (currentTab) {
            case 'administrator':
                return <AdministratorSettings />;
            case 'passwords':
                return <StudentPasswordSettings students={students.filter(s => !s.isArchived)} onSaveStudent={handleSaveStudent} />;
            case 'branches':
                return <BranchSettings branches={branches} onSaveBranches={handleSaveBranches} />;
            case 'mistakes':
                return <MistakeTypeSettings customMistakeTypes={customMistakeTypes} onSaveMistakeTypes={handleSaveCustomMistakeTypes} />;
            case 'appearance':
                return <AppearanceSettings darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} />;
            case 'permissions':
                return <PermissionSettings />;
            default:
                return null;
        }
    };

    const SettingsList = (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border flex-shrink-0">
                 <div className="relative">
                    <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search Settings"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 pl-10 pr-3 rounded-lg border border-border bg-background"
                    />
                </div>
            </div>
            <nav className="flex-grow p-2 space-y-1 overflow-y-auto thin-scrollbar">
                {filteredTabs.map(({ id, label, icon: Icon, color }) => (
                    <button
                        key={id}
                        onClick={() => handleSelectTab(id)}
                        className={`w-full flex items-center gap-4 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                            activeTab === id && !isMobileView
                                ? 'bg-primary/10'
                                : 'hover:bg-muted dark:hover:bg-black/20'
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${color}`}>
                             <Icon className="h-5 w-5 text-white" />
                        </div>
                        <span className={`font-medium ${activeTab === id && !isMobileView ? 'text-primary' : 'text-foreground'}`}>{label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
    
    const currentTabId = isMobileView ? mobileActiveTab : activeTab;
    const currentTabInfo = tabs.find(t => t.id === currentTabId);

    return (
        <div className="bg-card rounded-2xl shadow-soft border border-border h-[calc(100vh-112px)] flex overflow-hidden">
            {/* Sidebar for Desktop */}
            <aside className="hidden md:block w-72 flex-shrink-0 bg-muted/50 border-r border-border">
                {SettingsList}
            </aside>

            {/* Main Content Area */}
            <main className="flex-grow overflow-y-auto thin-scrollbar">
                {/* Mobile View */}
                <div className="md:hidden">
                    {mobileActiveTab === null ? (
                        SettingsList
                    ) : (
                        <div>
                             <div className="p-4 border-b border-border sticky top-0 bg-card/80 backdrop-blur-sm z-10">
                                <button onClick={handleBackToMenu} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
                                    <ChevronLeftIcon className="h-5 w-5" />
                                    Back
                                </button>
                             </div>
                            <div className="p-4 sm:p-6">
                                {renderContent(mobileActiveTab)}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Desktop View */}
                <div className="hidden md:block p-8 lg:p-12">
                     {renderContent(activeTab)}
                </div>
            </main>
        </div>
    );
};

export default SettingsPage;
