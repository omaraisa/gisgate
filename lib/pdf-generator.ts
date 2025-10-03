import { PDFDocument, rgb, degrees } from 'pdf-lib';

interface CertificateField {
  id: string;
  type: 'STUDENT_NAME' | 'COURSE_TITLE' | 'COMPLETION_DATE' | 'DURATION' | 'INSTRUCTOR' | 'CERTIFICATE_ID' | 'QR_CODE';
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  maxWidth?: number;
  width?: number;
  height?: number;
  fontWeight?: 'normal' | 'bold';
  rotation?: number;
}

interface CertificateData {
  studentName: string;
  courseTitle: string;
  completionDate: string;
  duration: string;
  instructor: string;
  certificateId: string;
  qrCodeUrl?: string;
}

// Convert hex color to RGB values
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

// Get field value based on type
function getFieldValue(field: CertificateField, data: CertificateData): string {
  switch (field.type) {
    case 'STUDENT_NAME': return data.studentName;
    case 'COURSE_TITLE': return data.courseTitle;
    case 'COMPLETION_DATE': return data.completionDate;
    case 'DURATION': return data.duration;
    case 'INSTRUCTOR': return data.instructor;
    case 'CERTIFICATE_ID': return data.certificateId;
    case 'QR_CODE': return '[QR CODE]';
    default: return '';
  }
}

export async function generateCertificatePDF(
  backgroundImageDataUrl: string,
  backgroundWidth: number,
  backgroundHeight: number,
  fields: CertificateField[],
  certificateData: CertificateData
): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Calculate page dimensions (convert pixels to points - 72 points per inch)
  const pageWidth = (backgroundWidth * 72) / 300; // Assuming 300 DPI
  const pageHeight = (backgroundHeight * 72) / 300;
  
  // Add a page with exact dimensions
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Embed the background image
  const backgroundImage = await pdfDoc.embedPng(backgroundImageDataUrl);
  
  // Draw the background image at full size
  page.drawImage(backgroundImage, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  });
  
  // Convert pixel coordinates to PDF coordinates
  const pixelToPoint = (pixel: number) => (pixel * 72) / 300;
  
  // Add text fields
  for (const field of fields) {
    if (field.type === 'QR_CODE') {
      // Skip QR codes for now - would need QR generation library
      continue;
    }
    
    const text = getFieldValue(field, certificateData);
    if (!text) continue;
    
    // Convert coordinates (PDF origin is bottom-left, our origin is top-left)
    const x = pixelToPoint(field.x);
    const y = pageHeight - pixelToPoint(field.y); // Flip Y coordinate
    const fontSize = pixelToPoint(field.fontSize);
    
    // Get color
    const color = hexToRgb(field.color);
    
    // Draw text
    page.drawText(text, {
      x: x,
      y: y,
      size: fontSize,
      color: rgb(color.r, color.g, color.b),
      rotate: field.rotation ? degrees(field.rotation) : degrees(0),
    });
  }
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

export async function generateCertificateFromCanvas(
  canvasImageDataUrl: string,
  backgroundWidth: number,
  backgroundHeight: number
): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Calculate page dimensions (convert pixels to points - 72 points per inch)
  const pageWidth = (backgroundWidth * 72) / 300; // Assuming 300 DPI
  const pageHeight = (backgroundHeight * 72) / 300;
  
  // Add a page with exact dimensions
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Embed the canvas image (which includes background + all fields)
  const canvasImage = await pdfDoc.embedPng(canvasImageDataUrl);
  
  // Draw the canvas image at full size
  page.drawImage(canvasImage, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  });
  
  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}