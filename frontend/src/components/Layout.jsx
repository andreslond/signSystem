import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, LogOut, User } from 'lucide-react';
import { Button } from './ui/Button';

export default function Layout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <span className="text-2xl font-extrabold text-indigo-600 tracking-tight">CrewOps</span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-700">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                    JD
                                </div>
                                <span className="hidden sm:inline font-medium">John Doe</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleLogout} title="Cerrar sesión">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
