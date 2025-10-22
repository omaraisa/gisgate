import { fabric } from 'fabric';
import QRCode from 'qrcode';
import { prisma } from './prisma';
import { generateCertificateFromCanvas } from './pdf-generator';

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
  // Use same fixed dimensions as certificate builder
  private static readonly CERT_WIDTH = 2000;
  private static readonly CERT_HEIGHT = 1414;

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

    // Create canvas and render certificate exactly like the builder
    const canvasDataUrl = await this.generateCertificateCanvas(template, data, qrCodeDataUrl);
    
    // Convert canvas to PDF using the same function as the builder
    const pdfBytes = await generateCertificateFromCanvas(canvasDataUrl);
    
    return Buffer.from(pdfBytes);
  }

  private static async generateCertificateCanvas(template: any, data: CertificateData, qrCodeDataUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create fabric canvas with FIXED certificate dimensions (same as builder)
      const canvasElement = fabric.util.createCanvasElement();
      canvasElement.width = this.CERT_WIDTH;
      canvasElement.height = this.CERT_HEIGHT;
      
      const canvas = new fabric.Canvas(canvasElement, {
        width: this.CERT_WIDTH,
        height: this.CERT_HEIGHT,
        backgroundColor: '#ffffff'
      });

      // Load background image
      fabric.Image.fromURL(template.backgroundImage, (backgroundImg) => {
        if (!backgroundImg) {
          reject(new Error('Failed to load background image'));
          return;
        }

        // Scale background to fit FIXED certificate dimensions (exactly like builder)
        const imgScale = Math.min(
          this.CERT_WIDTH / (backgroundImg.width || this.CERT_WIDTH), 
          this.CERT_HEIGHT / (backgroundImg.height || this.CERT_HEIGHT)
        );
        
        backgroundImg.set({
          left: 0,
          top: 0,
          scaleX: imgScale,
          scaleY: imgScale,
          selectable: false,
          evented: false
        });

        canvas.add(backgroundImg);
        canvas.sendToBack(backgroundImg);

        // Process fields
        const fields = this.processTemplateFields(template.fields);
        
        // Field coordinates are already in fixed certificate space (2000x1414)
        // No scaling needed - use coordinates directly
        
        let fieldsAdded = 0;
        const totalFields = fields.length;

        if (totalFields === 0) {
          // No fields to add, render immediately
          setTimeout(() => {
            const dataUrl = canvas.toDataURL({
              format: 'png',
              quality: 1.0
            });
            canvas.dispose();
            resolve(dataUrl);
          }, 100);
          return;
        }

        // Add each field to canvas (scaled to fixed dimensions)
        fields.forEach((field: CertificateField) => {
          const fieldContent = this.getFieldContentForCanvas(field, data, qrCodeDataUrl);
          
          if (field.type === 'QR_CODE') {
            // Add QR code as image
            fabric.Image.fromURL(qrCodeDataUrl, (qrImg) => {
              if (qrImg) {
                qrImg.set({
                  left: field.x,
                  top: field.y,
                  width: field.width || 120,
                  height: field.height || 120,
                  selectable: false,
                  evented: false,
                  angle: field.rotation || 0
                });
                canvas.add(qrImg);
              }
              
              fieldsAdded++;
              if (fieldsAdded === totalFields) {
                setTimeout(() => {
                  const dataUrl = canvas.toDataURL({
                    format: 'png',
                    quality: 1.0
                  });
                  canvas.dispose();
                  resolve(dataUrl);
                }, 100);
              }
            });
          } else {
            // Add text field (coordinates already in fixed cert space)
            const text = new fabric.Textbox(fieldContent, {
              left: field.x,
              top: field.y,
              fontSize: field.fontSize || 16,
              fontFamily: field.fontFamily || 'Arial',
              fill: field.color || '#000000',
              fontWeight: field.fontWeight || 'normal',
              textAlign: field.textAlign || 'left',
              selectable: false,
              evented: false,
              angle: field.rotation || 0,
              width: field.maxWidth
            });

            canvas.add(text);
            
            fieldsAdded++;
            if (fieldsAdded === totalFields) {
              setTimeout(() => {
                const dataUrl = canvas.toDataURL({
                  format: 'png',
                  quality: 1.0
                });
                canvas.dispose();
                resolve(dataUrl);
              }, 100);
            }
          }
        });
      });
    });
  }

  private static processTemplateFields(fields: any): CertificateField[] {
    if (Array.isArray(fields)) {
      return fields;
    } else if (typeof fields === 'object' && fields !== null) {
      // Convert old object format to array format
      return Object.entries(fields).map(([key, config]: [string, any]) => ({
        id: key,
        type: this.mapFieldKeyToType(key) as CertificateField['type'],
        x: config.x,
        y: config.y,
        fontSize: config.fontSize || 16,
        fontFamily: config.fontFamily || 'Arial',
        color: config.color || '#000000',
        textAlign: config.textAlign || 'left',
        maxWidth: config.maxWidth,
        width: config.width,
        height: config.height,
        fontWeight: config.fontWeight || 'normal',
        rotation: config.rotation || 0
      }));
    }
    return [];
  }

  private static getFieldContentForCanvas(field: CertificateField, data: CertificateData, qrCodeDataUrl: string): string {
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
        return '[QR]'; // QR code handled separately as image
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

    // Check if certificate already exists for this enrollment (regardless of language)
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

    // Create certificate record with template IDs for both languages
    const updateData: any = {
      userId: enrollment.userId,
      enrollmentId: enrollment.id,
      certificateId,
      data: certificateData as any
    };

    // Track which template was used for which language
    if (template.language === 'ar') {
      updateData.arTemplateId = template.id;
    } else if (template.language === 'en') {
      updateData.enTemplateId = template.id;
    }

    await prisma.certificate.create({
      data: updateData
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