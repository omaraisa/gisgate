'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { usePaymentStore } from '@/lib/stores/payment-store';

interface PayPalButtonProps {
  courseId: string;
  amount: number;
  currency?: string;
  courseTitle: string;
}

export default function PayPalButton({
  courseId,
  amount,
  currency = 'USD',
  courseTitle,
}: PayPalButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { createOrder, processPayment, setCurrentOrder } = usePaymentStore();

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    currency: currency,
    components: 'buttons',
    locale: 'ar_SA',
  };

  if (!isAuthenticated) {
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
            const paypalOrderId = await createOrder(courseId);
            if (!paypalOrderId) {
              throw new Error('Failed to create payment order');
            }
            return paypalOrderId;
          }}
          onApprove={async (data: any) => {
            const success = await processPayment(data.orderID);
            if (success) {
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