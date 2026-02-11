/**
 * Centralized error mapping and handling utility.
 * Follows patterns from the error-handling-patterns skill.
 */

export const AuthErrorMessages = {
    'Invalid login credentials': 'El correo electrónico o la contraseña son incorrectos.',
    'Email not confirmed': 'Por favor, confirma tu correo electrónico antes de iniciar sesión.',
    'User not found': 'No se encontró ningún usuario con este correo electrónico.',
    'Network request failed': 'Error de conexión. Por favor, verifica tu internet e inténtalo de nuevo.',
    'Rate limit exceeded': 'Has realizado demasiados intentos. Por favor, inténtalo más tarde.',
    'Generic error': 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
};

/**
 * Maps a Supabase error message or standard error to a user-friendly Spanish message.
 * @param {Error|Object} error - The error object to map.
 * @returns {string} A user-friendly error message.
 */
export const mapAuthError = (error) => {
    if (!error) return null;

    const message = error.message || error.toString();

    if (message.includes('Invalid login credentials')) {
        return AuthErrorMessages['Invalid login credentials'];
    }
    if (message.includes('Email not confirmed')) {
        return AuthErrorMessages['Email not confirmed'];
    }
    if (message.includes('User not found')) {
        return AuthErrorMessages['User not found'];
    }
    if (message.toLowerCase().includes('network') || message.includes('fetch')) {
        return AuthErrorMessages['Network request failed'];
    }
    if (message.includes('rate limit')) {
        return AuthErrorMessages['Rate limit exceeded'];
    }

    return AuthErrorMessages['Generic error'];
};

/**
 * Detailed error logger for development and potentially production monitoring.
 * @param {string} context - Where the error occurred (e.g., 'AuthContext:initializeAuth').
 * @param {Error} error - The caught error.
 */
export const logAppError = (context, error) => {
    // In production, this could send data to Sentry or another monitoring tool.
    console.error(`[Aplication Error][${context}]:`, {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
    });
};
