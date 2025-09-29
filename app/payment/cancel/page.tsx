'use client';

import { useSearchParams } from 'next/navigation';
import { XCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
            <XCircle className="h-6 w-6 text-orange-500" />
            تم إلغاء الدفع
          </h1>

          <p className="text-gray-600 mb-4">
            تم إلغاء عملية الدفع. لم يتم خصم أي مبلغ من حسابك.
          </p>

          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              إذا كنت تريد إعادة المحاولة أو اختيار طريقة دفع مختلفة، يمكنك العودة لصفحة الدورة.
            </p>

            <div className="flex gap-2">
              <Link
                href="/courses"
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition-colors"
              >
                استكشاف الدورات
              </Link>
              {orderId && (
                <Link
                  href={`/courses?retry=${orderId}`}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  إعادة المحاولة
                </Link>
              )}
            </div>
          </div>

          <div className="pt-4 border-t mt-4">
            <p className="text-xs text-gray-400">
              إذا كان لديك أي أسئلة حول عملية الدفع، يرجى التواصل مع فريق الدعم.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}