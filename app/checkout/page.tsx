'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/lib/stores/cart-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { usePaymentStore } from '@/lib/stores/payment-store';
import { useUIStore } from '@/lib/stores/ui-store';
import PayPalButton from '@/app/components/PayPalButton';
import Header from '@/app/components/Header';
import Cart from '@/app/components/Cart';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { createOrder } = usePaymentStore();
  const { addNotification } = useUIStore();
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handlePaymentSuccess = async (paypalOrderId: string) => {
    setIsProcessing(true);
    try {
      const success = await createOrder(items[0].courseId); // For now, handle single course
      if (success) {
        clearCart();
        router.push('/payment/success');
      } else {
        addNotification({
          type: 'error',
          title: 'فشل في إنشاء الطلب',
          message: 'حدث خطأ أثناء إنشاء طلب الدفع',
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في المعالجة',
        message: 'حدث خطأ أثناء معالجة الدفع',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = () => {
    addNotification({
      type: 'error',
      title: 'فشل في الدفع',
      message: 'حدث خطأ أثناء عملية الدفع',
    });
  };

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
      <Header />
      <Cart />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">ملخص الطلب</h2>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 space-x-reverse border-b border-gray-200 pb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
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
                <span>المجموع الكلي:</span>
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

            {/* Payment Method */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">طريقة الدفع</h3>
              <div className="space-y-3">
                <div className="flex items-center p-4 border-2 border-green-200 bg-green-50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-lg">P</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">PayPal</p>
                    <p className="text-sm text-gray-600">دفع آمن وسريع</p>
                  </div>
                  <div className="mr-auto">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
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