'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/lib/stores/cart-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUIStore } from '@/lib/stores/ui-store';
import PayPalButton from '@/app/components/PayPalButton';
import Cart from '@/app/components/Cart';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice } = useCartStore();
  const totalPrice = getTotalPrice();
  const { isAuthenticated, user } = useAuthStore();
  const { addNotification } = useUIStore();

  useEffect(() => {
    if (!isAuthenticated) {
      addNotification({
        type: 'warning',
        title: 'يجب تسجيل الدخول',
        message: 'يرجى تسجيل الدخول أولاً لإتمام عملية الشراء',
      });
      router.push('/auth');
      return;
    }

    if (items.length === 0) {
      addNotification({
        type: 'warning',
        title: 'العربة فارغة',
        message: 'لا توجد دورات في عربة التسوق',
      });
      router.push('/courses');
      return;
    }
  }, [isAuthenticated, items.length, router, addNotification]);

  if (!isAuthenticated || items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Cart />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">ملخص الطلب</h2>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center border-b border-gray-200 pb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 ml-4">
                    {item.course.featuredImage ? (
                      <Image
                        src={item.course.featuredImage}
                        alt={item.course.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">🎓</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {item.course.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.course.authorName || 'مدرب محترف'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">
                        الكمية: {item.quantity}
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span className="text-green-600">المجموع الكلي:</span>
                <span className="text-green-600">${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">معلومات الدفع</h2>

            {/* User Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">معلومات المستخدم</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">الاسم:</span> {user?.fullNameArabic || user?.fullNameEnglish || user?.email}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">البريد الإلكتروني:</span> {user?.email}
                </p>
              </div>
            </div>

            {/* PayPal Button */}
            <div className="space-y-4">
              <PayPalButton
                isCartCheckout={true}
                currency="USD"
              />

              <p className="text-xs text-gray-500 text-center">
                بضغطك على زر الدفع، أنت توافق على شروط الخدمة وسياسة الخصوصية
              </p>
            </div>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 ml-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-7-4zM9 12l2-2 4 4-1.5 1.5L9 12z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-900">دفع آمن</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    جميع المعاملات محمية بتشفير SSL وتتم معالجتها بواسطة PayPal
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}