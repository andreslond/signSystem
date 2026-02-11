import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Users, ArrowRight, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import { supabase } from '../lib/supabase';
import { mapAuthError, logAppError } from '../utils/errorHandlers';
import { useAuth } from '../context/AuthContext';
import { createErrorFromUnknown } from '../utils/errors';

/**
 * Email validation regex following best practices.
 */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Password minimum requirements.
 */
const PASSWORD_MIN_LENGTH = 6;

/**
 * Validates login input before submission.
 * @param {string} email
 * @param {string} password
 * @returns {{ valid: boolean, errors: object }}
 */
const validateLoginInput = (email, password) => {
    const errors = {};

    // Email validation
    if (!email) {
        errors.email = 'El correo electrónico es obligatorio.';
    } else if (!EMAIL_REGEX.test(email)) {
        errors.email = 'Por favor, ingresa un correo electrónico válido.';
    }

    // Password validation
    if (!password) {
        errors.password = 'La contraseña es obligatoria.';
    } else if (password.length < PASSWORD_MIN_LENGTH) {
        errors.password = `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Checks if an error is retryable (network-related).
 */
const isRetryableError = (error) => {
    if (!error) return false;
    const message = error.message?.toLowerCase() || '';
    return message.includes('network') ||
           message.includes('fetch') ||
           message.includes('timeout') ||
           error.statusCode === 0;
};

export default function Login() {
    const navigate = useNavigate();
    const { session, loading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    // Redirect if already logged in
    useEffect(() => {
        if (session && !authLoading) {
            navigate('/documents/pending');
        }
    }, [session, authLoading, navigate]);

    /**
     * Handle login with validation and retry logic.
     */
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFieldErrors({});

        // Step 1: Validate input (fail fast)
        const validation = validateLoginInput(email, password);

        if (!validation.valid) {
            setFieldErrors(validation.errors);
            setLoading(false);
            return;
        }

        try {
            // Step 2: Attempt login
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                throw authError;
            }

            // Login successful - redirect will be handled by useEffect or onAuthStateChange
        } catch (err) {
            // Handle structured error
            const structuredError = createErrorFromUnknown(err);
            logAppError('Login:handleLogin', structuredError);

            // Set user-friendly error message
            const friendlyMessage = mapAuthError(err);
            setError(friendlyMessage);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Users className="animate-pulse text-primary" size={48} />
            </div>
        );
    }

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
                <div className="w-full bg-surface dark:bg-surface-alt rounded-[24px] shadow-2xl p-8 mb-8 transition-colors">
                    <h2 className="text-[26px] font-bold text-text-primary mb-1">
                        Bienvenido
                    </h2>
                    <p className="text-text-secondary text-sm mb-8 leading-relaxed">
                        Inicia sesión para gestionar tu información.
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3 text-primary text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <Input
                            label="Correo electrónico"
                            type="email"
                            placeholder="nombre@crewops.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (fieldErrors.email) {
                                    setFieldErrors(prev => ({ ...prev, email: null }));
                                }
                            }}
                            error={fieldErrors.email}
                            icon={Mail}
                            required
                        />

                        <div className="space-y-1">
                            <Input
                                label="Contraseña"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (fieldErrors.password) {
                                        setFieldErrors(prev => ({ ...prev, password: null }));
                                    }
                                }}
                                error={fieldErrors.password}
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
                                loading={loading}
                            >
                                Ingresar
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Security Footer */}
                <div className="flex flex-col items-center gap-4 mt-auto pb-10">
                    <div className="w-8 h-[1px] bg-border/20 dark:bg-border-light/20" />
                    <div className="flex items-center gap-2 text-text-muted/60 text-xs transition-colors">
                        <ShieldCheck size={16} className="text-text-muted/40" />
                        <span>Acceso seguro a sus documentos</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
