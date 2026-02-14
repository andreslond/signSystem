// Manual mock for supabase - used by Vitest when importing supabase
export const supabase = {
    auth: {
        getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
        onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } },
        })),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
    },
};
