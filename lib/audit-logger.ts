import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogData {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogger {
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          details: data.details || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  static async logAdminAction(
    userId: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, unknown>,
    request?: Request
  ): Promise<void> {
    const ipAddress = request?.headers.get('x-forwarded-for') || 
                      request?.headers.get('x-real-ip') || 
                      undefined;
    const userAgent = request?.headers.get('user-agent') || undefined;

    await this.log({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    });
  }

  static async getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: Record<string, unknown> = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;
    if (filters?.resource) where.resource = filters.resource;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) (where.createdAt as Record<string, unknown>).gte = filters.startDate;
      if (filters.endDate) (where.createdAt as Record<string, unknown>).lte = filters.endDate;
    }

    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
    });
  }
}
