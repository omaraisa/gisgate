import { SignJWT, jwtVerify } from 'jose';
import { UserRole } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export class JWTUtils {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  // Convert secret to Uint8Array for Web Crypto API
  private static getSecretKey(): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(this.JWT_SECRET);
  }

  static async generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
    const secret = this.getSecretKey();

    return new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(this.JWT_EXPIRES_IN)
      .sign(secret);
  }

  static async verifyToken(token: string): Promise<JWTPayload | null> {
    try {
      const secret = this.getSecretKey();
      const { payload } = await jwtVerify<JWTPayload>(token, secret);
      return payload;
    } catch {
      return null;
    }
  }
}