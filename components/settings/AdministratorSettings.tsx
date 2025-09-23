
import React, { useState } from 'react';
import PlaceholderAvatar from '../PlaceholderAvatar';
import EyeIcon from '../icons/EyeIcon';
import EyeSlashIcon from '../icons/EyeSlashIcon';
import EditIcon from '../icons/EditIcon';
import DeleteIcon from '../icons/DeleteIcon';

const adminData = {
    id: 'admin01',
    name: 'Main Administrator',
    email: 'admin@example.com',
    phone: '123-456-7890',
    password: 'adminpassword',
    joinedDate: '2023-01-15',
    avatarUrl: 'https://i.pravatar.cc/150?u=admin'
};

const AdministratorSettings: React.FC = () => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    
    const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
        <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <div className="text-base text-gray-800 dark:text-gray-200">{value}</div>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Administrator Profile</h2>
            
            <div className="bg-light-card dark:bg-dark-card rounded-2xl shadow-sm p-6 space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                     <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        {adminData.avatarUrl ? <img src={adminData.avatarUrl} alt="Admin" className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold">{adminData.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">ID: {adminData.id}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <DetailItem label="Email Address" value={adminData.email} />
                    <DetailItem label="Phone Number" value={adminData.phone} />
                    <DetailItem label="Member Since" value={new Date(adminData.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                    <DetailItem 
                        label="Password" 
                        value={
                             <div className="flex items-center gap-2">
                                <span>{isPasswordVisible ? adminData.password : '••••••••••'}</span>
                                <button onClick={() => setIsPasswordVisible(p => !p)} className="text-gray-500">
                                    {isPasswordVisible ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                                </button>
                            </div>
                        } 
                    />
                </div>
                
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={() => alert('Edit profile functionality is not implemented yet.')}
                        className="flex items-center gap-2 h-10 px-4 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-semibold"
                    >
                        <EditIcon className="h-4 w-4" /> Edit Profile
                    </button>
                    <button 
                         onClick={() => alert('Delete account functionality is not implemented yet.')}
                        className="flex items-center gap-2 h-10 px-4 rounded-md bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/60 text-sm font-semibold"
                    >
                        <DeleteIcon className="h-4 w-4" /> Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdministratorSettings;
