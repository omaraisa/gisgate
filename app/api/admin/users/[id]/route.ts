import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { AuthService } from '@/lib/auth';
import { z } from 'zod';

// Force dynamic rendering to prevent build-time pre-rendering
export const dynamic = 'force-dynamic';

// Define UserRole manually to avoid build-time enum issues
const UserRoleValues = ['ADMIN', 'EDITOR', 'AUTHOR', 'USER'] as const;

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  fullNameArabic: z.string().min(1).optional(),
  fullNameEnglish: z.string().min(1).optional(),
  role: z.enum(UserRoleValues).optional(),
  isActive: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
});

// GET /api/admin/users/[id] - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    const user = await AuthService.getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user with enrollments and certificates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userWithDetails = await AuthService.getUserWithDetails(userId) as any; // Includes certificates and enrollments

    if (!userWithDetails) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate certificates count including virtual certificates for completed enrollments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const certificatesCount = (userWithDetails.certificates?.length || 0) + 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (userWithDetails.enrollments?.filter((enrollment: any) => 
        enrollment.isCompleted && enrollment.certificates.length === 0
      ).length || 0);

    // Don't return sensitive information
    const { password, emailVerificationToken, passwordResetToken, ...safeUser } = userWithDetails; // eslint-disable-line @typescript-eslint/no-unused-vars

    return NextResponse.json({ 
      user: {
        ...safeUser,
        certificatesCount // Add calculated certificates count
      }
    });

  } catch (error) {
    console.error('Get user error:', error);

    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'Admin access required') {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await AuthService.getUserById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check for email/username conflicts if they're being updated
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailConflict = await AuthService.getUserByEmail(validatedData.email);
      if (emailConflict) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        );
      }
    }

    // Update user
    const updatedUser = await AuthService.updateUser(userId, validatedData);

    // Don't return sensitive information
    const { password, emailVerificationToken, passwordResetToken, ...safeUser } = updatedUser; // eslint-disable-line @typescript-eslint/no-unused-vars

    return NextResponse.json({
      message: 'User updated successfully',
      user: safeUser,
    });

  } catch (error) {
    console.error('Update user error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'Admin access required') {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin(request);
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Check if user exists
    const user = await AuthService.getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user (this will cascade delete sessions due to foreign key constraints)
    await AuthService.deleteUser(userId);

    return NextResponse.json({
      message: 'User deleted successfully',
    });

  } catch (error) {
    console.error('Delete user error:', error);

    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'Admin access required') {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}