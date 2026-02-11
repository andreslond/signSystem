import { expect } from 'vitest';

/**
 * Custom matcher to verify that a className only contains approved semantic tokens.
 * This is used to prevent "design drift" by failing if hardcoded Tailwind colors are used.
 */
expect.extend({
    toHaveValidDesignTokens(received) {
        const classList = received.className.split(' ');
        const violations = classList.filter(className => {
            // Strip modifiers
            const baseClass = className.split(':').pop();

            // Only check classes that look like color utilities
            const colorPrefixes = ['text-', 'bg-', 'border-', 'shadow-', 'ring-', 'fill-', 'stroke-'];
            const prefix = colorPrefixes.find(p => baseClass.startsWith(p));
            if (!prefix) return false;

            // Extract the color part (handle opacity and modifiers)
            const colorValue = baseClass.slice(prefix.length).split('/')[0];

            // List of purely structural/sizing/layout values that we should ignore
            const sizingValues = [
                'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl', // text
                '0', '1', '2', '4', '8', // ring, border
                'none', 'card', 'modal', 'primary' // shadow (primary is allowed for shadow)
            ];
            if (sizingValues.includes(colorValue)) return false;

            // List of allowed semantic color tokens
            const allowedTokens = [
                'primary', 'primary-hover', 'background', 'surface', 'surface-alt',
                'border', 'border-light', 'text-primary', 'text-secondary', 'text-muted',
                'success', 'warning', 'info',
                'white', 'black', 'transparent', 'inherit', 'current'
            ];

            // Special case for tokens like text-primary where primary is the token
            const token = colorValue.startsWith('text-') ? colorValue.slice(5) : colorValue;

            if (allowedTokens.includes(token)) return false;

            // It's a violation if it looks like a default Tailwind color (e.g., blue-500, gray-100)
            // or if it's a hex value (e.g., [#...])
            const isDefaultTailwindColor = /^(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchia|pink|rose)-\d+$/.test(colorValue);
            const isHex = /^\[#?[0-9a-fA-F]{3,8}\]$/.test(colorValue);

            return isDefaultTailwindColor || isHex;
        });

        const pass = violations.length === 0;

        return {
            pass,
            message: () =>
                pass
                    ? `Expected element to NOT have invalid design tokens, but found: ${violations.join(', ')}`
                    : `Expected element to only use semantic design tokens, but found invalid classes: ${violations.join(', ')}`,
        };
    }
});
