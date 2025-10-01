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
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
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
  document.cookie = 'auth-token-client=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Get initial token from storage
      const initialToken = typeof window !== 'undefined' ? (getTokenFromCookies() || localStorage.getItem('sessionToken')) : null;

      return {
        // Initial state - will be validated by checkAuth API call
        user: null,
        sessionToken: initialToken,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        login: (token: string, user: User) => {
          set({
            user,
            sessionToken: token,
            isAuthenticated: true,
            error: null,
          });
          // Set in both cookies and localStorage for compatibility
          setTokenInCookies(token);
          localStorage.setItem('sessionToken', token);
        },

        logout: () => {
          set({
            user: null,
            sessionToken: null,
            isAuthenticated: false,
            error: null,
          });
          removeTokenFromCookies();
          localStorage.removeItem('sessionToken');
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
          const token = get().sessionToken;
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
              sessionToken: null,
              isAuthenticated: false,
              error: 'Session expired',
            });
            removeTokenFromCookies();
            localStorage.removeItem('sessionToken');
            return false;

          } catch (error) {
            set({
              user: null,
              sessionToken: null,
              isAuthenticated: false,
              error: 'Authentication check failed',
            });
            return false;
          } finally {
            set({ isLoading: false });
          }
        },

        refreshUser: async () => {
          const token = get().sessionToken;
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
        sessionToken: state.sessionToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);