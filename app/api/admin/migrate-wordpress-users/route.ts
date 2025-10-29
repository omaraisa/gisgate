import { NextRequest, NextResponse } from 'next/server';
import { WordPressUserMigrator, WordPressUser } from '@/lib/wordpress-user-migrator';
import { requireAdmin } from '@/lib/api-auth';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    
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

// GET /api/admin/migrate-wordpress-users - Get migration stats
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    
    const stats = await WordPressUserMigrator.getMigrationStats();

    return NextResponse.json({
      stats,
    });

  } catch (error) {
    console.error('Get migration stats error:', error);
    
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