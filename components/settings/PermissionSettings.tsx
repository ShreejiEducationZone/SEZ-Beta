
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
        granted: { text: 'Allowed', color: 'text-green-500' },
        prompt: { text: 'Ask for Permission', color: 'text-yellow-500' },
        denied: { text: 'Blocked', color: 'text-red-500' },
        checking: { text: 'Checking...', color: 'text-gray-500' },
        unavailable: { text: 'Not Supported', color: 'text-gray-500' },
    }
    const cameraStatus = permissionStatusText[cameraPermission] || permissionStatusText.unavailable;
    
    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Permissions</h2>
            <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 min-h-[56px]">
                    <span className="font-medium">Camera Access</span>
                    <span className={`font-semibold ${cameraStatus.color}`}>{cameraStatus.text}</span>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                   Camera access is required for the Attendance feature. If access is blocked, you can re-enable it in your browser's site settings.
                </div>
            </div>
        </div>
    );
};

export default PermissionSettings;
