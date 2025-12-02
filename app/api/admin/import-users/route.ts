import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface WordPressUserRecord {
  ID: string;
  user_login: string;
  user_email: string;
  user_registered: string;
  display_name: string;
}

interface GeneralUserRecord {
  email: string;
  password: string;
  fullNameArabic: string;
  fullNameEnglish: string;
  username?: string;
  role?: string;
  emailVerified?: string;
  isActive?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const importType = formData.get('type') as string || 'general'; // 'wordpress' or 'general'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const csvText = await file.text();
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
    });

    let imported = 0;
    let skipped = 0;
    let errors = [];

    if (importType === 'wordpress') {
      // WordPress import logic with exact mapping as specified
      const defaultPassword = await bcrypt.hash('123', 10); // Default password as specified

      for (const record of records as WordPressUserRecord[]) {
        try {
          // Parse date with multiple formats
          let createdAt: Date;
          const dateStr = record.user_registered;

          if (dateStr.includes('/')) {
            // Format: MM/DD/YYYY HH:MM
            const [datePart, timePart] = dateStr.split(' ');
            const [month, day, year] = datePart.split('/');
            createdAt = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${timePart || '00:00'}`);
          } else {
            // Format: YYYY-MM-DD HH:MM:SS
            createdAt = new Date(dateStr);
          }

          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: record.user_email.toLowerCase() }
          });

          if (existingUser) {
            skipped++;
            continue;
          }

          // Extract firstName and lastName from display_name (Arabic name)
          const nameParts = record.display_name.trim().split(/\s+/);
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          await prisma.user.create({
            data: {
              // Mapping according to your specification:
              email: record.user_email.toLowerCase(),        // user_email -> email
              username: record.user_login,                   // user_login -> username  
              password: defaultPassword,                     // 123 -> password
              firstName: firstName,                          // extracted from display_name
              lastName: lastName,                            // extracted from display_name
              emailVerified: true,                           // TRUE -> emailVerified
              isActive: true,                               // TRUE -> isActive
              role: 'USER',                                 // USER -> role
              wordpressId: parseInt(record.ID),             // ID -> wordpressId
              createdAt: createdAt,                         // user_registered -> createdAt
              fullNameArabic: record.display_name,          // display_name -> fullNameArabic
              fullNameEnglish: record.display_name,         // display_name -> fullNameEnglish
              // Other fields will use defaults or null as per schema
            },
          });

          imported++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`Failed to import user ${record.ID}:`, error);
          errors.push(`User ${record.ID}: ${errorMessage}`);
          // Continue with next user if one fails (e.g., duplicate)
        }
      }
    } else {
      // General user import
      for (const record of records as GeneralUserRecord[]) {
        try {
          // Check required fields
          if (!record.email || !record.password || !record.fullNameArabic || !record.fullNameEnglish) {
            errors.push(`Row missing required fields: ${JSON.stringify(record)}`);
            continue;
          }

          // Check if user already exists
          const existingUser = await prisma.user.findUnique({
            where: { email: record.email.toLowerCase() }
          });

          if (existingUser) {
            skipped++;
            continue;
          }

          // Extract firstName and lastName from fullNameArabic
          const arabicParts = record.fullNameArabic.trim().split(/\s+/);
          const firstName = arabicParts[0] || '';
          const lastName = arabicParts.slice(1).join(' ') || '';

          // Hash password
          const hashedPassword = await bcrypt.hash(record.password, 10);

          // Create user
          await prisma.user.create({
            data: {
              email: record.email.toLowerCase(),
              password: hashedPassword,
              firstName,
              lastName,
              fullNameArabic: record.fullNameArabic,
              fullNameEnglish: record.fullNameEnglish.toUpperCase(),
              username: record.username || null,
              role: (record.role === 'ADMIN' || record.role === 'EDITOR' || record.role === 'AUTHOR') ? record.role : 'USER',
              emailVerified: record.emailVerified === 'true' || record.emailVerified === '1' || true,
              isActive: record.isActive === 'false' || record.isActive === '0' ? false : true,
            },
          });

          imported++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.warn(`Failed to import user ${record.email}:`, error);
          errors.push(`User ${record.email}: ${errorMessage}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: imported,
      skipped: skipped,
      errors: errors,
      total: records.length
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import users' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}