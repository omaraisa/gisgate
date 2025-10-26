'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Course } from '@/lib/stores/course-store';
import { useCartStore } from '@/lib/stores/cart-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { useUIStore } from '@/lib/stores/ui-store';

interface AddToCartButtonProps {
  course: Course;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showPrice?: boolean;
  disabled?: boolean;
}

export default function AddToCartButton({
  course,
  variant = 'primary',
  size = 'md',
  className = '',
  showPrice = true,
  disabled = false,
}: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();
  const { addToCart, isInCart } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { addNotification } = useUIStore();

  const isCourseInCart = isInCart(course.id);
  const isFree = course.isFree || (course.price || 0) === 0;

  const handleFreeCourseClick = () => {
    router.push(`/courses/${course.slug || course.id}`);
  };

  const handleAddToCart = async () => {
    // Prevent adding if already in cart
    if (isCourseInCart) {
      addNotification({
        type: 'info',
        title: 'الدورة موجودة بالفعل',
        message: 'هذه الدورة موجودة بالفعل في عربة التسوق',
      });
      return;
    }

    if (!isAuthenticated) {
      addNotification({
        type: 'warning',
        title: 'يجب تسجيل الدخول',
        message: 'يرجى تسجيل الدخول أولاً لإضافة الدورات إلى العربة',
      });
      return;
    }

    if (isFree) {
      // Free courses navigate directly to course page
      return;
    }

    setIsAdding(true);
    try {
      addToCart(course);
      addNotification({
        type: 'success',
        title: 'تمت الإضافة للعربة',
        message: `${course.title} تم إضافتها إلى عربة التسوق`,
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في الإضافة',
        message: 'حدث خطأ أثناء إضافة الدورة للعربة',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-md hover:shadow-lg',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (isFree) {
    return (
      <button
        onClick={handleFreeCourseClick}
        className={`${buttonClasses} bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`}
        disabled={disabled}
      >
        <span className="ml-2">🎓</span>
        دورة مجانية
      </button>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={disabled || isAdding || isCourseInCart}
      className={buttonClasses}
    >
      {isAdding ? (
        <>
          <svg className="animate-spin w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>جاري الإضافة...</span>
        </>
      ) : isCourseInCart ? (
        <>
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>في العربة</span>
          {showPrice && (
            <span className="mr-2 text-sm opacity-75">
              (${course.price})
            </span>
          )}
        </>
      ) : (
        <>
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>إضافة للعربة</span>
          {showPrice && (
            <span className="mr-2 text-sm opacity-75">
              (${course.price})
            </span>
          )}
        </>
      )}
    </button>
  );
}