import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { SubjectData, SyllabusNode, VideoLink } from '../types';
import AddVideoModal from './AddVideoModal';
import { FaChevronLeft, FaPlus, FaTrash, FaYoutube, FaChevronDown } from 'react-icons/fa';
import { GroupData } from './VideoLibraryPage';
import SelectField from './form/SelectField';

interface VideoLibraryPageProps {
    group: GroupData | 'universal';
    onClose: () => void;
}

const VideoLibraryPage: React.FC<VideoLibraryPageProps> = ({ group, onClose }) => {
    const { videoLibrary, handleSaveVideo, handleDeleteVideo } = useData();
    const [activeSubject, setActiveSubject] = useState(group !== 'universal' ? group.subjects[0]?.subject : '');
    const [searchQuery, setSearchQuery] = useState('');
    const [nodeForVideo, setNodeForVideo] = useState<SyllabusNode | null>(null);
    const [expandedChapters, setExpandedChapters] = useState<Set<string | number>>(new Set());

    const title = group === 'universal' ? 'Universal Library' : `${group.school} • ${group.board} - Grade ${group.grade}`;
    const subjects = group === 'universal' ? [] : group.subjects.map(s => s.subject);

    const generateEntryId = (subject: string, nodeNo: string | number) => {
        if (group === 'universal') return 'universal';
        return `${group.school}_${group.board}_${group.grade}_${subject}_${String(nodeNo)}`.replace(/\s+/g, '-');
    };

    const handleSave = async (title: string, url: string) => {
        const subject = group === 'universal' ? 'universal' : activeSubject;
        const nodeNo = group === 'universal' ? 'main' : nodeForVideo!.no;
        
        const entryId = generateEntryId(subject, nodeNo);
        const entry = videoLibrary.find(e => e.id === entryId) || { id: entryId, videos: [] };
        
        const newVideo: VideoLink = { id: `v_${Date.now()}`, title, url };
        const updatedEntry = { ...entry, videos: [...entry.videos, newVideo] };

        await handleSaveVideo(updatedEntry);
        setNodeForVideo(null);
    };
    
    const handleDelete = (subject: string, nodeNo: string | number, videoId: string) => {
        const entryId = generateEntryId(subject, nodeNo);
        handleDeleteVideo(entryId, videoId);
    }
    
    const filteredAndGroupedSyllabus = useMemo(() => {
        if (group === 'universal' || !activeSubject) return [];
        const subjectData = group.subjects.find(s => s.subject === activeSubject);
        if (!subjectData) return [];

        const lowercasedQuery = searchQuery.toLowerCase();

        return subjectData.chapters.map(chapter => {
            const filteredTopics = (chapter.children || []).filter(topic => 
                topic.name.toLowerCase().includes(lowercasedQuery) || 
                String(topic.no).toLowerCase().includes(lowercasedQuery)
            );
            
            if (filteredTopics.length > 0 || chapter.name.toLowerCase().includes(lowercasedQuery)) {
                return { ...chapter, children: filteredTopics.length > 0 ? filteredTopics : chapter.children || [] };
            }
            return null;
        }).filter(Boolean) as SyllabusNode[];

    }, [group, activeSubject, searchQuery]);
    
    const toggleChapter = (chapterNo: string | number) => {
        setExpandedChapters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(chapterNo)) {
                newSet.delete(chapterNo);
            } else {
                newSet.add(chapterNo);
            }
            return newSet;
        });
    };

    return (
        <div>
            <header className="mb-6">
                <button onClick={onClose} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <FaChevronLeft className="h-4 w-4" /> Back to Libraries
                </button>
                <h1 className="text-3xl font-bold mt-4 text-foreground">{title}</h1>
            </header>

            {group !== 'universal' && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 sticky top-[88px] z-10 bg-background/80 backdrop-blur-md py-4 -my-4 px-1 -mx-1">
                    <SelectField label="Subject" name="subject" value={activeSubject} onChange={e => setActiveSubject(e.target.value)} options={subjects} />
                    <div className="relative">
                        <label htmlFor="video-search" className="block text-sm font-medium text-muted-foreground">Search Topics</label>
                        <input
                            type="search"
                            id="video-search"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="e.g., Photosynthesis, 1.2, etc."
                            className="mt-1 block w-full h-10 px-3 rounded-lg border border-border bg-background"
                        />
                    </div>
                </div>
            )}
            
            <main className="space-y-4">
                {group === 'universal' && (
                    <div className="bg-card rounded-xl shadow-soft border border-border p-4">
                        <button onClick={() => setNodeForVideo({ no: 'main', name: 'Universal' })} className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors">
                            <FaPlus /> Add Universal Video
                        </button>
                        <div className="space-y-2 mt-4">
                            {(videoLibrary.find(e => e.id === 'universal')?.videos || []).map(video => (
                                <div key={video.id} className="group flex items-center justify-between text-sm p-2 rounded-md bg-muted">
                                    <a href={video.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline truncate pr-2">
                                        <FaYoutube className="text-red-500 flex-shrink-0" /> {video.title}
                                    </a>
                                    <button onClick={() => handleDelete('universal', 'main', video.id)} className="p-1 text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash className="h-4 w-4"/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {group !== 'universal' && filteredAndGroupedSyllabus.map(chapter => {
                    const isExpanded = expandedChapters.has(chapter.no);
                    return (
                        <div key={chapter.no} className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
                            <button onClick={() => toggleChapter(chapter.no)} className="w-full flex items-center justify-between p-4 text-left">
                                <h3 className="font-bold text-lg text-primary">{chapter.no}. {chapter.name}</h3>
                                <FaChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isExpanded && (
                                <div className="px-4 pb-4 space-y-3">
                                    {(chapter.children || []).map(topic => {
                                        const entryId = generateEntryId(activeSubject, topic.no);
                                        const videos = videoLibrary.find(e => e.id === entryId)?.videos || [];
                                        return (
                                            <div key={topic.no} className="py-2 border-t border-border">
                                                <div className="flex justify-between items-center">
                                                    <p className="font-semibold text-foreground">{topic.no}. {topic.name}</p>
                                                    <button onClick={() => setNodeForVideo(topic)} className="p-1 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10" title="Add Video"><FaPlus className="h-4 w-4" /></button>
                                                </div>
                                                <div className="pl-4 mt-2 space-y-2">
                                                    {videos.map(video => (
                                                        <div key={video.id} className="group flex items-center justify-between text-sm p-1.5 rounded-md hover:bg-muted/50">
                                                            <a href={video.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline truncate pr-2">
                                                                <FaYoutube className="text-red-500 flex-shrink-0" /> {video.title}
                                                            </a>
                                                            <button onClick={() => handleDelete(activeSubject, topic.no, video.id)} className="p-1 text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"><FaTrash className="h-4 w-4"/></button>
                                                        </div>
                                                    ))}
                                                    {videos.length === 0 && <p className="text-xs text-muted-foreground italic">No videos added for this topic yet.</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )
                })}
            </main>
            
            {nodeForVideo && (
                <AddVideoModal
                    nodeName={nodeForVideo.name}
                    onClose={() => setNodeForVideo(null)}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}

export default VideoLibraryPage;