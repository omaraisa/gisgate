'use client';

import { useCartStore } from '@/lib/stores/cart-store';
import { useRouter } from 'next/navigation';

export default function CartSummary() {
  const { totalItems, totalPrice, openCart } = useCartStore();
  const router = useRouter();

  if (totalItems === 0) {
    return null;
  }

  const handleViewCart = () => {
    openCart();
  };

  const handleCheckout = () => {
    router.push('/checkout');
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 bg-white rounded-lg shadow-lg border p-4 min-w-[280px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">عربة التسوق</h3>
        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {totalItems} عنصر
        </span>
      </div>

      <div className="text-sm text-gray-600 mb-3">
        المجموع: <span className="font-bold text-green-600">${totalPrice.toFixed(2)}</span>
      </div>

      <div className="flex space-x-2 space-x-reverse">
        <button
          onClick={handleViewCart}
          className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          عرض العربة
        </button>
        <button
          onClick={handleCheckout}
          className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
        >
          الدفع
        </button>
      </div>
    </div>
  );
}