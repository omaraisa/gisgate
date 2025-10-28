import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, UserRole, PrismaClient } from '@prisma/client';
import { JWTUtils, JWTPayload } from './jwt-utils';

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullNameArabic?: string;
  fullNameEnglish?: string;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
}

export class AuthService {
  private static readonly BCRYPT_ROUNDS = 12;

  // Password hashing
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // JWT token management
  static async generateToken(user: AuthUser): Promise<string> {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return JWTUtils.generateToken(payload);
  }

  static verifyToken(token: string): Promise<JWTPayload | null> {
    return JWTUtils.verifyToken(token);
  }

  // Token generation for email verification and password reset
  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // User authentication
  static async authenticateUser(email: string, password: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return null;
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new Error('Account is temporarily locked due to too many failed login attempts');
    }

    const isValidPassword = await this.verifyPassword(password, user.password);
    if (!isValidPassword) {
      // Increment login attempts
      await this.handleFailedLogin(user.id);
      return null;
    }

    // Reset login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockUntil: null,
        lastLogin: new Date(),
      },
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      fullNameArabic: user.fullNameArabic || undefined,
      fullNameEnglish: user.fullNameEnglish || undefined,
      role: user.role,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
    };
  }

  // Handle failed login attempts
  private static async handleFailedLogin(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const newAttempts = user.loginAttempts + 1;
    const lockUntil = newAttempts >= 5 ? new Date(Date.now() + 2 * 60 * 60 * 1000) : null; // 2 hours lock

    await prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: newAttempts,
        lockUntil,
      },
    });
  }

  // User registration
  static async registerUser(userData: {
    email: string;
    password: string;
    username?: string;
    fullNameArabic: string;
    fullNameEnglish: string;
    wordpressId?: number;
  }): Promise<User> {
    const hashedPassword = await this.hashPassword(userData.password);
    const verificationToken = this.generateSecureToken();

    // Extract firstName and lastName from fullNameArabic (primary) or fullNameEnglish (fallback)
    let firstName = '';
    let lastName = '';

    // Try to extract from Arabic name first
    if (userData.fullNameArabic && userData.fullNameArabic.trim()) {
      const arabicParts = userData.fullNameArabic.trim().split(/\s+/);
      firstName = arabicParts[0] || '';
      lastName = arabicParts.slice(1).join(' ') || '';
    }

    // If Arabic extraction didn't work or is incomplete, try English as fallback
    if (!firstName || !lastName) {
      const englishParts = userData.fullNameEnglish.trim().split(/\s+/);
      if (!firstName) firstName = englishParts[0] || '';
      if (!lastName) lastName = englishParts.slice(1).join(' ') || '';
    }

    return prisma.user.create({
      data: {
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        username: userData.username,
        firstName,
        lastName,
        fullNameArabic: userData.fullNameArabic,
        fullNameEnglish: userData.fullNameEnglish.toUpperCase(),
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        wordpressId: userData.wordpressId,
      },
    });
  }

  // Email verification
  static async verifyEmail(token: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) return false;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    return true;
  }

  // Password reset
  static async initiatePasswordReset(email: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) return null;

    const resetToken = this.generateSecureToken();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
      },
    });

    return resetToken;
  }

  static async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) return false;

    const hashedPassword = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        loginAttempts: 0,
        lockUntil: null,
      },
    });

    return true;
  }

  // Session management
  static async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.userSession.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return token;
  }

  static async validateSession(token: string): Promise<AuthUser | null> {
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return null;
    }

    const user = session.user;
    return {
      id: user.id,
      email: user.email,
      username: user.username || undefined,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      fullNameArabic: user.fullNameArabic || undefined,
      fullNameEnglish: user.fullNameEnglish || undefined,
      role: user.role,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
    };
  }

  static async invalidateSession(token: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: { token },
      data: { isActive: false },
    });
  }

  static async invalidateAllUserSessions(userId: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }

  // User management utilities
  static async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  static async getUserWithDetails(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                titleEnglish: true,
                slug: true,
                price: true,
                currency: true,
                isFree: true,
              },
            },
            certificates: {
              select: {
                id: true,
                certificateId: true,
                createdAt: true,
              },
            },
          },
        },
        certificates: {
          include: {
            enrollment: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    titleEnglish: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                titleEnglish: true,
                price: true,
                currency: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  static async updateUser(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  static async deleteUser(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  // WordPress migration helpers
  static async migrateWordPressUser(wordpressUser: {
    id: number;
    email: string;
    username: string;
    password: string; // Already hashed
    firstName?: string;
    lastName?: string;
    fullNameArabic: string;
    fullNameEnglish: string;
    meta?: Record<string, unknown>;
  }): Promise<User> {
    // Extract firstName and lastName if not already provided
    let firstName = wordpressUser.firstName || '';
    let lastName = wordpressUser.lastName || '';

    // If not provided in WordPress data, extract from names
    if (!firstName || !lastName) {
      // Try to extract from Arabic name first
      if (wordpressUser.fullNameArabic && wordpressUser.fullNameArabic.trim()) {
        const arabicParts = wordpressUser.fullNameArabic.trim().split(/\s+/);
        if (!firstName) firstName = arabicParts[0] || '';
        if (!lastName) lastName = arabicParts.slice(1).join(' ') || '';
      }

      // If still missing, try English as fallback
      if (!firstName || !lastName) {
        const englishParts = wordpressUser.fullNameEnglish.trim().split(/\s+/);
        if (!firstName) firstName = englishParts[0] || '';
        if (!lastName) lastName = englishParts.slice(1).join(' ') || '';
      }
    }

    return prisma.user.create({
      data: {
        wordpressId: wordpressUser.id,
        email: wordpressUser.email.toLowerCase(),
        username: wordpressUser.username,
        password: wordpressUser.password, // Already hashed from WordPress
        firstName,
        lastName,
        fullNameArabic: wordpressUser.fullNameArabic,
        fullNameEnglish: wordpressUser.fullNameEnglish.toUpperCase(),
        wordpressMeta: wordpressUser.meta ? JSON.stringify(wordpressUser.meta) : null,
        emailVerified: true, // Assume WordPress users are verified
        role: UserRole.USER, // Default role, can be updated later
      },
    });
  }
}