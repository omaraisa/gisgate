'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/stores/cart-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUIStore } from '@/lib/stores/ui-store';

export default function Cart() {
  const router = useRouter();
  const { isOpen, closeCart, items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { addNotification } = useUIStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuantityChange = (courseId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(courseId, newQuantity);
  };

  const handleRemoveItem = (courseId: string, courseTitle: string) => {
    removeFromCart(courseId);
    addNotification({
      type: 'info',
      title: 'تم إزالة الدورة من العربة',
      message: `${courseTitle} تم إزالتها من عربة التسوق`,
    });
  };

  const handleClearCart = () => {
    clearCart();
    addNotification({
      type: 'info',
      title: 'تم مسح العربة',
      message: 'تم إزالة جميع العناصر من عربة التسوق',
    });
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      addNotification({
        type: 'warning',
        title: 'يجب تسجيل الدخول',
        message: 'يرجى تسجيل الدخول أولاً لإتمام عملية الشراء',
      });
      router.push('/auth');
      closeCart();
      return;
    }

    if (items.length === 0) {
      addNotification({
        type: 'warning',
        title: 'العربة فارغة',
        message: 'لا توجد دورات في عربة التسوق',
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Navigate to checkout page with cart items
      router.push('/checkout');
      closeCart();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في التحويل',
        message: 'حدث خطأ أثناء التحويل إلى صفحة الدفع',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={closeCart}
      />

      {/* Cart Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700 text-white">
            <h2 className="text-xl font-bold">عربة التسوق</h2>
            <button
              onClick={closeCart}
              className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200"
              aria-label="إغلاق العربة"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13v8a2 2 0 002 2h10a2 2 0 002-2v-3" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">عربة التسوق فارغة</h3>
                <p className="text-gray-500 mb-6">ابدأ بإضافة بعض المنتجات</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 space-x-reverse bg-gray-50 rounded-lg p-4">
                    {/* Course Image */}
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

                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/courses/${item.course.slug}`}
                        onClick={closeCart}
                        className="block"
                      >
                        <h4 className="text-sm font-medium text-gray-900 hover:text-green-600 transition-colors line-clamp-2">
                          {item.course.title}
                        </h4>
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.course.authorName || 'مدرب محترف'}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-green-600">
                          ${item.price}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <button
                        onClick={() => handleQuantityChange(item.courseId, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                        aria-label="تقليل الكمية"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>

                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => handleQuantityChange(item.courseId, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                        aria-label="زيادة الكمية"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.courseId, item.course.title)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                      aria-label="إزالة من العربة"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              {/* Clear Cart Button */}
              <button
                onClick={handleClearCart}
                className="w-full mb-4 text-red-600 hover:text-red-800 text-sm font-medium py-2 px-4 rounded-lg border border-red-200 hover:border-red-300 hover:bg-red-50 transition-colors"
              >
                مسح جميع العناصر
              </button>

              {/* Total and Checkout */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>المجموع الكلي:</span>
                  <span className="text-green-600">${totalPrice.toFixed(2)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium flex items-center justify-center space-x-2 space-x-reverse"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>جاري المعالجة...</span>
                    </>
                  ) : (
                    <>
                      <span>المتابعة للدفع</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  سيتم توجيهك إلى صفحة الدفع الآمنة
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}