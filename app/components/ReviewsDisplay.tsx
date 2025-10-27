'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, User, CheckCircle, Calendar, MessageSquare } from 'lucide-react';
import { RatingDisplay, RatingBreakdown } from './StarRating';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  isVerified: boolean;
  createdAt: string;
  user?: {
    id: string;
    fullName?: string;
    email?: string;
  };
}

interface ReviewStatistics {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
}

interface ReviewsDisplayProps {
  solutionSlug: string;
  onNewReview?: (review: Review) => void;
  className?: string;
}

export default function ReviewsDisplay({
  solutionSlug,
  onNewReview,
  className = ''
}: ReviewsDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  useEffect(() => {
    fetchReviews();
  }, [solutionSlug]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/marketplace/${solutionSlug}/reviews`);
      
      if (!response.ok) {
        throw new Error('فشل في تحميل التقييمات');
      }

      const data = await response.json();
      setReviews(data.reviews);
      setStatistics(data.statistics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل التقييمات');
    } finally {
      setLoading(false);
    }
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const getUserDisplayName = (user: Review['user']) => {
    return user?.fullName || user?.email?.split('@')[0] || 'مستخدم مجهول';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 text-red-600 ${className}`}>
        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Statistics Summary */}
      {statistics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            التقييمات ({statistics.totalReviews})
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {statistics.averageRating}
              </div>
              <RatingDisplay
                rating={statistics.averageRating}
                reviewCount={statistics.totalReviews}
                size="lg"
                className="justify-center mb-2"
              />
              <p className="text-gray-600 text-sm">
                متوسط التقييم من {statistics.totalReviews} مراجعة
              </p>
            </div>

            {/* Rating Breakdown */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">توزيع التقييمات</h4>
              <RatingBreakdown
                ratingDistribution={statistics.ratingDistribution}
                totalReviews={statistics.totalReviews}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div>
          {/* Sort Options */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900">
              جميع التقييمات ({reviews.length})
            </h4>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="newest">الأحدث أولاً</option>
              <option value="oldest">الأقدم أولاً</option>
              <option value="highest">الأعلى تقييماً</option>
              <option value="lowest">الأقل تقييماً</option>
            </select>
          </div>

          {/* Reviews */}
          <div className="space-y-4">
            {sortedReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {getUserDisplayName(review.user)[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {getUserDisplayName(review.user)}
                        </span>
                        {review.isVerified && (
                          <div title="مشتري محقق">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(review.createdAt)}
                      </div>
                    </div>
                  </div>

                  <RatingDisplay
                    rating={review.rating}
                    reviewCount={0}
                    showCount={false}
                    size="sm"
                  />
                </div>

                {/* Review Comment */}
                {review.comment && (
                  <div className="text-gray-700 leading-relaxed">
                    {review.comment}
                  </div>
                )}

                {/* Verification Badge */}
                {review.isVerified && (
                  <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    مشتري محقق
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-gray-50 border border-gray-200 rounded-xl"
        >
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            لا توجد تقييمات بعد
          </h3>
          <p className="text-gray-500">
            كن أول من يقيم هذا الحل!
          </p>
        </motion.div>
      )}
    </div>
  );
}