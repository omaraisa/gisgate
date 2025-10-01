'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import PayPalButton from '@/app/components/PayPalButton';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  slug: string;
  isFree: boolean;
  imageUrl?: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Check authentication status using API
    async function checkAuth() {
      const sessionToken = localStorage.getItem('sessionToken');
      if (!sessionToken) {
        setAuthChecked(true);
        return;
      }

      try {
        const response = await fetch('/api/auth/check', {
          headers: { Authorization: `Bearer ${sessionToken}` }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setUser(data.user);
            setIsAuthenticated(true);
          } else {
            // Token is invalid, redirect to auth
            router.push('/auth');
            return;
          }
        } else {
          // Token is invalid, redirect to auth
          router.push('/auth');
          return;
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/auth');
        return;
      } finally {
        setAuthChecked(true);
      }
    }

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authChecked || !isAuthenticated) return;

    const fetchCourse = async () => {
      try {
        const response = await fetch(`/api/courses/${params.slug}`);
        if (!response.ok) {
          throw new Error('فشل في تحميل بيانات الدورة');
        }
        const data = await response.json();
        setCourse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [params.slug, authChecked, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-secondary-900 to-primary-800 flex items-center justify-center">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-secondary-900 to-primary-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">
            {error || 'لم يتم العثور على الدورة'}
          </div>
          <Link
            href="/courses"
            className="text-primary-300 hover:text-primary-100 underline"
          >
            العودة إلى الدورات
          </Link>
        </div>
      </div>
    );
  }

  if (course.isFree) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-secondary-900 to-primary-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">
            هذه الدورة مجانية
          </div>
          <Link
            href={`/courses/${course.slug}`}
            className="text-primary-300 hover:text-primary-100 underline"
          >
            العودة إلى صفحة الدورة
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-secondary-900 to-primary-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              إتمام الشراء
            </h1>
            <p className="text-white/80">
              أكمل عملية الدفع للوصول إلى الدورة
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Course Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/5 rounded-xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">
                تفاصيل الدورة
              </h2>

              {course.imageUrl && (
                <div className="mb-4">
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              <h3 className="text-lg font-semibold text-white mb-2">
                {course.title}
              </h3>

              <p className="text-white/70 mb-4 line-clamp-3">
                {course.description}
              </p>

              <div className="text-2xl font-bold text-primary-300">
                {course.price} {course.currency}
              </div>
            </motion.div>

            {/* Payment Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/5 rounded-xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">
                معلومات الدفع
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-white">
                  <span>سعر الدورة:</span>
                  <span>{course.price} {course.currency}</span>
                </div>
                <div className="flex justify-between text-white font-bold text-lg border-t border-white/20 pt-2">
                  <span>المجموع:</span>
                  <span>{course.price} {course.currency}</span>
                </div>
              </div>

              <div className="text-center">
                <PayPalButton
                  key={`paypal-${course.id}`}
                  courseId={course.id}
                  amount={course.price || 0}
                  currency={course.currency || 'USD'}
                  courseTitle={course.title}
                />
              </div>

              <div className="mt-6 text-center">
                <Link
                  href={`/courses/${course.slug}`}
                  className="text-primary-300 hover:text-primary-100 underline text-sm"
                >
                  العودة إلى صفحة الدورة
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}