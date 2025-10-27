import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/marketplace/[slug]/reviews - Get all reviews for a solution
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    const solution = await prisma.solution.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!solution) {
      return NextResponse.json(
        { error: 'Solution not found' },
        { status: 404 }
      );
    }

    const reviews = await prisma.solutionReview.findMany({
      where: { solutionId: solution.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullNameArabic: true,
            fullNameEnglish: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate rating statistics
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length,
    };

    return NextResponse.json({
      reviews: reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        isVerified: review.isVerified,
        createdAt: review.createdAt,
        user: {
          id: review.user.id,
          fullName: review.user.fullNameArabic || review.user.fullNameEnglish,
          email: review.user.email
        }
      })),
      statistics: {
        totalReviews,
        averageRating: Number(averageRating.toFixed(1)),
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace/[slug]/reviews - Submit a new review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { rating, comment, userId } = body;

    // Validate input
    if (!userId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid input. Rating must be between 1 and 5.' },
        { status: 400 }
      );
    }

    // Find solution
    const solution = await prisma.solution.findUnique({
      where: { slug },
      select: { id: true }
    });

    if (!solution) {
      return NextResponse.json(
        { error: 'Solution not found' },
        { status: 404 }
      );
    }

    // Check if user already reviewed this solution
    const existingReview = await prisma.solutionReview.findUnique({
      where: {
        userId_solutionId: {
          userId,
          solutionId: solution.id
        }
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this solution' },
        { status: 409 }
      );
    }

    // Check if user has purchased/downloaded the solution (for verification)
    const hasPurchased = await prisma.solutionPurchase.findFirst({
      where: {
        userId,
        solutionId: solution.id
      }
    });

    const hasDownloaded = await prisma.solutionDownload.findFirst({
      where: {
        userId,
        solutionId: solution.id
      }
    });

    const isVerified = !!(hasPurchased || hasDownloaded);

    // Create review
    const review = await prisma.solutionReview.create({
      data: {
        userId,
        solutionId: solution.id,
        rating: parseInt(rating),
        comment: comment || null,
        isVerified
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullNameArabic: true,
            fullNameEnglish: true
          }
        }
      }
    });

    // Update solution rating statistics
    const allReviews = await prisma.solutionReview.findMany({
      where: { solutionId: solution.id },
      select: { rating: true }
    });

    const newAverageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.solution.update({
      where: { id: solution.id },
      data: {
        rating: Number(newAverageRating.toFixed(1)),
        reviewCount: allReviews.length
      }
    });

    return NextResponse.json({
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        isVerified: review.isVerified,
        createdAt: review.createdAt,
        user: {
          id: review.user.id,
          fullName: review.user.fullNameArabic || review.user.fullNameEnglish,
          email: review.user.email
        }
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}