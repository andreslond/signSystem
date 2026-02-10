import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Users, ArrowRight } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        navigate('/documents/pending');
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2069")',
                    filter: 'brightness(0.5)'
                }}
            />
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 to-transparent h-1/2" />

            <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center pt-20">
                {/* Logo/Brand Section */}
                <div className="flex flex-col items-center mb-12">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-primary p-2 rounded-lg flex items-center justify-center">
                            <Users className="text-white" size={24} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">
                            CrewOps
                        </h1>
                    </div>
                    <p className="text-white/80 text-sm font-medium">
                        Gestión integral de personal
                    </p>
                </div>

                {/* Login Card */}
                <div className="w-full bg-white rounded-[24px] shadow-2xl p-8 mb-8">
                    <h2 className="text-[26px] font-bold text-text-primary mb-1">
                        Bienvenido
                    </h2>
                    <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                        Inicia sesión para gestionar tu información.
                    </p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <Input
                            label="Correo electrónico"
                            type="email"
                            placeholder="nombre@crewops.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={Mail}
                            required
                        />

                        <div className="space-y-1">
                            <Input
                                label="Contraseña"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={Lock}
                                rightIcon={showPassword ? EyeOff : Eye}
                                onClickRightIcon={() => setShowPassword(!showPassword)}
                                required
                            />
                            <div className="flex justify-end">
                                <a href="#" className="text-xs text-text-muted hover:text-primary transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                type="submit"
                                className="w-full"
                                icon={ArrowRight}
                            >
                                Ingresar
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Security Footer */}
                <div className="flex flex-col items-center gap-4 mt-auto pb-10">
                    <div className="w-8 h-[1px] bg-border/20" />
                    <div className="flex items-center gap-2 text-text-muted/60 text-xs">
                        <ShieldCheck size={16} className="text-text-muted/40" />
                        <span>Acceso seguro a sus documentos</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
