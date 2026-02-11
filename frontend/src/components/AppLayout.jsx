import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Home, Briefcase, User, Settings, Menu, X, Sun, Moon, LogOut } from 'lucide-react';

export default function AppLayout({ children, title }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved) return saved === 'dark';
            return document.documentElement.classList.contains('dark');
        }
        return false;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const navItems = [
        { id: 'inicio', label: 'Inicio', icon: Home, path: '/documents/pending' },
        { id: 'cuentas', label: 'Mis Cuentas', icon: Briefcase, path: '/documents/pending', active: true },
        { id: 'perfil', label: 'Mi Perfil', icon: User, path: '#' },
    ];

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    return (
        <div className="min-h-screen bg-background text-text-primary flex flex-col transition-colors duration-300">
            {/* Top Bar */}
            <header className="bg-white dark:bg-surface px-6 py-5 flex items-center justify-between shadow-sm sticky top-0 z-50 transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleMenu}
                        className="text-text-primary p-1 hover:bg-surface dark:hover:bg-surface-alt rounded-lg transition-colors"
                    >
                        <Menu size={24} strokeWidth={2} />
                    </button>
                    <h1 className="text-[19px] font-bold text-text-primary">
                        {title}
                    </h1>
                </div>
                <button className="text-text-primary p-1 relative hover:bg-surface dark:hover:bg-surface-alt rounded-lg transition-colors">
                    <Bell size={24} strokeWidth={2} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-surface"></span>
                </button>
            </header>

            {/* Content Area */}
            <main className="flex-1 max-w-[440px] w-full mx-auto">
                {children}
            </main>

            {/* Hamburger Menu Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity duration-300"
                    onClick={toggleMenu}
                />
            )}

            {/* Menu Drawer */}
            <aside
                className={`
                    fixed top-0 left-0 bottom-0 z-[101] w-[280px] bg-white dark:bg-surface shadow-2xl 
                    transform transition-transform duration-300 ease-out flex flex-col
                    ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Menu Header */}
                <div className="px-6 py-8 flex items-center justify-between border-b border-border dark:border-border-light">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-1.5 rounded-lg">
                            <Briefcase className="text-white" size={20} />
                        </div>
                        <span className="text-xl font-bold">CrewOps</span>
                    </div>
                    <button
                        onClick={toggleMenu}
                        className="p-1 hover:bg-surface dark:hover:bg-surface-alt rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.path !== '#') navigate(item.path);
                                toggleMenu();
                            }}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200
                                ${item.active
                                    ? 'bg-primary/5 text-primary font-bold'
                                    : 'hover:bg-surface dark:hover:bg-surface-alt text-text-secondary'}
                            `}
                        >
                            <item.icon size={22} strokeWidth={item.active ? 2.5 : 2} />
                            <span className="text-base">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="px-4 py-6 border-t border-border dark:border-border-light space-y-2">
                    <button
                        onClick={toggleDarkMode}
                        className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl hover:bg-surface dark:hover:bg-surface-alt transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
                            <span className="text-base font-medium">Modo {isDarkMode ? 'Claro' : 'Oscuro'}</span>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-primary' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${isDarkMode ? 'right-1' : 'left-1'}`} />
                        </div>
                    </button>

                    <button
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-surface dark:hover:bg-surface-alt transition-colors text-text-secondary"
                    >
                        <Settings size={22} />
                        <span className="text-base font-medium">Configuración</span>
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-500 font-bold"
                    >
                        <LogOut size={22} />
                        <span className="text-base">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </div>
    );
}
