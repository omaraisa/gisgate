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
  courseTitle?: string; // Made optional for cart checkout
  isCartCheckout?: boolean; // New prop to indicate cart checkout
}

export default function PayPalButton({
  courseId,
  amount,
  currency = 'USD',
  courseTitle,
  isCartCheckout = false,
}: PayPalButtonProps) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();
  const { createOrder, processPayment } = usePaymentStore();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const totalPrice = isCartCheckout ? getTotalPrice() : amount || 0;

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

            if (isCartCheckout) {
              // Handle cart checkout - create order for all cart items
              if (items.length === 0) {
                throw new Error('Cart is empty');
              }
              const cartOrderId = await createOrder(items);
              if (!cartOrderId) {
                throw new Error('Failed to create cart payment order');
              }
              return cartOrderId;
            } else {
              // Handle single course purchase
              if (!courseId) {
                throw new Error('Course ID is required');
              }
              // For single course, create a cart item array
              const singleCourseItem = [{
                courseId: courseId,
                quantity: 1,
                price: amount || 0,
                currency: currency
              }] as any;
              const paypalOrderId = await createOrder(singleCourseItem);
              if (!paypalOrderId) {
                throw new Error('Failed to create payment order');
              }
              return paypalOrderId;
            }
          }}
          onApprove={async (data: any) => {
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