import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/marketplace - Get all solutions with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const statusParam = searchParams.get('status');
    const status = statusParam === '' ? undefined : (statusParam || 'PUBLISHED');
    const solutionType = searchParams.get('type');
    const category = searchParams.get('category');
    const isFree = searchParams.get('isFree');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.SolutionWhereInput = {};
    
    if (status !== undefined) {
      where.status = status;
    }
    
    if (solutionType) {
      where.solutionType = solutionType;
    }
    
    if (category) {
      where.category = category;
    }
    
    if (isFree !== null && isFree !== undefined) {
      where.isFree = isFree === 'true';
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Map sort options to database fields
    let orderBy: Prisma.SolutionOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popular':
        orderBy = { downloadCount: 'desc' };
        break;
      case 'rating':
        orderBy = { rating: 'desc' };
        break;
      case 'title':
        orderBy = { title: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // Get total count
    const total = await prisma.solution.count({ where });

    // Get solutions
    const solutions = await prisma.solution.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        solutionType: true,
        category: true,
        price: true,
        currency: true,
        isFree: true,
        version: true,
        rating: true,
        reviewCount: true,
        downloadCount: true,
        publishedAt: true,
        authorName: true,
        fileType: true,
        fileSize: true,
        compatibility: true,
      },
    });

    return NextResponse.json({
      solutions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching solutions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch solutions' },
      { status: 500 }
    );
  }
}

// POST /api/marketplace - Create new solution (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const solution = await prisma.solution.create({
      data: {
        title: body.title,
        slug: body.slug,
        description: body.description,
        excerpt: body.excerpt,
        featuredImage: body.featuredImage,
        images: body.images,
        solutionType: body.solutionType,
        category: body.category,
        tags: body.tags,
        price: body.price || 0,
        currency: body.currency || 'USD',
        isFree: body.isFree !== undefined ? body.isFree : true,
        fileUrl: body.fileUrl,
        fileSize: body.fileSize,
        fileType: body.fileType,
        demoUrl: body.demoUrl,
        documentationUrl: body.documentationUrl,
        sourceCodeUrl: body.sourceCodeUrl,
        version: body.version,
        compatibility: body.compatibility,
        requirements: body.requirements,
        status: body.status || 'DRAFT',
        publishedAt: body.status === 'PUBLISHED' ? new Date() : null,
        authorId: body.authorId,
        authorName: body.authorName,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
      },
    });

    return NextResponse.json(solution, { status: 201 });
  } catch (error) {
    console.error('Error creating solution:', error);
    return NextResponse.json(
      { error: 'Failed to create solution' },
      { status: 500 }
    );
  }
}
