import React from 'react';
import { useData } from '../../context/DataContext';
import App from '../../App';
import Login from './Login';
import StudentPortal from '../StudentPortal';
import SplashScreenLoader from './SplashScreenLoader';

const AuthWrapper: React.FC = () => {
    const { currentUser, isLoading } = useData();

    if (isLoading) {
        return <SplashScreenLoader />;
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