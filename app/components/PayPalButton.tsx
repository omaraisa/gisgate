'use client';

import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useRouter } from 'next/navigation';

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

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
    currency: currency,
    components: 'buttons',
    locale: 'ar_SA',
  };

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
            const token = localStorage.getItem('sessionToken');
            if (!token) throw new Error('Not authenticated');

            const response = await fetch('/api/payments/create-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ courseId }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            return data.paypalOrderId;
          }}
          onApprove={async (data: any) => {
            const token = localStorage.getItem('sessionToken');
            const orderResponse = await fetch(`/api/payments/order/${data.orderID}`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });

            if (orderResponse.ok) {
              const orderData = await orderResponse.json();
              router.push(`/payment/success?orderId=${orderData.order.id}&token=${token}`);
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