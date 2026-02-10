import React from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        // Simulate login
        navigate('/documents');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-300">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">CrewOps</h1>
                    <p className="mt-2 text-sm text-gray-600">Gestión integral de personal y nómina</p>
                </div>

                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Bienvenido</h2>
                        <p className="text-sm text-gray-500">Inicia sesión para gestionar tu información laboral</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    type="email"
                                    placeholder="Correo electrónico"
                                    className="pl-10"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    type="password"
                                    placeholder="Contraseña"
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                        </div>

                        <Button type="submit" className="w-full text-lg py-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                            Iniciar Sesión
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-xs text-gray-500">
                        <p>Acceso seguro a sus documentos</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
