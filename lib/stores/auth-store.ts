import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullNameArabic?: string;
  fullNameEnglish?: string;
  avatar?: string;
  bio?: string;
  role: 'ADMIN' | 'EDITOR' | 'AUTHOR' | 'USER';
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  // State
  user: User | null;
  token: string | null; // Renamed from sessionToken
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  checkAuth: () => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

// Helper function to get token from cookies
const getTokenFromCookies = () => {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'auth-token-client') { // Use client-readable cookie
      return decodeURIComponent(value);
    }
  }
  return null;
};

// Helper function to set token in cookies
const setTokenInCookies = (token: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `auth-token-client=${encodeURIComponent(token)}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
};

// Helper function to remove token from cookies
const removeTokenFromCookies = () => {
  if (typeof document === 'undefined') return;
  // Clear client-side readable cookie
  document.cookie = 'auth-token-client=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  // Clear server-side cookie
  document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Get initial token from storage
      const initialToken = typeof window !== 'undefined' ? (getTokenFromCookies() || localStorage.getItem('token')) : null;

      return {
        // Initial state - will be validated by checkAuth API call
        user: null,
        token: initialToken,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        login: (token: string, user: User) => {
          set({
            user,
            token: token,
            isAuthenticated: true,
            error: null,
          });
          // Set in both cookies and localStorage for compatibility
          setTokenInCookies(token);
          localStorage.setItem('token', token);
        },

        logout: async () => {
          try {
            const token = get().token;
            if (token) {
              // Call server-side logout to clear HTTP-only cookies
              await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
            }
          } catch (error) {
            console.error('Server logout failed:', error);
            // Continue with client-side cleanup even if server logout fails
          }

          // Clear client-side state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });

          // Clear client-readable cookie (server clears HTTP-only cookie)
          removeTokenFromCookies();

          // Clear all authentication-related localStorage items
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          localStorage.removeItem('auth-storage');
        },

        updateUser: (userData: Partial<User>) => {
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: { ...currentUser, ...userData },
            });
          }
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        setError: (error: string | null) => {
          set({ error });
        },

        checkAuth: async () => {
          const token = get().token;
          if (!token) {
            set({ isAuthenticated: false, user: null });
            return false;
          }

          try {
            set({ isLoading: true, error: null });

            const response = await fetch('/api/auth/check', {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
              const data = await response.json();
              if (data.authenticated) {
                set({
                  user: data.user,
                  isAuthenticated: true,
                  error: null,
                });
                return true;
              }
            }

            // Auth failed - clear everything
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              error: 'Session expired',
            });
            
            // Try to call server logout to clear HTTP-only cookies
            try {
              if (token) {
                await fetch('/api/auth/logout', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
              }
            } catch (error) {
              console.error('Server logout failed during auth check:', error);
            }
            
            removeTokenFromCookies();
            // Clear all authentication-related localStorage items
            localStorage.removeItem('token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            localStorage.removeItem('auth-storage');
            return false;

          } catch (error) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              error: 'Authentication check failed',
            });
            return false;
          } finally {
            set({ isLoading: false });
          }
        },

        refreshUser: async () => {
          const token = get().token;
          if (!token) return;

          try {
            set({ isLoading: true });

            const response = await fetch('/api/user/profile', {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
              const data = await response.json();
              set({
                user: data.user,
                error: null,
              });
            }
          } catch (error) {
            set({ error: 'Failed to refresh user data' });
          } finally {
            set({ isLoading: false });
          }
        },
      };
    },
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);