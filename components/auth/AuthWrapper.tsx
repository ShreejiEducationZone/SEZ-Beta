import React from 'react';
import { useData } from '../../context/DataContext';
import App from '../../App';
import Login from './Login';
import StudentPortal from '../StudentPortal';
import ParentsPortal from '../ParentsPortal';
import SplashScreenLoader from './SplashScreenLoader';

const AuthWrapper: React.FC = () => {
    const { currentUser, isAppReady } = useData();

    if (!isAppReady) {
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

    if (currentUser.role === 'parent') {
        return <ParentsPortal />;
    }

    // Fallback in case of an invalid role
    return <Login />;
};

export default AuthWrapper;