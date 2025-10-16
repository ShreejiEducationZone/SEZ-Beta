import React, { useState, useEffect } from 'react';

const PermissionSettings: React.FC = () => {
    const [cameraPermission, setCameraPermission] = useState<string>('checking...');

    useEffect(() => {
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'camera' as PermissionName }).then(status => {
                setCameraPermission(status.state);
                status.onchange = () => setCameraPermission(status.state);
            }).catch(() => {
                setCameraPermission('unavailable');
            });
        } else {
            setCameraPermission('unavailable');
        }
    }, []);

    const permissionStatusText: Record<string, {text: string, color: string}> = {
        granted: { text: 'Allowed', color: 'text-success' },
        prompt: { text: 'Ask for Permission', color: 'text-warning' },
        denied: { text: 'Blocked', color: 'text-danger' },
        checking: { text: 'Checking...', color: 'text-muted-foreground' },
        unavailable: { text: 'Not Supported', color: 'text-muted-foreground' },
    }
    const cameraStatus = permissionStatusText[cameraPermission] || permissionStatusText.unavailable;
    
    return (
        <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-8">Permissions</h2>
            <div className="bg-muted/50 rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between p-4 min-h-[56px]">
                    <div>
                        <h3 className="font-semibold text-foreground">Camera Access</h3>
                        <p className="text-xs text-muted-foreground">Required for the Face Recognition Attendance feature.</p>
                    </div>
                    <span className={`font-semibold text-sm ${cameraStatus.color}`}>{cameraStatus.text}</span>
                </div>
                <div className="p-4 border-t border-border text-xs text-muted-foreground">
                   If access is blocked, you can re-enable it in your browser's site settings.
                </div>
            </div>
        </div>
    );
};

export default PermissionSettings;