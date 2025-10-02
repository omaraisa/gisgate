import { create } from 'zustand';
import { useAuthStore } from './auth-store';
import { CartItem } from './cart-store';

// Helper function to get auth token from multiple sources
const getAuthToken = (): string | null => {
  // Try Zustand store first
  let token = useAuthStore.getState().token;
  
  // Fallback to localStorage if store hasn't hydrated yet
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }
  
  // Fallback to cookies as last resort
  if (!token && typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth-token-client') {
        token = decodeURIComponent(value);
        break;
      }
    }
  }
  
  return token;
};

export interface PaymentOrder {
  id: string;
  courseId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  paypalOrderId?: string;
  paypalPaymentId?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  course: {
    id: string;
    title: string;
    titleEnglish?: string;
    featuredImage?: string;
  };
  transactions: PaymentTransaction[];
  refunds: PaymentRefund[];
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  paypalTransactionId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paypalFee?: number;
  netAmount?: number;
  createdAt: string;
}

export interface PaymentRefund {
  id: string;
  orderId: string;
  paypalRefundId: string;
  amount: number;
  currency: string;
  reason?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  requestedAt: string;
  processedAt?: string;
}

interface PaymentState {
  // State
  orders: PaymentOrder[];
  currentOrder: PaymentOrder | null;
  paymentHistory: PaymentOrder[];

  // Loading states
  loadingOrders: boolean;
  creatingOrder: boolean;
  processingPayment: boolean;

  // Errors
  error: string | null;

  // Actions
  // Order management
  createOrder: (cartItems: CartItem[]) => Promise<string | null>;
  fetchOrders: () => Promise<void>;
  fetchOrder: (orderId: string) => Promise<PaymentOrder | null>;
  setCurrentOrder: (order: PaymentOrder | null) => void;

  // Payment processing
  processPayment: (paypalOrderId: string) => Promise<boolean>;
  cancelPayment: (orderId: string) => Promise<boolean>;

  // Refunds
  requestRefund: (orderId: string, amount: number, reason?: string) => Promise<boolean>;

  // History
  fetchPaymentHistory: () => Promise<void>;

  // Utility
  clearError: () => void;
  getOrderByPayPalId: (paypalOrderId: string) => PaymentOrder | null;
  getTotalSpent: () => number;
  getRefundedAmount: () => number;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  // Initial state
  orders: [],
  currentOrder: null,
  paymentHistory: [],

  loadingOrders: false,
  creatingOrder: false,
  processingPayment: false,

  error: null,

  // Order management actions
  createOrder: async (cartItems: CartItem[]) => {
    try {
      set({ creatingOrder: true, error: null });

      // Get auth token with multiple fallbacks
      let token = getAuthToken();
      
      // If still no token, try to get it directly from the auth store
      if (!token) {
        token = useAuthStore.getState().token;
      }
      
      // Final check for authentication
      if (!token) {
        console.error('Authentication token not found in any storage location');
        throw new Error('Authentication required. Please log in again.');
      }

      // Log token status for debugging (first 10 chars only)
      console.log('Creating order with token:', token.substring(0, 10) + '...');

      // Calculate total amount from cart items
      const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          cartItems: cartItems.map(item => ({
            courseId: item.courseId,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount 
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create payment order';
        let errorDetails = {};

        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
          errorDetails = error;
        } catch (parseError) {
          // If response is not JSON, try to get text
          try {
            const textResponse = await response.text();
            errorMessage = textResponse || errorMessage;
            errorDetails = { textResponse };
          } catch (textError) {
            errorDetails = {
              parseError: parseError instanceof Error ? parseError.message : String(parseError),
              textError: textError instanceof Error ? textError.message : String(textError)
            };
          }
        }

        console.error('Payment order creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorDetails,
          hasToken: !!token,
          tokenPreview: token ? token.substring(0, 20) + '...' : 'no token'
        });
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Fetch the created order details
      const orderResponse = await fetch(`/api/payments/order/${data.paypalOrderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        set((state) => ({
          orders: [...state.orders, orderData.order],
          currentOrder: orderData.order,
        }));
      }

      set({ creatingOrder: false });
      return data.paypalOrderId;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create payment order',
        creatingOrder: false
      });
      return null;
    }
  },

  fetchOrders: async () => {
    try {
      set({ loadingOrders: true, error: null });

      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch payment orders');

      const data = await response.json();
      set({
        orders: data.paymentProfile.recentPayments || [],
        loadingOrders: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch payment orders',
        loadingOrders: false
      });
    }
  },

  fetchOrder: async (orderId: string) => {
    try {
      set({ error: null });

      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/payments/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch order');

      const data = await response.json();
      set({ currentOrder: data.order });
      return data.order;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch order' });
      return null;
    }
  },

  setCurrentOrder: (order: PaymentOrder | null) => {
    set({ currentOrder: order });
  },

  // Payment processing actions
  processPayment: async (paypalOrderId: string) => {
    try {
      set({ processingPayment: true, error: null });

      const token = getAuthToken();
      if (!token) {
        throw new Error('Not authenticated - please log in again');
      }

      const response = await fetch('/api/payments/capture-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId: paypalOrderId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process payment');
      }

      // Refresh orders
      await get().fetchOrders();

      set({ processingPayment: false });
      return true;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to process payment',
        processingPayment: false
      });
      return false;
    }
  },

  cancelPayment: async (orderId: string) => {
    try {
      set({ error: null });

      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      // Note: This would need a cancel endpoint
      const response = await fetch(`/api/payments/cancel/${orderId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to cancel payment');

      // Refresh orders
      await get().fetchOrders();

      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to cancel payment' });
      return false;
    }
  },

  // Refund actions
  requestRefund: async (orderId: string, amount: number, reason?: string) => {
    try {
      set({ error: null });

      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, amount, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to request refund');
      }

      // Refresh orders
      await get().fetchOrders();

      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to request refund' });
      return false;
    }
  },

  // History actions
  fetchPaymentHistory: async () => {
    try {
      set({ error: null });

      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch payment history');

      const data = await response.json();
      set({ paymentHistory: data.paymentProfile.recentPayments || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch payment history' });
    }
  },

  // Utility actions
  clearError: () => {
    set({ error: null });
  },

  getOrderByPayPalId: (paypalOrderId: string) => {
    const orders = get().orders;
    return orders.find(order => order.paypalOrderId === paypalOrderId) || null;
  },

  getTotalSpent: () => {
    const orders = get().orders;
    return orders
      .filter(order => order.status === 'COMPLETED')
      .reduce((total, order) => {
        const completedTransactions = order.transactions.filter(t => t.status === 'COMPLETED');
        return total + completedTransactions.reduce((sum, t) => sum + t.amount, 0);
      }, 0);
  },

  getRefundedAmount: () => {
    const orders = get().orders;
    return orders.reduce((total, order) => {
      const completedRefunds = order.refunds.filter(r => r.status === 'COMPLETED');
      return total + completedRefunds.reduce((sum, r) => sum + r.amount, 0);
    }, 0);
  },
}));