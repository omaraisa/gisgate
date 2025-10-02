import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE /api/admin/enrollments/[id] - Delete enrollment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const resolvedParams = await params;
    const enrollmentId = resolvedParams.id;

    // Check if enrollment exists
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Delete related records first
    await prisma.lessonProgress.deleteMany({
      where: { enrollmentId: enrollmentId },
    });

    await prisma.certificate.deleteMany({
      where: { enrollmentId: enrollmentId },
    });

    // Delete the enrollment
    await prisma.courseEnrollment.delete({
      where: { id: enrollmentId },
    });

    return NextResponse.json({
      message: 'Enrollment deleted successfully',
    });

  } catch (error) {
    console.error('Delete enrollment error:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);

    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'Admin access required') {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}