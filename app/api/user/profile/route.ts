import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  fullNameArabic: z.string().min(1, 'Full name in Arabic is required').optional(),
  fullNameEnglish: z.string().min(1, 'Full name in English is required').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  website: z.string().url('Invalid website URL').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const user = await AuthService.validateSession(token);

  if (!user) {
    throw new Error('Invalid or expired token');
  }

  return user;
}

// GET /api/user/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

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
    
    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'Invalid or expired token') {
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

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);

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
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'Invalid or expired token') {
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

// PATCH /api/user/profile/password - Change password
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);

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
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'Invalid or expired token') {
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