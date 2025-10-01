import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Course } from './course-store';

export interface CartItem {
  id: string;
  courseId: string;
  course: Course;
  quantity: number;
  addedAt: string;
  price: number;
  currency: string;
}

interface CartState {
  // State
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;

  // Computed properties
  totalItems: number;
  totalPrice: number;
  subtotal: number;

  // Actions
  addToCart: (course: Course) => void;
  removeFromCart: (courseId: string) => void;
  updateQuantity: (courseId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Utility
  isInCart: (courseId: string) => boolean;
  getItemQuantity: (courseId: string) => number;
  getCartSummary: () => {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    subtotal: number;
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      items: [],
      isOpen: false,
      isLoading: false,

      // Computed properties
      get totalItems() {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      get totalPrice() {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      get subtotal() {
        return get().totalPrice;
      },

      // Actions
      addToCart: (course: Course) => {
        const existingItem = get().items.find(item => item.courseId === course.id);

        if (existingItem) {
          // Update quantity if already in cart
          set((state) => ({
            items: state.items.map(item =>
              item.courseId === course.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          }));
        } else {
          // Add new item to cart
          const cartItem: CartItem = {
            id: `${course.id}-${Date.now()}`,
            courseId: course.id,
            course,
            quantity: 1,
            addedAt: new Date().toISOString(),
            price: course.price || 0,
            currency: course.currency || 'USD',
          };

          set((state) => ({
            items: [...state.items, cartItem],
          }));
        }

        // Auto-open cart on mobile, keep closed on desktop for better UX
        if (window.innerWidth < 768) {
          get().openCart();
        }
      },

      removeFromCart: (courseId: string) => {
        set((state) => ({
          items: state.items.filter(item => item.courseId !== courseId),
        }));
      },

      updateQuantity: (courseId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeFromCart(courseId);
          return;
        }

        set((state) => ({
          items: state.items.map(item =>
            item.courseId === courseId
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      // Utility functions
      isInCart: (courseId: string) => {
        return get().items.some(item => item.courseId === courseId);
      },

      getItemQuantity: (courseId: string) => {
        const item = get().items.find(item => item.courseId === courseId);
        return item?.quantity || 0;
      },

      getCartSummary: () => {
        const state = get();
        return {
          items: state.items,
          totalItems: state.totalItems,
          totalPrice: state.totalPrice,
          subtotal: state.subtotal,
        };
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);