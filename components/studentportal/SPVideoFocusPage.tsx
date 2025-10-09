import React, { useState, useMemo, FC } from 'react';
import { useData } from '../../context/DataContext';
import { SyllabusNode, VideoLink, Student } from '../../types';
import { FaChevronLeft, FaSearch } from 'react-icons/fa';
import { GroupData } from './SPVideoLibraryPage'; 
import SelectField from '../form/SelectField';
import SPVideoCard from './SPVideoCard';
import VideoIcon from '../icons/VideoIcon';

interface SPVideoFocusPageProps {
    student: Student;
    group: GroupData | 'universal';
    onClose: () => void;
}

const SPVideoFocusPage: FC<SPVideoFocusPageProps> = ({ student, group, onClose }) => {
    const { videoLibrary } = useData();
    
    const initialSubject = group !== 'universal' && group.subjects.length > 0 ? group.subjects[0].subject : 'All';
    const [activeSubject, setActiveSubject] = useState(initialSubject);
    const [searchQuery, setSearchQuery] = useState('');

    const title = group === 'universal' ? 'Universal Library' : `${group.board} - G${group.grade}`;
    const subjects = group === 'universal' ? [] : ['All', ...group.subjects.map(s => s.subject)];

    const allVideosInGroup = useMemo(() => {
        const videos: (VideoLink & { subject: string; chapterName: string; chapterNo: string|number; })[] = [];
        if (group === 'universal') {
            const entry = videoLibrary.find(e => e.id === 'universal');
            (entry?.videos || []).forEach(video => {
                videos.push({ ...video, subject: 'General', chapterName: 'Universal Library', chapterNo: '' });
            });
        } else {
            group.subjects.forEach(subjectData => {
                const addVideosFromNodes = (nodes: SyllabusNode[]) => {
                    nodes.forEach(node => {
                        const entryId = `${group.school}_${group.board}_${group.grade}_${subjectData.subject}_${String(node.no)}`.replace(/\s+/g, '-');
                        const entry = videoLibrary.find(e => e.id === entryId);
                        if (entry) {
                            entry.videos.forEach(video => {
                                videos.push({ ...video, subject: subjectData.subject, chapterName: node.name, chapterNo: node.no });
                            });
                        }
                        if (node.children) addVideosFromNodes(node.children);
                    });
                };
                addVideosFromNodes(subjectData.chapters);
            });
        }
        return videos;
    }, [group, videoLibrary]);

    const filteredVideos = useMemo(() => {
        let videos = allVideosInGroup;

        if (activeSubject !== 'All' && activeSubject !== 'universal') {
            videos = videos.filter(v => v.subject === activeSubject);
        }

        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            videos = videos.filter(video => 
                video.title.toLowerCase().includes(lowerQuery) ||
                video.subject.toLowerCase().includes(lowerQuery) ||
                video.chapterName.toLowerCase().includes(lowerQuery) ||
                String(video.chapterNo).toLowerCase().includes(lowerQuery)
            );
        }
        return videos;
    }, [allVideosInGroup, activeSubject, searchQuery]);

    return (
        <div className="h-full flex flex-col">
            <header className="mb-4 flex-shrink-0">
                <button onClick={onClose} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    <FaChevronLeft className="h-4 w-4" /> Back to Libraries
                </button>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mt-2 gap-4">
                    <h1 className="text-3xl font-bold text-foreground">{title}</h1>
                     <div className="flex items-center gap-4 w-full sm:w-auto">
                        {group !== 'universal' && subjects.length > 1 && (
                            <div className="w-full sm:w-48">
                                <SelectField label="" name="subject" value={activeSubject} onChange={e => setActiveSubject(e.target.value)} options={subjects} />
                            </div>
                        )}
                        <div className="relative flex-grow">
                             <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
                             <input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search in this library..." className="w-full h-10 pl-10 pr-3 rounded-lg border border-border bg-background" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow p-4 -mx-4 overflow-y-auto thin-scrollbar">
                {filteredVideos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredVideos.map(video => (
                            <SPVideoCard 
                                key={video.id} 
                                video={video} 
                                subtitle={video.subject !== 'General' ? `${video.subject} - Ch ${video.chapterNo}` : undefined}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                        <VideoIcon className="h-16 w-16 mb-4 opacity-50"/>
                        <h3 className="text-lg font-semibold text-foreground">No Videos Found</h3>
                        <p className="max-w-xs">There are no videos matching your search or filter criteria in this library.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default SPVideoFocusPage;