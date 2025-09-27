import { NextRequest, NextResponse } from 'next/server';
import { WordPressMigrator, migrateFromWordPress } from '../../lib/wordpress-migrator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wordpressUrl, ...options } = body;

    if (!wordpressUrl) {
      return NextResponse.json(
        { error: 'WordPress URL is required' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting migration from: ${wordpressUrl}`);

    const stats = await migrateFromWordPress(wordpressUrl, options);

    return NextResponse.json({
      message: 'Migration completed successfully',
      stats
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const wordpressUrl = searchParams.get('url');

  if (!wordpressUrl) {
    return NextResponse.json(
      { error: 'WordPress URL is required' },
      { status: 400 }
    );
  }

  const migrator = new WordPressMigrator({ wordpressUrl });

  try {
    switch (action) {
      case 'test':
        const isConnected = await migrator.testConnection();
        return NextResponse.json({ 
          connected: isConnected,
          message: isConnected ? 'Connection successful' : 'Connection failed'
        });

      case 'info':
        const siteInfo = await migrator.getSiteInfo();
        return NextResponse.json({ siteInfo });

      case 'preview':
        // Get first 5 posts to preview what would be migrated
        try {
          const response = await fetch(`${wordpressUrl}/wp-json/wp/v2/posts?per_page=5&status=publish&_embed`);
          if (response.ok) {
interface WordPressPost {
  id: number;
  title: { rendered: string };
  slug: string;
  status: string;
  date: string;
  _embedded?: {
    author?: Array<{ name: string }>;
    'wp:featuredmedia'?: Array<{ source_url: string }>;
  };
  excerpt: { rendered: string };
}

            const posts = await response.json() as WordPressPost[];
            const preview = posts.map((post: WordPressPost) => ({
              id: post.id,
              title: post.title.rendered,
              slug: decodeURIComponent(post.slug),
              status: post.status,
              date: post.date,
              author: post._embedded?.author?.[0]?.name || 'Unknown',
              featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
              excerpt: post.excerpt.rendered?.replace(/<[^>]*>/g, '').substring(0, 150) + '...'
            }));
            return NextResponse.json({ preview });
          } else {
            throw new Error('Failed to fetch preview posts');
          }
        } catch (error) {
          return NextResponse.json(
            { error: 'Failed to get preview', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: test, info, or preview' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('WordPress API error:', error);
    return NextResponse.json(
      { 
        error: 'Request failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}