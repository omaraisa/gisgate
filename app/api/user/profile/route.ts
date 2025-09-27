import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  displayName: z.string().min(1, 'Display name is required').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  website: z.string().url('Invalid website URL').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

// GET /api/user/profile - Get current user profile
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const user = request.user;
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const fullUser = await AuthService.getUserById(user.id);
    if (!fullUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Don't return sensitive information
    const { password, emailVerificationToken, passwordResetToken, ...safeUser } = fullUser; // eslint-disable-line @typescript-eslint/no-unused-vars

    return NextResponse.json({ user: safeUser });

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, { requireAuth: true });

// PUT /api/user/profile - Update user profile
export const PUT = withAuth(async (request: NextRequest) => {
  try {
    const user = request.user;
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    // Update user profile
    const updatedUser = await AuthService.updateUser(user.id, validatedData);

    // Don't return sensitive information
    const { password, emailVerificationToken, passwordResetToken, ...safeUser } = updatedUser; // eslint-disable-line @typescript-eslint/no-unused-vars

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: safeUser,
    });

  } catch (error) {
    console.error('Update profile error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, { requireAuth: true });

// PATCH /api/user/profile/password - Change password
export const PATCH = withAuth(async (request: NextRequest) => {
  try {
    const user = request.user;
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    // Verify current password
    const fullUser = await AuthService.getUserById(user.id);
    if (!fullUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isCurrentPasswordValid = await AuthService.verifyPassword(currentPassword, fullUser.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password and update
    const hashedNewPassword = await AuthService.hashPassword(newPassword);
    await AuthService.updateUser(user.id, { password: hashedNewPassword });

    // Invalidate all sessions except current one
    // Note: In a real app, you'd want to keep the current session valid
    await AuthService.invalidateAllUserSessions(user.id);

    return NextResponse.json({
      message: 'Password changed successfully. Please login again.',
    });

  } catch (error) {
    console.error('Change password error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, { requireAuth: true });