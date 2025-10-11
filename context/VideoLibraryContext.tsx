import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { getCollection, setDocument, deleteDocument } from '../firebase';
import { VideoLibraryEntry } from '../types';
import { useData } from './DataContext';

interface VideoLibraryContextType {
    videoLibrary: VideoLibraryEntry[];
    isLoading: boolean;
    handleSaveVideo: (entry: VideoLibraryEntry) => Promise<void>;
    handleDeleteVideo: (entryId: string, videoId: string) => Promise<void>;
}

const VideoLibraryContext = createContext<VideoLibraryContextType | undefined>(undefined);

export const VideoLibraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [videoLibrary, setVideoLibrary] = useState<VideoLibraryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const { currentUser, showToast } = useData();

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) {
                setVideoLibrary([]);
                return;
            }
            setIsLoading(true);
            try {
                const videoLibraryData = await getCollection("videoLibrary");
                setVideoLibrary(videoLibraryData as VideoLibraryEntry[]);
            } catch (error) {
                showToast("Could not load video library.", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [currentUser, showToast]);

    const handleSaveVideo = useCallback(async (entry: VideoLibraryEntry) => {
        try {
            await setDocument("videoLibrary", entry.id, entry);
            setVideoLibrary(prev => {
                const exists = prev.some(v => v.id === entry.id);
                if (exists) return prev.map(v => v.id === entry.id ? entry : v);
                return [...prev, entry];
            });
            showToast('Video library updated!', 'success');
        } catch (error: any) {
            showToast(`Failed to save video: ${error.message}`, 'error');
            throw error;
        }
    }, [showToast]);

    const handleDeleteVideo = useCallback(async (entryId: string, videoId: string) => {
        const entry = videoLibrary.find(v => v.id === entryId);
        if (!entry) return;
        const updatedEntry = { ...entry, videos: entry.videos.filter(v => v.id !== videoId) };

        try {
            if (updatedEntry.videos.length > 0) {
                await setDocument("videoLibrary", entryId, updatedEntry);
            } else {
                await deleteDocument("videoLibrary", entryId);
            }
            
            setVideoLibrary(prev => {
                if (updatedEntry.videos.length > 0) return prev.map(v => v.id === entryId ? updatedEntry : v);
                return prev.filter(v => v.id !== entryId);
            });
            showToast('Video deleted.', 'success');
        } catch (error: any) {
            showToast(`Failed to delete video: ${error.message}`, 'error');
            throw error;
        }
    }, [videoLibrary, showToast]);

    const value = { videoLibrary, isLoading, handleSaveVideo, handleDeleteVideo };

    return <VideoLibraryContext.Provider value={value}>{children}</VideoLibraryContext.Provider>;
};

export const useVideoLibrary = () => {
    const context = useContext(VideoLibraryContext);
    if (context === undefined) {
        throw new Error('useVideoLibrary must be used within a VideoLibraryProvider');
    }
    return context;
};
