import { NextResponse } from 'next/server';
import { importDigitalTwinArticle } from '../../lib/import-article';

export async function POST() {
  try {
    const article = await importDigitalTwinArticle();
    return NextResponse.json({ 
      message: 'Article imported successfully',
      article 
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      error: 'Failed to import article' 
    }, { status: 500 });
  }
}
