import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { prisma } from './prisma';

export interface CertificateField {
  id: string;
  type: 'STUDENT_NAME' | 'COURSE_TITLE' | 'COMPLETION_DATE' | 'DURATION' | 'INSTRUCTOR' | 'CERTIFICATE_ID' | 'QR_CODE';
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  maxWidth?: number;
  width?: number;
  height?: number;
  fontWeight?: 'normal' | 'bold';
  rotation?: number;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  language: string;
  backgroundImage: string;
  fields: CertificateField[];
}

export interface CertificateData {
  studentName: string;
  courseTitle: string;
  completionDate: string;
  duration?: string;
  instructor?: string;
  certificateId: string;
  language: string;
}

export class CertificateService {
  static async generateCertificatePDF(templateId: string, data: CertificateData): Promise<Buffer> {
    const template = await prisma.certificateTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error('Certificate template not found');
    }

    // Generate QR code for verification
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/certificates/verify/${data.certificateId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Create HTML template
    const html = this.generateHTML(template, data, qrCodeDataUrl);

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Calculate page dimensions based on template size
      const templateWidth = (template as any).backgroundWidth || 2480;
      const templateHeight = (template as any).backgroundHeight || 3508;
      
      // Set page to match template dimensions (convert pixels to points: 1px = 0.75pt)
      const pageWidth = templateWidth * 0.75;
      const pageHeight = templateHeight * 0.75;
      
      const pdfBuffer = await page.pdf({
        width: pageWidth,
        height: pageHeight,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private static generateHTML(template: any, data: CertificateData, qrCodeDataUrl: string): string {
    let fields: CertificateField[] = [];
    
    if (Array.isArray(template.fields)) {
      fields = template.fields;
    } else if (typeof template.fields === 'object' && template.fields !== null) {
      // Convert old object format to array format
      fields = Object.entries(template.fields).map(([key, config]: [string, any]) => ({
        id: key,
        type: this.mapFieldKeyToType(key) as CertificateField['type'],
        x: config.x,
        y: config.y,
        fontSize: config.fontSize || 16,
        fontFamily: config.fontFamily || 'Arial',
        color: config.color || '#000000',
        textAlign: config.textAlign || 'left',
        maxWidth: config.maxWidth,
        rotation: config.rotation
      }));
    }
    
    const isRTL = template.language === 'ar';

    // Generate field HTML elements
    const fieldElements = fields.map((field: CertificateField) => {
      const style = this.getFieldStyle(field);
      const content = this.getFieldContent(field, data, qrCodeDataUrl);
      
      return `<div style="${style}">${content}</div>`;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="${template.language}" dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate</title>
        <style>
          @font-face {
            font-family: 'Kufi';
            src: url('fonts/kufi.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            width: ${(template as any).backgroundWidth || 2480}px;
            height: ${(template as any).backgroundHeight || 3508}px;
            position: relative;
            background-image: url('${template.backgroundImage}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            font-family: 'Kufi', sans-serif;
            overflow: hidden;
            margin: 0;
            padding: 0;
          }

          .field {
            position: absolute;
            white-space: pre-wrap;
            word-wrap: break-word;
          }

          .qr-code img {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        ${fieldElements}
      </body>
      </html>
    `;
  }

  private static getFieldStyle(field: CertificateField): string {
    const styles = [
      `position: absolute`,
      `left: ${field.x}px`,
      `top: ${field.y}px`,
      `font-size: ${field.fontSize || 16}px`,
      `font-family: ${field.fontFamily || 'Kufi'}`,
      `color: ${field.color || '#000000'}`,
      `text-align: ${field.textAlign || 'left'}`,
      `font-weight: ${field.fontWeight || 'normal'}`
    ];

    if (field.maxWidth) {
      styles.push(`max-width: ${field.maxWidth}px`);
      styles.push(`white-space: nowrap`);
      styles.push(`overflow: visible`);
    }

    if (field.width) {
      styles.push(`width: ${field.width}px`);
    }

    if (field.height) {
      styles.push(`height: ${field.height}px`);
    }

    if (field.rotation) {
      styles.push(`transform: rotate(${field.rotation}deg)`);
    }

    return styles.join('; ');
  }

  private static getFieldContent(field: CertificateField, data: CertificateData, qrCodeDataUrl: string): string {
    switch (field.type) {
      case 'STUDENT_NAME':
        return data.studentName;
      case 'COURSE_TITLE':
        return data.courseTitle;
      case 'COMPLETION_DATE':
        return data.completionDate;
      case 'DURATION':
        return data.duration || '';
      case 'INSTRUCTOR':
        return data.instructor || '';
      case 'CERTIFICATE_ID':
        return data.certificateId;
      case 'QR_CODE':
        const qrWidth = field.width || 120;
        const qrHeight = field.height || 120;
        return `<img src="${qrCodeDataUrl}" alt="QR Code" style="width: ${qrWidth}px; height: ${qrHeight}px; object-fit: contain;" />`;
      default:
        // Handle field.id directly for backward compatibility
        if (field.id === 'studentName') return data.studentName;
        if (field.id === 'courseName' || field.id === 'courseTitle') return data.courseTitle;
        if (field.id === 'completionDate') return data.completionDate;
        if (field.id === 'duration') return data.duration || '';
        if (field.id === 'instructor') return data.instructor || '';
        if (field.id === 'certificateId') return data.certificateId;
        return '';
    }
  }

  static async generateCertificate(enrollmentId: string, language?: string): Promise<string> {
    // Get enrollment with course and user data
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: true,
        course: true
      }
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    // Check if course is actually completed by counting completed lessons
    const totalLessons = await prisma.video.count({
      where: { courseId: enrollment.courseId }
    });

    const completedLessons = await prisma.lessonProgress.count({
      where: {
        enrollmentId: enrollment.id,
        isCompleted: true
      }
    });

    const isActuallyCompleted = totalLessons > 0 && completedLessons === totalLessons;

    if (!isActuallyCompleted && !enrollment.isCompleted) {
      throw new Error('Course not completed');
    }

    // Check if certificate already exists
    const existingCert = await prisma.certificate.findUnique({
      where: { 
        userId_enrollmentId: {
          userId: enrollment.userId,
          enrollmentId: enrollment.id
        }
      }
    });

    if (existingCert) {
      return existingCert.certificateId;
    }

    let template;

    if (language) {
      // Find default template for the specified language
      template = await prisma.certificateTemplate.findFirst({
        where: {
          language: language,
          isDefault: true,
          isActive: true
        }
      });

      if (!template) {
        throw new Error(`No default certificate template found for language: ${language}`);
      }
    } else {
      // Get appropriate template based on course language - prefer default templates
      template = await prisma.certificateTemplate.findFirst({
        where: {
          language: enrollment.course.language || 'ar',
          isActive: true
        },
        orderBy: [
          { isDefault: 'desc' }, // Default templates first
          { createdAt: 'desc' }  // Then by creation date
        ]
      });
    }

    if (!template) {
      throw new Error('No active certificate template found');
    }

    // Generate unique certificate ID
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Prepare certificate data with proper language support
    const isArabic = template.language === 'ar';
    
    const studentName = isArabic 
      ? enrollment.user.fullNameArabic || `${enrollment.user.firstName} ${enrollment.user.lastName || ''}`.trim() || enrollment.user.email
      : enrollment.user.fullNameEnglish || `${enrollment.user.firstName} ${enrollment.user.lastName || ''}`.trim() || enrollment.user.email;

    // Course title based on certificate language (not course language)
    const courseTitle = isArabic 
      ? enrollment.course.title // Arabic title
      : enrollment.course.titleEnglish || enrollment.course.title; // English title or fallback

    const certificateData: CertificateData = {
      studentName,
      courseTitle,
      completionDate: isArabic 
        ? enrollment.completedAt?.toLocaleDateString('ar-SA') || new Date().toLocaleDateString('ar-SA')
        : enrollment.completedAt?.toLocaleDateString('en-US') || new Date().toLocaleDateString('en-US'),
      duration: enrollment.course.duration || undefined,
      instructor: isArabic 
        ? enrollment.course.authorName || 'عمر الهادي'
        : enrollment.course.authorNameEnglish || enrollment.course.authorName || 'Omar Elhadi',
      certificateId,
      language: template.language
    };

    // Create certificate record
    await prisma.certificate.create({
      data: {
        templateId: template.id,
        userId: enrollment.userId,
        enrollmentId: enrollment.id,
        certificateId,
        data: certificateData as any
      }
    });

    return certificateId;
  }

  private static mapFieldKeyToType(key: string): string {
    const mapping: Record<string, string> = {
      'studentName': 'STUDENT_NAME',
      'courseName': 'COURSE_TITLE', 
      'courseTitle': 'COURSE_TITLE',
      'completionDate': 'COMPLETION_DATE',
      'duration': 'DURATION',
      'instructor': 'INSTRUCTOR',
      'certificateId': 'CERTIFICATE_ID',
      'qrCode': 'QR_CODE'
    };
    return mapping[key] || 'STUDENT_NAME';
  }
}