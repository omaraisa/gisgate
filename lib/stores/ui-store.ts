import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ModalState {
  id: string;
  isOpen: boolean;
  component: React.ComponentType<any> | null;
  props?: Record<string, any>;
}

interface UIState {
  // Loading states
  globalLoading: boolean;
  loadingStates: Record<string, boolean>;

  // Notifications
  notifications: Notification[];

  // Modals
  modals: ModalState[];

  // Theme
  theme: 'light' | 'dark';

  // Layout
  sidebarOpen: boolean;

  // Actions
  setGlobalLoading: (loading: boolean) => void;
  setLoading: (key: string, loading: boolean) => void;
  clearLoading: (key: string) => void;

  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  openModal: (modal: Omit<ModalState, 'isOpen'>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  globalLoading: false,
  loadingStates: {},

  notifications: [],

  modals: [],

  theme: 'dark',

  sidebarOpen: false,

  // Loading actions
  setGlobalLoading: (loading: boolean) => {
    set({ globalLoading: loading });
  },

  setLoading: (key: string, loading: boolean) => {
    set((state) => ({
      loadingStates: {
        ...state.loadingStates,
        [key]: loading,
      },
    }));
  },

  clearLoading: (key: string) => {
    set((state) => {
      const newLoadingStates = { ...state.loadingStates };
      delete newLoadingStates[key];
      return { loadingStates: newLoadingStates };
    });
  },

  // Notification actions
  addNotification: (notification) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      id,
      duration: 5000,
      ...notification,
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  // Modal actions
  openModal: (modal) => {
    set((state) => ({
      modals: [
        ...state.modals,
        {
          ...modal,
          isOpen: true,
        },
      ],
    }));
  },

  closeModal: (id: string) => {
    set((state) => ({
      modals: state.modals.map((modal) =>
        modal.id === id ? { ...modal, isOpen: false } : modal
      ),
    }));

    // Remove closed modal after animation
    setTimeout(() => {
      set((state) => ({
        modals: state.modals.filter((modal) => modal.id !== id),
      }));
    }, 300);
  },

  closeAllModals: () => {
    set((state) => ({
      modals: state.modals.map((modal) => ({ ...modal, isOpen: false })),
    }));

    // Remove all modals after animation
    setTimeout(() => {
      set({ modals: [] });
    }, 300);
  },

  // Theme actions
  setTheme: (theme: 'light' | 'dark') => {
    set({ theme });
    // Apply to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },

  // Sidebar actions
  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },
}));