import React, { useState, useMemo, FC } from 'react';
import { useVideoLibrary } from '../context/VideoLibraryContext';
import { useStudent } from '../context/StudentContext';
import { useSyllabus } from '../context/SyllabusContext';
import { Student, SubjectData, Board, VideoLink, SyllabusNode } from '../types';
import { FaSearch, FaChevronLeft } from 'react-icons/fa';
import CheckIcon from './icons/CheckIcon';
import FolderCard from './FolderCard';
// FIX: Import the missing `SelectField` component.
import SelectField from './form/SelectField';

function getYoutubeThumbnail(url: string): string {
    let videoId = '';
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1);
        } else if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v') || '';
            if (!videoId && (urlObj.pathname.startsWith('/embed/') || urlObj.pathname.startsWith('/v/'))) {
                videoId = urlObj.pathname.split('/')[2];
            }
        }
    } catch (e) {
        const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const match = url.match(regex);
        if (match) videoId = match[1];
    }
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : 'https://via.placeholder.com/320x180.png?text=Video';
}

const VideoSelectionCard: React.FC<{ video: VideoLink; isSelected: boolean; onSelect: () => void; }> = ({ video, isSelected, onSelect }) => {
    const thumbnailUrl = getYoutubeThumbnail(video.url);
    return (
        <div onClick={onSelect} className="relative cursor-pointer group rounded-lg overflow-hidden border-2 bg-muted border-transparent" role="button" aria-pressed={isSelected}>
            <div className="aspect-video">
                <img src={thumbnailUrl} alt={video.title} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" loading="lazy" />
            </div>
            <div className={`absolute inset-0 bg-black transition-opacity duration-200 ${isSelected ? 'opacity-40' : 'opacity-0 group-hover:opacity-20'}`}></div>
            {isSelected && <div className="absolute inset-0 border-4 border-primary rounded-lg"></div>}
            {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground border-2 border-card">
                    <CheckIcon className="w-4 h-4" />
                </div>
            )}
            <div className="p-3 bg-gradient-to-t from-black/70 to-transparent absolute bottom-0 left-0 right-0">
                <p className="text-white text-sm font-semibold truncate drop-shadow-md" title={video.title}>
                    {video.title}
                </p>
            </div>
        </div>
    );
};

export interface GroupData {
    id: string;
    school: string;
    board: Board;
    grade: string;
    studentCount: number;
    subjects: SubjectData[];
}
interface SchoolGroup {
    school: string;
    groups: GroupData[];
    studentCount: number;
}
const boardColorClasses: Record<Board, string> = {
    CBSE: 'text-orange-500', ICSE: 'text-green-600', GSEB: 'text-gray-500', Cambridge: 'text-blue-600', IB: 'text-pink-600',
};

interface SelectVideoModalProps {
    onClose: () => void;
    onSelect: (urls: string[]) => void;
}

