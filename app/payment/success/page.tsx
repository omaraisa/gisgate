'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const orderId = searchParams.get('orderId');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!orderId || !token) {
      setStatus('error');
      setMessage('معلومات الدفع غير مكتملة');
      return;
    }

    // Capture the payment
    const capturePayment = async () => {
      try {
        const response = await fetch('/api/payments/capture-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ orderId }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('تم إكمال الدفع بنجاح! تم تسجيلك في الدورة.');
        } else {
          setStatus('error');
          setMessage(data.error || 'حدث خطأ أثناء إكمال الدفع');
        }
      } catch (error) {
        console.error('Payment capture error:', error);
        setStatus('error');
        setMessage('حدث خطأ في الشبكة. يرجى المحاولة مرة أخرى.');
      }
    };

    capturePayment();
  }, [orderId, token]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
            نتيجة الدفع
          </h1>

          <p className="text-gray-600 mb-4">{message}</p>

          {status === 'loading' && (
            <p className="text-sm text-gray-500">جاري معالجة الدفع...</p>
          )}

          {status === 'success' && (
            <div className="space-y-3">
              <p className="text-sm text-green-600">
                تم تسجيلك في الدورة بنجاح. يمكنك الآن الوصول إلى جميع الدروس والمحتوى.
              </p>
              <div className="flex gap-2">
                <Link
                  href="/profile"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  عرض ملفي الشخصي
                </Link>
                <Link
                  href="/courses"
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
                >
                  استكشاف الدورات
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <p className="text-sm text-red-600">
                إذا كان لديك أي أسئلة أو تحتاج إلى مساعدة، يرجى التواصل معنا.
              </p>
              <div className="flex gap-2">
                <Link
                  href="/courses"
                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
                >
                  العودة للدورات
                </Link>
                <Link
                  href="/contact"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  تواصل معنا
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}