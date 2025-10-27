import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { requireAuth } from '@/lib/api-auth';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

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