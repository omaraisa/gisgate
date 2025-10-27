'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showText?: boolean;
  className?: string;
}

export default function StarRating({
  rating,
  totalStars = 5,
  size = 'md',
  interactive = false,
  onChange,
  showText = false,
  className = ''
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(rating);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starValue: number) => {
    if (!interactive) return;
    
    setSelectedRating(starValue);
    onChange?.(starValue);
  };

  const handleStarHover = (starValue: number) => {
    if (!interactive) return;
    setHoverRating(starValue);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoverRating(0);
  };

  const displayRating = hoverRating || selectedRating;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div 
        className="flex items-center gap-1"
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: totalStars }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayRating;
          const isPartiallyFilled = !isFilled && starValue - 0.5 <= displayRating;

          return (
            <div
              key={index}
              className="relative"
              onClick={() => handleStarClick(starValue)}
              onMouseEnter={() => handleStarHover(starValue)}
            >
              <Star
                className={`
                  ${sizeClasses[size]}
                  ${interactive ? 'cursor-pointer transition-colors duration-200' : ''}
                  ${isFilled 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : isPartiallyFilled 
                    ? 'text-yellow-400' 
                    : interactive && hoverRating >= starValue
                    ? 'text-yellow-300 fill-yellow-300'
                    : 'text-gray-300'
                  }
                  ${interactive ? 'hover:scale-110' : ''}
                `}
              />
              {isPartiallyFilled && (
                <Star
                  className={`
                    ${sizeClasses[size]}
                    absolute top-0 left-0 text-yellow-400 fill-yellow-400
                  `}
                  style={{
                    clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {showText && (
        <span className="text-sm text-gray-600 ml-2">
          {displayRating.toFixed(1)} من {totalStars}
        </span>
      )}
    </div>
  );
}

// Display-only star rating with average and count
interface RatingDisplayProps {
  rating: number;
  reviewCount: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function RatingDisplay({
  rating,
  reviewCount,
  size = 'md',
  showCount = true,
  className = ''
}: RatingDisplayProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <StarRating rating={rating} size={size} />
      {showCount && (
        <span className="text-sm text-gray-600">
          ({reviewCount} {reviewCount === 1 ? 'تقييم' : 'تقييم'})
        </span>
      )}
    </div>
  );
}

// Detailed rating breakdown
interface RatingBreakdownProps {
  ratingDistribution: Record<number, number>;
  totalReviews: number;
  className?: string;
}

export function RatingBreakdown({
  ratingDistribution,
  totalReviews,
  className = ''
}: RatingBreakdownProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = ratingDistribution[stars] || 0;
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

        return (
          <div key={stars} className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1 w-12">
              <span className="text-gray-600">{stars}</span>
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            </div>
            
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            <span className="text-gray-600 w-8 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}