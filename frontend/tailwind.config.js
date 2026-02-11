/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    hover: 'var(--color-primary-hover)',
                },
                background: 'var(--color-background)',
                surface: {
                    DEFAULT: 'var(--color-surface)',
                    alt: 'var(--color-surface-alt)',
                },
                border: {
                    DEFAULT: 'var(--color-border)',
                    light: 'var(--color-border-light)',
                },
                text: {
                    primary: 'var(--color-text-primary)',
                    secondary: 'var(--color-text-secondary)',
                    muted: 'var(--color-text-muted)',
                },
                success: 'var(--color-success)',
                warning: 'var(--color-warning)',
                info: 'var(--color-info)',
            },
            fontFamily: {
                sans: ['Public Sans', 'sans-serif'],
            },
            spacing: {
                'xs': 'var(--spacing-xs)',
                'sm': 'var(--spacing-sm)',
                'md': 'var(--spacing-md)',
            },
            borderRadius: {
                'sm': 'var(--radius-sm)',
                'md': 'var(--radius-md)',
                'lg': 'var(--radius-lg)',
                'full': 'var(--radius-full)',
            },
            boxShadow: {
                'card': 'var(--shadow-card)',
                'card-hover': 'var(--shadow-card-hover)',
                'modal': 'var(--shadow-modal)',
            },
        },
    },
    plugins: [],
}
