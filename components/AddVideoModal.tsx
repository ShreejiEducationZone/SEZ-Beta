import React, { useState } from 'react';

interface AddVideoModalProps {
    nodeName: string;
    onClose: () => void;
    onSave: (title: string, url: string) => void;
}

const AddVideoModal: React.FC<AddVideoModalProps> = ({ nodeName, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    
    const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    
    const handleSave = () => {
        if (!title.trim() || !url.trim()) {
            setError('Title and URL cannot be empty.');
            return;
        }
        if (!YOUTUBE_REGEX.test(url.trim())) {
            setError('Please enter a valid YouTube URL.');
            return;
        }
        onSave(title.trim(), url.trim());
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-card/90 backdrop-blur-lg border border-border rounded-2xl shadow-soft-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-foreground">Add Video</h3>
                <p className="text-sm text-muted-foreground mt-1">For: {nodeName}</p>
                <div className="mt-4 space-y-4">
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Video Title" className="w-full h-10 px-3 rounded-lg border border-border bg-background" />
                    <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="YouTube Video URL" className="w-full h-10 px-3 rounded-lg border border-border bg-background" />
                    {error && <p className="text-sm text-danger">{error}</p>}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="h-10 px-5 rounded-lg bg-muted text-muted-foreground hover:bg-border font-semibold">Cancel</button>
                    <button onClick={handleSave} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">Save Video</button>
                </div>
            </div>
        </div>
    );
};

export default AddVideoModal;
