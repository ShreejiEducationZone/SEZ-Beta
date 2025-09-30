import React from 'react';
import { useData } from '../../context/DataContext';
import App from '../../App';
import Login from './Login';
import StudentPortal from '../StudentPortal';

const AuthWrapper: React.FC = () => {
    const { currentUser, isLoading } = useData();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-blue"></div>
            </div>
        );
    }

    if (!currentUser) {
        return <Login />;
    }

    if (currentUser.role === 'admin') {
        return <App />;
    }

    if (currentUser.role === 'student') {
        return <StudentPortal />;
    }

    // Fallback in case of an invalid role
    return <Login />;
};

export default AuthWrapper;
