'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { usePaymentStore } from '@/lib/stores/payment-store';
import { useCartStore } from '@/lib/stores/cart-store';

interface PayPalButtonProps {
  courseId?: string; // Made optional for cart checkout
  amount?: number; // Made optional for cart checkout
  currency?: string;
  isCartCheckout?: boolean; // New prop to indicate cart checkout
}

interface PayPalOnApproveData {
  orderID: string;
}

export default function PayPalButton({
  courseId,
  amount,
  currency = 'USD',
  isCartCheckout = false,
}: PayPalButtonProps) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const { createOrder, processPayment } = usePaymentStore();
  const { items, clearCart } = useCartStore();

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    currency: currency,
    components: 'buttons',
    locale: 'ar_SA',
  };

  if (!isAuthenticated || !token) {
    return (
      <div className="paypal-button-container bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">يجب تسجيل الدخول أولاً لإتمام عملية الدفع</p>
      </div>
    );
  }

  return (
    <div className="paypal-button-container bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'white',
            shape: 'rect',
            label: 'paypal',
            height: 40,
          }}
          createOrder={async () => {
            // Double-check authentication before creating order
            const currentToken = useAuthStore.getState().token;
            if (!currentToken) {
              throw new Error('Authentication required. Please log in again.');
            }

            console.log('PayPal Button - Creating order with token:', currentToken.substring(0, 20) + '...');

            if (isCartCheckout) {
              // Handle cart checkout - create order for all cart items
              if (items.length === 0) {
                throw new Error('Cart is empty');
              }
              console.log('PayPal Button - Cart items:', items);
              const cartOrderId = await createOrder(items);
              if (!cartOrderId) {
                throw new Error('Failed to create cart payment order');
              }
              return cartOrderId;
            } else {
              // Handle single course purchase - call API directly
              if (!courseId || !amount) {
                throw new Error('Course ID and amount are required');
              }
              console.log('PayPal Button - Creating single course order');
              
              const response = await fetch('/api/payments/create-order', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${currentToken}`,
                },
                body: JSON.stringify({ courseId }),
              });

              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create payment order');
              }

              const data = await response.json();
              return data.paypalOrderId;
            }
          }}
          onApprove={async (data: PayPalOnApproveData) => {
            const success = await processPayment(data.orderID);
            if (success) {
              if (isCartCheckout) {
                clearCart();
              }
              router.push(`/payment/success?orderId=${data.orderID}`);
            } else {
              router.push('/payment/error');
            }
          }}
          onCancel={() => {
            router.push('/payment/cancel');
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}