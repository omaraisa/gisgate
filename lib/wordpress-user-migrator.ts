import { AuthService } from './auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface WordPressUser {
  id: number;
  user_login: string;
  user_email: string;
  user_pass: string; // Already hashed
  user_registered: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  user_url?: string;
  description?: string;
  user_meta?: Record<string, unknown>;
}

export class WordPressUserMigrator {
  static async migrateUsers(wpUsers: WordPressUser[]): Promise<{
    migrated: number;
    skipped: number;
    errors: string[];
  }> {
    let migrated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const wpUser of wpUsers) {
      try {
        // Check if user already exists
        const existingUser = await AuthService.getUserByEmail(wpUser.user_email);
        if (existingUser) {
          console.log(`User ${wpUser.user_email} already exists, skipping...`);
          skipped++;
          continue;
        }

        // Check if WordPress ID already exists
        const existingWpUser = await prisma.user.findUnique({
          where: { wordpressId: wpUser.id },
        });
        if (existingWpUser) {
          console.log(`WordPress user ID ${wpUser.id} already migrated, skipping...`);
          skipped++;
          continue;
        }

        // Validate required fields
        if (!wpUser.user_email || !wpUser.user_pass) {
          errors.push(`User ${wpUser.id} missing required fields`);
          continue;
        }

        // Migrate the user
        await AuthService.migrateWordPressUser({
          id: wpUser.id,
          email: wpUser.user_email,
          username: wpUser.user_login,
          password: wpUser.user_pass, // Already hashed from WordPress
          firstName: wpUser.first_name,
          lastName: wpUser.last_name,
          displayName: wpUser.display_name,
          meta: wpUser.user_meta,
        });

        migrated++;
        console.log(`Migrated user: ${wpUser.user_email}`);

      } catch (error) {
        const errorMsg = `Failed to migrate user ${wpUser.id} (${wpUser.user_email}): ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return { migrated, skipped, errors };
  }

  static async getMigrationStats(): Promise<{
    totalUsers: number;
    migratedUsers: number;
    wordpressUsers: number;
  }> {
    const [totalUsers, wordpressUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { wordpressId: { not: null } },
      }),
    ]);

    return {
      totalUsers,
      migratedUsers: wordpressUsers,
      wordpressUsers,
    };
  }

  static async getUnmigratedWordPressUsers(wpUsers: WordPressUser[]): Promise<WordPressUser[]> {
    const existingEmails = await prisma.user.findMany({
      where: {
        email: {
          in: wpUsers.map(u => u.user_email),
        },
      },
      select: { email: true },
    });

    const existingWpIds = await prisma.user.findMany({
      where: {
        wordpressId: {
          in: wpUsers.map(u => u.id),
        },
      },
      select: { wordpressId: true },
    });

    const existingEmailSet = new Set(existingEmails.map(u => u.email));
    const existingWpIdSet = new Set(existingWpIds.map(u => u.wordpressId));

    return wpUsers.filter(user =>
      !existingEmailSet.has(user.user_email) &&
      !existingWpIdSet.has(user.id)
    );
  }
}