import React, { useState } from 'react';
import PlaceholderAvatar from '../PlaceholderAvatar';
import EyeIcon from '../icons/EyeIcon';
import EyeSlashIcon from '../icons/EyeSlashIcon';
import EditIcon from '../icons/EditIcon';

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border last:border-b-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="text-sm text-foreground font-semibold">{value}</div>
        </div>
    );

    return (
        <div className="max-w-3xl">
            <h2 className="text-3xl font-bold mb-8">Administrator</h2>
            
            <div className="bg-muted/50 rounded-xl border border-border p-6 space-y-6">
                <div className="flex items-center gap-4">
                     <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {adminData.avatarUrl ? <img src={adminData.avatarUrl} alt="Admin" className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold">{adminData.name}</h3>
                        <p className="text-sm text-muted-foreground">ID: {adminData.id}</p>
                    </div>
                     <button 
                        onClick={() => alert('Edit profile functionality is not implemented yet.')}
                        className="ml-auto flex items-center gap-2 h-9 px-4 rounded-lg bg-background border border-border hover:bg-border text-sm font-semibold"
                    >
                        <EditIcon className="h-4 w-4" /> Edit
                    </button>
                </div>

                <div>
                    <DetailItem label="Email Address" value={adminData.email} />
                    <DetailItem label="Phone Number" value={adminData.phone} />
                    <DetailItem label="Member Since" value={new Date(adminData.joinedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                    <DetailItem 
                        label="Password" 
                        value={
                             <div className="flex items-center gap-2">
                                <span>{isPasswordVisible ? adminData.password : '••••••••••'}</span>
                                <button onClick={() => setIsPasswordVisible(p => !p)} className="text-muted-foreground">
                                    {isPasswordVisible ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                                </button>
                            </div>
                        } 
                    />
                </div>
            </div>
        </div>
    );
};

export default AdministratorSettings;