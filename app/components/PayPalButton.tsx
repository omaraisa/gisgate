'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PayPalButtonProps {
  courseId: string;
  amount: number;
  currency?: string;
  courseTitle: string;
  onSuccess?: (orderId: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function PayPalButton({
  courseId,
  amount,
  currency = 'USD',
  courseTitle,
  onSuccess,
  onError,
  disabled = false,
}: PayPalButtonProps) {
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load PayPal SDK if not already loaded
    if (!window.paypal) {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
  const script = document.createElement('script');
  script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&components=buttons&locale=ar_SA`;
      script.async = true;
      script.onload = initializePayPalButton;
      document.body.appendChild(script);
    } else {
      initializePayPalButton();
    }

    function initializePayPalButton() {
      if (!window.paypal || !paypalButtonRef.current) return;

      // Clear any existing buttons
      paypalButtonRef.current.innerHTML = '';

      window.paypal.Buttons({
        createOrder: async () => {
          try {
            setIsLoading(true);

            // Get auth token from localStorage or wherever it's stored
            const token = localStorage.getItem('sessionToken');
            if (!token) {
              throw new Error('يجب تسجيل الدخول أولاً');
            }

            const response = await fetch('/api/payments/create-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ courseId }),
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || 'فشل في إنشاء طلب الدفع');
            }

            return data.paypalOrderId;
          } catch (error) {
            console.error('Create order error:', error);
            const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
            onError?.(message);
            throw error;
          } finally {
            setIsLoading(false);
          }
        },

        onApprove: async (data: any) => {
          try {
            setIsLoading(true);

            // Get auth token
            const token = localStorage.getItem('sessionToken');
            if (!token) {
              throw new Error('يجب تسجيل الدخول أولاً');
            }

            // Find the order ID from our database using PayPal order ID
            const orderResponse = await fetch(`/api/payments/order/${data.orderID}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (!orderResponse.ok) {
              throw new Error('فشل في العثور على طلب الدفع');
            }

            const orderData = await orderResponse.json();

            // Redirect to success page with order ID and token
            router.push(`/payment/success?orderId=${orderData.order.id}&token=${token}`);
            onSuccess?.(orderData.order.id);

          } catch (error) {
            console.error('Approval error:', error);
            const message = error instanceof Error ? error.message : 'حدث خطأ أثناء الموافقة على الدفع';
            onError?.(message);
          } finally {
            setIsLoading(false);
          }
        },

        onCancel: () => {
          // Redirect to cancel page
          router.push('/payment/cancel');
        },

        onError: (error: any) => {
          console.error('PayPal error:', error);
          onError?.('حدث خطأ في PayPal');
        },

        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'paypal',
          height: 40,
        },

      }).render(paypalButtonRef.current);
    }

    return () => {
      // Cleanup
      if (paypalButtonRef.current) {
        paypalButtonRef.current.innerHTML = '';
      }
    };
  }, [courseId, amount, currency, courseTitle, router, onSuccess, onError]);

  if (disabled) {
    return (
      <div className="paypal-button-container">
        <button
          disabled
          className="w-full bg-gray-300 text-gray-500 px-4 py-2 rounded cursor-not-allowed"
        >
          الدفع غير متاح
        </button>
      </div>
    );
  }

  return (
    <div className="paypal-button-container">
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 mt-2">جاري تحضير الدفع...</p>
        </div>
      )}
      <div
        ref={paypalButtonRef}
        className={isLoading ? 'opacity-50 pointer-events-none' : ''}
      />
    </div>
  );
}