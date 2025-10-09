import React from 'react';
import { VideoLink } from '../../types';
import { FaYoutube } from 'react-icons/fa';

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

interface SPVideoCardProps {
    video: VideoLink;
    subtitle?: string;
}

const SPVideoCard: React.FC<SPVideoCardProps> = ({ video, subtitle }) => {
    const thumbnailUrl = getYoutubeThumbnail(video.url);

    return (
        <a 
            href={video.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="group block bg-card rounded-2xl shadow-soft border border-border overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft-lg"
        >
            <div className="relative aspect-video bg-muted">
                <img src={thumbnailUrl} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-50"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                        <FaYoutube className="h-6 w-6 text-white" />
                    </div>
                </div>
            </div>
            <div className="p-4">
                <h4 className="font-bold text-foreground truncate">{video.title}</h4>
                {subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
            </div>
        </a>
    );
};

export default SPVideoCard;