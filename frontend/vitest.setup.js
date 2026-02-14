import '@testing-library/jest-dom';
import './src/test-utils/custom-matchers';
import { vi } from 'vitest';

// Mock DOMMatrix for react-pdf in Node.js environment
if (typeof global.DOMMatrix === 'undefined') {
    global.DOMMatrix = class DOMMatrix {
        constructor() {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.e = 0;
            this.f = 0;
        }
        translate(x, y) {
            this.e += x;
            this.f += y;
            return this;
        }
        scale(s) {
            this.a *= s;
            this.d *= s;
            return this;
        }
    };
}

// Mock window.matchMedia for responsive testing
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
// Mock Supabase - use absolute path for reliable module resolution
vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn(() => Promise.resolve({ data: { session: { access_token: 'test-token' } }, error: null })),
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: vi.fn() } },
            })),
            signInWithPassword: vi.fn(),
            signOut: vi.fn(),
        },
    },
}));

// Mock errorHandlers
vi.mock('../utils/errorHandlers', () => ({
    logAppError: vi.fn(),
}));
