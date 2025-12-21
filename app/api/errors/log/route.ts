import { NextRequest, NextResponse } from 'next/server';

// POST /api/errors/log - Log client-side errors
export async function POST(request: NextRequest) {
  try {
    const errorLog = await request.json();

    // Log to console (in production, you'd send this to a logging service)
    console.error('Client Error:', {
      timestamp: errorLog.timestamp,
      message: errorLog.message,
      url: errorLog.url,
      stack: errorLog.stack,
      userId: errorLog.userId,
      userAgent: errorLog.userAgent,
      additionalInfo: errorLog.additionalInfo,
    });

    // In production, you could:
    // - Send to a logging service (Sentry, LogRocket, etc.)
    // - Store in database for analysis
    // - Send alerts for critical errors
    // - Aggregate error patterns

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging client error:', error);
    // Don't fail - we don't want error logging to cause more errors
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
