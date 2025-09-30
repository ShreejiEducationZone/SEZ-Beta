import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { FaBookOpen, FaUserShield, FaUserGraduate } from 'react-icons/fa';

const Login: React.FC = () => {
    const { login } = useData();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isStudentLoading, setIsStudentLoading] = useState(false);
    const [isAdminLoading, setIsAdminLoading] = useState(false);

    const handleAdminLogin = async () => {
        setError('');
        setIsAdminLoading(true);
        try {
            await login('sez@admin.com', 'pass12345');
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            setIsAdminLoading(false);
        }
    };

    const handleStudentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsStudentLoading(true);
        try {
            await login(name, password);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            setIsStudentLoading(false);
        }
    };

    const renderLoadingSpinner = () => (
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-8">
                    <div className="flex justify-center items-center gap-3">
                        <FaBookOpen className="h-10 w-10 text-brand-blue" />
                        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">SEZ Dashboard</h1>
                    </div>
                     <p className="text-gray-500 dark:text-gray-400 mt-2">Select your role to sign in.</p>
                </div>
                
                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
                    {/* Student Login Section */}
                    <div className="p-8">
                        <div className="flex flex-col items-center text-center mb-6">
                            <FaUserGraduate className="h-10 w-10 text-brand-blue mb-2" />
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Student Login</h2>
                        </div>
                        <form onSubmit={handleStudentSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-brand-blue"
                                    placeholder="e.g. Dhruv Ahir"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mt-1 block w-full h-12 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-brand-blue"
                                    placeholder="••••••••"
                                />
                            </div>
                            
                            <div>
                                <button
                                    type="submit"
                                    disabled={isStudentLoading || isAdminLoading}
                                    className="w-full h-12 flex justify-center items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-blue hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isStudentLoading ? renderLoadingSpinner() : 'Sign In'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Admin Login Section */}
                    <div className="p-8 bg-gray-50 dark:bg-dark-bg/50 flex flex-col justify-center items-center text-center">
                         <FaUserShield className="h-10 w-10 text-gray-600 dark:text-gray-400 mb-2" />
                         <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Administrator</h2>
                         <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">For authorized personnel only. Click below for quick access.</p>
                         <button
                            type="button"
                            onClick={handleAdminLogin}
                            disabled={isAdminLoading || isStudentLoading}
                            className="w-full h-12 flex justify-center items-center gap-3 px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isAdminLoading ? renderLoadingSpinner() : <FaUserShield className="h-5 w-5" />}
                            Login as Admin
                        </button>
                    </div>
                </div>
                 {error && <p className="mt-4 text-sm text-red-500 text-center font-semibold">{error}</p>}
            </div>
        </div>
    );
};

export default Login;