import { NextRequest, NextResponse } from 'next/server';
import { WordPressUserMigrator, WordPressUser } from '@/lib/wordpress-user-migrator';
import { withAuth } from '@/lib/middleware';

export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { users }: { users: WordPressUser[] } = body;

    if (!users || !Array.isArray(users)) {
      return NextResponse.json(
        { error: 'Users array is required' },
        { status: 400 }
      );
    }

    console.log(`Starting migration of ${users.length} WordPress users...`);

    const result = await WordPressUserMigrator.migrateUsers(users);

    console.log(`Migration completed: ${result.migrated} migrated, ${result.skipped} skipped, ${result.errors.length} errors`);

    return NextResponse.json({
      message: 'WordPress user migration completed',
      ...result,
    });

  } catch (error) {
    console.error('WordPress user migration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, { requireAuth: true, requireAdmin: true });

// GET /api/admin/migrate-wordpress-users - Get migration stats
export const GET = withAuth(async () => {
  try {
    const stats = await WordPressUserMigrator.getMigrationStats();

    return NextResponse.json({
      stats,
    });

  } catch (error) {
    console.error('Get migration stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}, { requireAuth: true, requireAdmin: true });