'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, CheckCircle, AlertCircle } from 'lucide-react';
import StarRating from './StarRating';

interface ReviewFormProps {
  solutionSlug: string;
  userId?: string;
  isLoggedIn: boolean;
  className?: string;
}

export default function ReviewForm({
  solutionSlug,
  userId,
  isLoggedIn,
  className = ''
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      setError('يجب تسجيل الدخول أولاً');
      return;
    }

    if (rating === 0) {
      setError('يرجى اختيار تقييم');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/marketplace/${solutionSlug}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
          userId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إرسال التقييم');
      }

      setSubmitted(true);
      setRating(0);
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-green-50 border border-green-200 rounded-xl p-6 text-center ${className}`}
      >
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          شكراً لك على التقييم!
        </h3>
        <p className="text-green-600">
          تم إرسال تقييمك بنجاح وسيظهر قريباً
        </p>
      </motion.div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-xl p-6 text-center ${className}`}>
        <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          قيّم هذا الحل
        </h3>
        <p className="text-gray-600 mb-4">
          يجب تسجيل الدخول لإضافة تقييم
        </p>
        <button
          onClick={() => window.location.href = '/auth'}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          تسجيل الدخول
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border border-gray-200 rounded-xl p-6 shadow-sm ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-400" />
        قيّم هذا الحل
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            التقييم *
          </label>
          <div className="flex items-center gap-4">
            <StarRating
              rating={rating}
              interactive={true}
              onChange={setRating}
              size="lg"
            />
            {rating > 0 && (
              <span className="text-sm text-gray-600">
                {rating === 1 && 'ضعيف'}
                {rating === 2 && 'مقبول'}
                {rating === 3 && 'جيد'}
                {rating === 4 && 'جيد جداً'}
                {rating === 5 && 'ممتاز'}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            التعليق (اختياري)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="شاركنا تجربتك مع هذا الحل..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            maxLength={500}
          />
          <div className="text-xs text-gray-500 mt-1 text-left">
            {comment.length}/500
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-red-700 text-sm">{error}</span>
          </motion.div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-3 px-6 rounded-lg font-medium hover:from-primary-700 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              إرسال التقييم
            </>
          )}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500 text-center">
        💡 نصيحة: التقييمات الصادقة تساعد المطورين في تحسين حلولهم
      </div>
    </motion.div>
  );
}