const SelectVideoModal: React.FC<SelectVideoModalProps> = ({ onClose, onSelect }) => {
    const { videoLibrary } = useVideoLibrary();
    const { students } = useStudent();
    const { allStudentSubjects } = useSyllabus();
    
    const [view, setView] = useState<'library' | 'groups' | 'videos'>('library');
    const [selectedSchool, setSelectedSchool] = useState<SchoolGroup | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<GroupData | 'universal' | null>(null);
    const [activeSubject, setActiveSubject] = useState('');
    const [selectedSyllabusNode, setSelectedSyllabusNode] = useState<SyllabusNode | null>(null);
    
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');

    const schoolLibraryGroups = useMemo<SchoolGroup[]>(() => {
        const studentsBySchool = new Map<string, Student[]>();
        students.filter(s => !s.isArchived).forEach(student => {
            if (!studentsBySchool.has(student.school)) studentsBySchool.set(student.school, []);
            studentsBySchool.get(student.school)!.push(student);
        });
        const result: SchoolGroup[] = [];
        for (const [school, schoolStudents] of studentsBySchool.entries()) {
            const groupsInSchool = new Map<string, { board: Board; grade: string; studentIds: Set<string>; subjects: Map<string, SubjectData> }>();
            schoolStudents.forEach(student => {
                const groupId = `${student.board}-${student.grade}`;
                if (!groupsInSchool.has(groupId)) groupsInSchool.set(groupId, { board: student.board, grade: student.grade, studentIds: new Set(), subjects: new Map() });
                const group = groupsInSchool.get(groupId)!;
                group.studentIds.add(student.id);
                (allStudentSubjects[student.id]?.subjects || []).forEach(subject => { if (!group.subjects.has(subject.subject)) group.subjects.set(subject.subject, subject); });
            });
            const schoolGroupData: GroupData[] = Array.from(groupsInSchool.entries()).map(([id, data]) => ({
                id: `${school}-${id}`, school, board: data.board, grade: data.grade, studentCount: data.studentIds.size, subjects: Array.from(data.subjects.values()).sort((a,b) => a.subject.localeCompare(b.subject))
            })).sort((a, b) => a.board.localeCompare(b.board) || a.grade.localeCompare(b.grade));
            if (schoolGroupData.length > 0) result.push({ school, groups: schoolGroupData, studentCount: schoolStudents.length });
        }
        return result.sort((a, b) => a.school.localeCompare(b.school));
    }, [students, allStudentSubjects]);

    const handleSelectLibrary = (library: 'universal' | SchoolGroup) => {
        if (library === 'universal') {
            setSelectedGroup('universal');
            setView('videos');
        } else {
            setSelectedSchool(library);
            setView('groups');
        }
        setSearchQuery('');
    };

    const handleSelectGroup = (group: GroupData) => {
        setSelectedGroup(group);
        setActiveSubject(group.subjects[0]?.subject || '');
        setView('videos');
        setSearchQuery('');
    };

    const handleBack = () => {
        setSearchQuery('');
        if (view === 'videos') {
            if (selectedGroup === 'universal') {
                setView('library');
                setSelectedGroup(null);
            } else {
                setView('groups');
                setSelectedGroup(null);
            }
        } else if (view === 'groups') {
            setView('library');
            setSelectedSchool(null);
        }
    };
    
    const handleToggleSelect = (url: string) => {
        setSelectedUrls(prev => {
            const newSet = new Set(prev);
            if (newSet.has(url)) newSet.delete(url); else newSet.add(url);
            return newSet;
        });
    };
    
    const handleConfirm = () => onSelect(Array.from(selectedUrls));

    const renderHeader = () => {
        let title = "Select a Library";
        if (view === 'groups' && selectedSchool) title = selectedSchool.school;
        if (view === 'videos' && selectedGroup) {
            if (selectedGroup === 'universal') title = "Universal Library";
            else title = `${selectedGroup.board} - G${selectedGroup.grade}`;
        }
        return (
            <div className="flex items-center gap-4">
                {view !== 'library' && (
                    <button onClick={handleBack} className="p-2 rounded-full text-muted-foreground hover:bg-muted"><FaChevronLeft className="h-4 w-4" /></button>
                )}
                <h3 className="text-xl font-bold text-foreground">{title}</h3>
            </div>
        );
    };

    const renderContent = () => {
        const lowerQuery = searchQuery.toLowerCase();
        if (view === 'library') {
            const filteredSchools = schoolLibraryGroups.filter(s => s.school.toLowerCase().includes(lowerQuery));
            return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
                    <FolderCard name="Universal Library" details="General videos" onClick={() => handleSelectLibrary('universal')} colorClass="text-accent" />
                    {filteredSchools.map(school => <FolderCard key={school.school} name={school.school} details={`${school.studentCount} student(s)`} onClick={() => handleSelectLibrary(school)} />)}
                </div>
            );
        }
        if (view === 'groups' && selectedSchool) {
            const filteredGroups = selectedSchool.groups.filter(g => `${g.board} ${g.grade}`.toLowerCase().includes(lowerQuery));
            return (
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
                    {filteredGroups.map(group => <FolderCard key={group.id} name={`${group.board} - G${group.grade}`} details={`${group.studentCount} student(s)`} onClick={() => handleSelectGroup(group)} colorClass={boardColorClasses[group.board]} />)}
                </div>
            );
        }
        if (view === 'videos' && selectedGroup) {
            if (selectedGroup === 'universal') {
                const videos = (videoLibrary.find(e => e.id === 'universal')?.videos || []).filter(v => v.title.toLowerCase().includes(lowerQuery));
                return (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {videos.map(v => <VideoSelectionCard key={v.id} video={v} isSelected={selectedUrls.has(v.url)} onSelect={() => handleToggleSelect(v.url)} />)}
                    </div>
                );
            }
            // Curriculum group video browser
            const subjectData = selectedGroup.subjects.find(s => s.subject === activeSubject);
            const chapters = subjectData?.chapters || [];
            
            const videosForNode = (node: SyllabusNode): VideoLink[] => {
                const entryId = `${selectedGroup.school}_${selectedGroup.board}_${selectedGroup.grade}_${activeSubject}_${String(node.no)}`.replace(/\s+/g, '-');
                return videoLibrary.find(e => e.id === entryId)?.videos || [];
            };

            return (
                <div className="flex flex-col md:flex-row gap-4 h-full min-h-0">
                    <aside className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 flex flex-col gap-2">
                        <SelectField label="" name="subject" value={activeSubject} onChange={e => setActiveSubject(e.target.value)} options={selectedGroup.subjects.map(s => s.subject)} />
                        <nav className="flex-grow overflow-y-auto thin-scrollbar pr-2 -mr-2 space-y-1 bg-muted/50 p-2 rounded-lg">
                            {chapters.map(chapter => (
                                <div key={chapter.no}>
                                    <button onClick={() => setSelectedSyllabusNode(chapter)} className={`w-full text-left p-2 rounded-lg font-semibold text-sm ${selectedSyllabusNode?.no === chapter.no ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>{chapter.no}. {chapter.name}</button>
                                    {chapter.children && (
                                        <div className="pl-4">
                                            {chapter.children.map(topic => (
                                                 <button key={topic.no} onClick={() => setSelectedSyllabusNode(topic)} className={`w-full text-left p-1.5 rounded-md text-sm ${selectedSyllabusNode?.no === topic.no ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>{topic.no}. {topic.name}</button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </aside>
                    <div className="flex-grow min-w-0">
                        {selectedSyllabusNode ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {videosForNode(selectedSyllabusNode).map(v => <VideoSelectionCard key={v.id} video={v} isSelected={selectedUrls.has(v.url)} onSelect={() => handleToggleSelect(v.url)} />)}
                            </div>
                        ) : <p className="text-center text-muted-foreground pt-16">Select a chapter or topic to see videos.</p>}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card/90 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl p-6 w-full max-w-6xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 mb-4 flex justify-between items-center">
                    {renderHeader()}
                    <div className="relative w-full max-w-sm">
                        <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                        <input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full h-10 px-3 pl-10 rounded-lg border border-border bg-background"/>
                    </div>
                </header>

                <main className="flex-grow overflow-y-auto thin-scrollbar pr-2 -mr-4 min-h-0">
                    {renderContent()}
                </main>

                <footer className="mt-6 flex justify-between items-center flex-shrink-0">
                    <p className="text-sm font-semibold text-muted-foreground">{selectedUrls.size} video(s) selected</p>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold">Cancel</button>
                        <button onClick={handleConfirm} disabled={selectedUrls.size === 0} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold disabled:bg-muted disabled:cursor-not-allowed">
                            Add Selected Videos
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default SelectVideoModal;
