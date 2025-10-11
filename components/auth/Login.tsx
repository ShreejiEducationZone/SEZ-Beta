import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useStudent } from '../../context/StudentContext';
import { FaBookOpen, FaUserShield, FaUserGraduate } from 'react-icons/fa';

const Login: React.FC = () => {
    const { login } = useData();
    const { students } = useStudent();
    const [loginAs, setLoginAs] = useState<'student' | 'admin'>('student');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (loginAs === 'admin') {
                await login('sez@admin.com', 'pass12345', students);
            } else {
                await login(name, password, students);
            }
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
            setIsLoading(false); // only stop loading on error, on success it will unmount
        }
    };

    const renderLoadingSpinner = () => (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background transition-colors duration-300 login-bg">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex justify-center items-center gap-3 text-foreground">
                        <FaBookOpen className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-bold">SEZ Dashboard</h1>
                    </div>
                </div>

                <div className="bg-card/60 dark:bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl shadow-soft-xl p-8">
                    {/* Toggle Switch */}
                    <div className="relative flex items-center bg-muted p-1 rounded-full mb-8">
                        <div 
                            className="absolute h-[calc(100%-0.5rem)] w-1/2 bg-background rounded-full shadow-soft transition-transform duration-300 ease-in-out"
                            style={{ transform: `translateX(${loginAs === 'student' ? '0%' : '100%'})` }}
                        ></div>
                        <button onClick={() => setLoginAs('student')} className="relative w-1/2 z-10 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                            <FaUserGraduate className={loginAs === 'student' ? 'text-primary' : 'text-muted-foreground'} />
                            <span className={loginAs === 'student' ? 'text-foreground' : 'text-muted-foreground'}>Student</span>
                        </button>
                        <button onClick={() => setLoginAs('admin')} className="relative w-1/2 z-10 py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                            <FaUserShield className={loginAs === 'admin' ? 'text-primary' : 'text-muted-foreground'} />
                            <span className={loginAs === 'admin' ? 'text-foreground' : 'text-muted-foreground'}>Admin</span>
                        </button>
                    </div>

                    {/* Forms Container */}
                    <div className="relative min-h-[260px]">
                        {/* Student Form */}
                        <div className={`absolute top-0 w-full transition-opacity duration-300 ${loginAs === 'student' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">Full Name</label>
                                    <input
                                        id="name"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="mt-1 block w-full h-12 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50"
                                        placeholder="e.g. Rohan Sharma"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">Password</label>
                                    <input
                                        id="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="mt-1 block w-full h-12 px-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 flex justify-center items-center px-4 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                                >
                                    {isLoading && loginAs === 'student' ? renderLoadingSpinner() : 'Sign In'}
                                </button>
                            </form>
                        </div>
                        
                        {/* Admin Form */}
                        <div className={`absolute top-0 w-full transition-opacity duration-300 ${loginAs === 'admin' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-foreground">Administrator Access</h3>
                                <p className="text-muted-foreground mt-2 mb-6">Click the button below for quick access as an administrator.</p>
                                <button
                                    type="button"
                                    onClick={handleLogin}
                                    disabled={isLoading}
                                    className="w-full h-12 flex justify-center items-center gap-3 px-4 rounded-lg text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                                >
                                    {isLoading && loginAs === 'admin' ? renderLoadingSpinner() : <FaUserShield className="h-5 w-5" />}
                                    Login as Admin
                                </button>
                            </div>
                        </div>
                    </div>
                     {error && <p className="mt-4 text-sm text-danger text-center font-semibold">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default Login;
