import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { logAppError } from '../utils/errorHandlers';
import { createErrorFromUnknown } from '../utils/errors';

const AuthContext = createContext({
    session: null,
    user: null,
    loading: true,
    error: null,
    signOut: () => Promise.resolve(),
    clearError: () => {},
});

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const clearError = () => setError(null);

    /**
     * Initialize auth - simplified without retry for stability.
     */
    const initializeAuth = async () => {
        try {
            setError(null);

            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
        } catch (error) {
            // Log error but don't throw - user just isn't logged in
            const structuredError = createErrorFromUnknown(error);
            logAppError('AuthContext:initializeAuth', structuredError);
            setSession(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initializeAuth();

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => {
            try {
                subscription.unsubscribe();
            } catch (err) {
                logAppError('AuthContext:cleanup', err);
            }
        };
    }, []);

    const signOut = async () => {
        try {
            clearError();
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
        } catch (error) {
            const structuredError = createErrorFromUnknown(error);
            logAppError('AuthContext:signOut', structuredError);
            setError(structuredError);
        }
    };

    const value = {
        session,
        user,
        loading,
        error,
        signOut,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
