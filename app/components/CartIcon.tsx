'use client';

import { useCartStore } from '@/lib/stores/cart-store';

interface CartIconProps {
  className?: string;
  onClick?: () => void;
}

export default function CartIcon({ className = '', onClick }: CartIconProps) {
  const { totalItems, toggleCart } = useCartStore();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      toggleCart();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`relative p-2 rounded-md text-white hover:text-lime-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-lime-300 ${className}`}
      aria-label={`عربة التسوق ${totalItems > 0 ? `(${totalItems} عنصر)` : ''}`}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13v8a2 2 0 002 2h10a2 2 0 002-2v-3"
        />
      </svg>

      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </button>
  );
}