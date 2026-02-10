import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, Home, Briefcase, User, Settings } from 'lucide-react';

export default function AppLayout({ children, title }) {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { id: 'inicio', label: 'Inicio', icon: Home, path: '/documents/pending' },
        { id: 'cuentas', label: 'Cuentas', icon: Briefcase, path: '/documents/pending', active: true },
        { id: 'perfil', label: 'Perfil', icon: User, path: '#' },
        { id: 'ajustes', label: 'Ajustes', icon: Settings, path: '#' },
    ];

    return (
        <div className="min-h-screen bg-[#fcfcfc] flex flex-col pb-24">
            {/* Top Bar */}
            <header className="bg-white px-6 py-5 flex items-center justify-between shadow-sm sticky top-0 z-50">
                <button className="text-text-primary p-1">
                    <Menu size={24} strokeWidth={2} />
                </button>
                <h1 className="text-[19px] font-bold text-text-primary">
                    {title}
                </h1>
                <button className="text-text-primary p-1 relative">
                    <Bell size={24} strokeWidth={2} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border-2 border-white"></span>
                </button>
            </header>

            {/* Content Area */}
            <main className="flex-1 max-w-[440px] w-full mx-auto">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f0f0f0] px-6 py-3 flex justify-between items-center z-50">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => item.path !== '#' && navigate(item.path)}
                        className={`flex flex-col items-center gap-1.5 transition-colors duration-200 ${item.active
                                ? 'text-text-primary'
                                : 'text-text-muted/60'
                            }`}
                    >
                        <item.icon
                            size={24}
                            strokeWidth={item.active ? 2.5 : 2}
                        />
                        <span className={`text-[11px] font-bold tracking-tight ${item.active ? 'text-text-primary' : 'text-text-muted/60'
                            }`}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </nav>
        </div>
    );
}
