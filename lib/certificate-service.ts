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
      
      // Set page to A4 landscape for certificates
      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      });

      return pdfBuffer;
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
            width: 297mm;
            height: 210mm;
            position: relative;
            background-image: url('${template.backgroundImage}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            font-family: 'Kufi', sans-serif;
            overflow: hidden;
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

  static async generateCertificate(enrollmentId: string): Promise<string> {
    // Get enrollment with course and user data
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: true,
        course: true
      }
    });

    if (!enrollment || !enrollment.isCompleted) {
      throw new Error('Course not completed or enrollment not found');
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

    // Get appropriate template based on course language
    const template = await prisma.certificateTemplate.findFirst({
      where: {
        language: enrollment.course.language || 'ar',
        isActive: true
      }
    });

    if (!template) {
      throw new Error('No active certificate template found');
    }

    // Generate unique certificate ID
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Prepare certificate data
    const studentName = enrollment.course.language === 'ar' 
      ? enrollment.user.fullNameArabic || enrollment.user.firstName || enrollment.user.email
      : enrollment.user.fullNameEnglish || `${enrollment.user.firstName} ${enrollment.user.lastName}`.trim() || enrollment.user.email;

    const certificateData: CertificateData = {
      studentName,
      courseTitle: enrollment.course.title,
      completionDate: enrollment.completedAt?.toLocaleDateString('ar-SA') || new Date().toLocaleDateString('ar-SA'),
      duration: enrollment.course.duration || undefined,
      instructor: enrollment.course.authorName || 'عمر الهادي',
      certificateId,
      language: enrollment.course.language || 'ar'
    };

    // Create certificate record
    await prisma.certificate.create({
      data: {
        templateId: template.id,
        userId: enrollment.userId,
        enrollmentId: enrollment.id,
        certificateId,
        data: certificateData
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