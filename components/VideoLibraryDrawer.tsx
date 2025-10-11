import React, { useState, useMemo, useEffect, useRef, FC } from 'react';
// FIX: Import useVideoLibrary hook
import { useVideoLibrary } from '../context/VideoLibraryContext';
import { SyllabusNode, VideoLink } from '../types';
import AddVideoModal from './AddVideoModal';
import AssignVideoModal from './AssignVideoModal';
import { FaChevronLeft, FaPlus, FaSearch, FaYoutube } from 'react-icons/fa';
import { GroupData } from './VideoLibraryPage';
import SelectField from './form/SelectField';
import DotsVerticalIcon from './icons/DotsVerticalIcon';
import ShareIcon from './icons/ShareIcon';
import DeleteIcon from './icons/DeleteIcon';
import VideoIcon from './icons/VideoIcon';

interface VideoFocusPageProps {
    group: GroupData | 'universal';
    onClose: () => void;
}

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

const VideoCard: FC<{ video: VideoLink; onAssign: () => void; onDelete: () => void; }> = ({ video, onAssign, onDelete }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const thumbnailUrl = getYoutubeThumbnail(video.url);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="group relative rounded-xl shadow-soft border border-border/50 aspect-video bg-muted overflow-hidden">
            <a href={video.url} target="_blank" rel="noopener noreferrer" className="block w-full h-full rounded-xl overflow-hidden">
                <img src={thumbnailUrl} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                        <FaYoutube className="h-6 w-6 text-white" />
                    </div>
                </div>
            </a>
            <p className="absolute bottom-2 left-3 right-10 text-white text-sm font-bold truncate drop-shadow-md" title={video.title}>
                {video.title}
            </p>
            <div ref={menuRef} className="absolute top-2 right-2 z-20">
                <button 
                    onClick={() => setIsMenuOpen(prev => !prev)} 
                    className="p-1.5 bg-black/50 rounded-full text-white hover:bg-black/80 transition-all"
                    aria-label="Video options"
                >
                    <DotsVerticalIcon className="h-4 w-4" />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-card rounded-xl shadow-soft-lg border border-border p-1.5 z-30">
                        <button onClick={() => { onAssign(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors">
                            <ShareIcon className="h-4 w-4 text-muted-foreground"/> Assign
                        </button>
                        <button onClick={() => { onDelete(); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-danger hover:bg-danger/10 hover:text-danger rounded-lg transition-colors mt-1">
                            <DeleteIcon className="h-4 w-4"/> Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const VideoFocusPage: React.FC<VideoFocusPageProps> = ({ group, onClose }) => {
    // FIX: Get video library data from useVideoLibrary hook
    const { videoLibrary, handleSaveVideo, handleDeleteVideo } = useVideoLibrary();
    const [activeSubject, setActiveSubject] = useState(group !== 'universal' ? group.subjects[0]?.subject || '' : 'universal');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNode, setSelectedNode] = useState<SyllabusNode & { level: number } | null>(null);
    const [nodeForVideoModal, setNodeForVideoModal] = useState<SyllabusNode | null>(null);
    const [assigningInfo, setAssigningInfo] = useState<{ video: VideoLink; node: Partial<SyllabusNode>; subject: string; } | null>(null);

    const generateEntryId = (subject: string, nodeNo: string | number) => {
        if (group === 'universal') return 'universal';
        return `${group.school}_${group.board}_${group.grade}_${subject}_${String(nodeNo)}`.replace(/\s+/g, '-');
    };

    // --- Universal Library View ---
    if (group === 'universal') {
        const universalEntry = videoLibrary.find(e => e.id === 'universal');
        const videos = universalEntry?.videos || [];

        const handleSave = async (title: string, url: string) => {
            const entryId = 'universal';
            const entry = videoLibrary.find(e => e.id === entryId) || { id: entryId, videos: [] };
            const newVideo: VideoLink = { id: `v_${Date.now()}`, title, url };
            await handleSaveVideo({ ...entry, videos: [...entry.videos, newVideo] });
            setNodeForVideoModal(null);
        };

        const handleDelete = (videoId: string) => {
            handleDeleteVideo('universal', videoId);
        };

        return (
            <div className="h-[calc(100vh-112px)] flex flex-col">
                <header className="mb-4 flex-shrink-0">
                    <button onClick={onClose} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                        <FaChevronLeft className="h-4 w-4" /> Back to Libraries
                    </button>
                    <div className="flex justify-between items-center mt-2">
                        <h1 className="text-3xl font-bold text-foreground">Universal Library</h1>
                        <button onClick={() => setNodeForVideoModal({ no: 'main', name: 'Universal Video' })} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 flex-shrink-0">
                            <FaPlus /> Add Video
                        </button>
                    </div>
                </header>

                <main className="flex-grow p-4 overflow-y-auto thin-scrollbar bg-card rounded-2xl shadow-soft border border-border">
                    {videos.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            {videos.map(video => (
                                <VideoCard
                                    key={video.id}
                                    video={video}
                                    onDelete={() => handleDelete(video.id)}
                                    onAssign={() => setAssigningInfo({
                                        video,
                                        node: { name: 'General', no: 'N/A' },
                                        subject: 'General'
                                    })}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                            <VideoIcon className="h-16 w-16 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground">Library is Empty</h3>
                            <p className="max-w-xs mb-4">Add the first video to get started.</p>
                             <button onClick={() => setNodeForVideoModal({ no: 'main', name: 'Universal Video' })} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
                                <FaPlus /> Add First Video
                            </button>
                        </div>
                    )}
                </main>

                {nodeForVideoModal && <AddVideoModal nodeName="Universal Video" onClose={() => setNodeForVideoModal(null)} onSave={handleSave} />}
                {assigningInfo && <AssignVideoModal info={assigningInfo} onClose={() => setAssigningInfo(null)} />}
            </div>
        );
    }
    
    // --- School Library View ---
    const title = `${group.school} • ${group.board} - G${group.grade}`;
    const subjects = group.subjects.map(s => s.subject);

    const flatSyllabus = useMemo(() => {
        if (!activeSubject) return [];
        const subjectData = group.subjects.find(s => s.subject === activeSubject);
        if (!subjectData) return [];

        const flattened: (SyllabusNode & { level: number })[] = [];
        const recurse = (nodes: SyllabusNode[], level: number) => {
            nodes.forEach(node => {
                flattened.push({ ...node, level });
                if (node.children) recurse(node.children, level + 1);
            });
        };
        
        recurse(subjectData.chapters, 1);
        return flattened;
    }, [group, activeSubject]);

    useEffect(() => {
        if (flatSyllabus && flatSyllabus.length > 0 && !selectedNode) {
            setSelectedNode(flatSyllabus[0]);
        } else if (!flatSyllabus || flatSyllabus.length === 0) {
            setSelectedNode(null);
        }
    }, [flatSyllabus, selectedNode]);

    const filteredNavList = useMemo(() => {
        if (!flatSyllabus) return [];
        if (!searchQuery.trim()) return flatSyllabus;
        const lowerQuery = searchQuery.toLowerCase();
        return flatSyllabus.filter(node => node.name.toLowerCase().includes(lowerQuery) || String(node.no).toLowerCase().includes(lowerQuery));
    }, [flatSyllabus, searchQuery]);

    const videosToShow = useMemo(() => {
        if (!selectedNode) return [];
        const entryId = generateEntryId(activeSubject, selectedNode.no);
        return videoLibrary.find(e => e.id === entryId)?.videos || [];
    }, [selectedNode, videoLibrary, activeSubject, group, generateEntryId]);
    
    const handleSave = async (title: string, url: string) => {
        if (!nodeForVideoModal?.no) return;
        const entryId = generateEntryId(activeSubject, nodeForVideoModal.no);
        const entry = videoLibrary.find(e => e.id === entryId) || { id: entryId, videos: [] };
        const newVideo: VideoLink = { id: `v_${Date.now()}`, title, url };
        await handleSaveVideo({ ...entry, videos: [...entry.videos, newVideo] });
        setNodeForVideoModal(null);
    };
    
    const handleDelete = (videoId: string) => {
        if (!selectedNode) return;
        handleDeleteVideo(generateEntryId(activeSubject, selectedNode.no), videoId);
    };

    return (
        <div className="h-[calc(100vh-112px)] flex flex-col">
            <header className="mb-4 flex-shrink-0">
                <button onClick={onClose} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <FaChevronLeft className="h-4 w-4" /> Back to Libraries
                </button>
                <h1 className="text-3xl font-bold mt-2 text-foreground">{title}</h1>
            </header>

            <div className="flex-grow flex flex-col md:flex-row gap-6 min-h-0">
                {/* Left Navigation Panel */}
                <aside className="w-full md:w-1/3 lg:w-1/4 max-w-sm flex-shrink-0 flex flex-col gap-4 bg-card/60 p-4 rounded-2xl border border-border">
                    <SelectField label="" name="subject" value={activeSubject} onChange={e => setActiveSubject(e.target.value)} options={subjects} />
                    <div className="relative">
                        <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                        <input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter chapters/topics..." className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-background" />
                    </div>
                    <nav className="flex-grow overflow-y-auto thin-scrollbar pr-2 -mr-4 space-y-1">
                        {filteredNavList.map((node, index) => {
                            const isChapter = node.level === 1;
                            return (
                                <React.Fragment key={`${node.no}-${node.name}`}>
                                    {isChapter && index > 0 && <div className="h-px bg-border my-2 mx-2"></div>}
                                    <button
                                        onClick={() => setSelectedNode(node)} 
                                        style={{ paddingLeft: `${(node.level - 1) * 1.25 + 0.5}rem` }}
                                        className={`w-full text-left p-2 rounded-lg transition-colors text-sm ${
                                            node.level === 1 ? 'font-semibold' : ''
                                        } ${
                                            selectedNode?.no === node.no ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                                        }`}
                                    >
                                        <span>{node.no}. {node.name}</span>
                                    </button>
                                </React.Fragment>
                            );
                        })}
                    </nav>
                </aside>

                {/* Right Content Panel */}
                <main className="flex-grow flex flex-col min-w-0 bg-card rounded-2xl shadow-soft border border-border">
                    {selectedNode ? (
                        <>
                            <header className="flex-shrink-0 p-4 border-b border-border flex justify-between items-center">
                                <h2 className="text-xl font-bold truncate pr-4">{selectedNode.no}. {selectedNode.name}</h2>
                                <button onClick={() => setNodeForVideoModal(selectedNode)} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 flex-shrink-0">
                                    <FaPlus /> Add Video
                                </button>
                            </header>
                            <div className="flex-grow p-4 overflow-y-auto thin-scrollbar">
                                {videosToShow.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {videosToShow.map(video => (
                                            <VideoCard key={video.id} video={video} onDelete={() => handleDelete(video.id)} onAssign={() => setAssigningInfo({ video, node: selectedNode, subject: activeSubject })} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                                        <VideoIcon className="h-16 w-16 mb-4" />
                                        <h3 className="text-lg font-semibold text-foreground">No Videos Here Yet</h3>
                                        <p className="max-w-xs mb-4">Add the first video to this topic to get started.</p>
                                        <button onClick={() => setNodeForVideoModal(selectedNode)} className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
                                            <FaPlus /> Add First Video
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center text-center text-muted-foreground p-8">
                             <VideoIcon className="h-16 w-16 mb-4" />
                             <h3 className="text-lg font-semibold text-foreground">Select a Topic</h3>
                             <p className="max-w-xs">Choose a topic from the list on the left to view or add videos.</p>
                        </div>
                    )}
                </main>
            </div>
            
            {nodeForVideoModal && <AddVideoModal nodeName={nodeForVideoModal.name!} onClose={() => setNodeForVideoModal(null)} onSave={handleSave} />}
            {assigningInfo && <AssignVideoModal info={assigningInfo} onClose={() => setAssigningInfo(null)} />}
        </div>
    );
}

export default VideoFocusPage;