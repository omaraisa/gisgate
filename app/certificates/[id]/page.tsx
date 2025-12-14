'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import FabricCertificateCanvas from '@/app/admin/certificates/builder/FabricCertificateCanvas';
import { generateCertificateFromCanvas } from '@/lib/pdf-generator';

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

interface CertificateTemplate {
  id: string;
  name: string;
  language: string;
  backgroundImage: string;
  backgroundWidth: number;
  backgroundHeight: number;
  fields: CertificateField[];
}

interface CertificateData {
  studentName: string;
  courseTitle: string;
  completionDate: string;
  duration?: string;
  instructor?: string;
  certificateId: string;
  language: string;
}

// Extend window interface to include the export function
declare global {
  interface Window {
    exportCertificateCanvas?: () => string | null;
  }
}

const translations = {
  en: {
    certificateVerification: 'Certificate Verification',
    downloadPDF: 'Download PDF',
    generating: 'Generating...',
    certificateInformation: 'Certificate Information',
    studentName: 'Student Name:',
    courseTitle: 'Course Title:',
    completionDate: 'Completion Date:',
    certificateID: 'Certificate ID:',
    duration: 'Duration:',
    instructor: 'Instructor:',
    loadingCertificate: 'Loading certificate...',
    certificateNotFound: 'Certificate Not Found',
    certificateNotFoundDesc: 'The certificate you\'re looking for could not be found or may have been revoked.',
    noCertificateData: 'No certificate data found',
  },
  ar: {
    certificateVerification: 'التحقق من الشهادة',
    downloadPDF: 'تحميل PDF',
    generating: 'جاري التوليد...',
    certificateInformation: 'معلومات الشهادة',
    studentName: 'اسم الطالب:',
    courseTitle: 'عنوان الدورة:',
    completionDate: 'تاريخ الإنجاز:',
    certificateID: 'رقم الشهادة:',
    duration: 'المدة:',
    instructor: 'المدرب:',
    loadingCertificate: 'جاري تحميل الشهادة...',
    certificateNotFound: 'الشهادة غير موجودة',
    certificateNotFoundDesc: 'الشهادة التي تبحث عنها غير موجودة أو قد تم إلغاؤها.',
    noCertificateData: 'لا توجد بيانات شهادة',
  },
};

export default function CertificateViewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const certificateId = params.id as string;
  const language = searchParams.get('lang') || 'ar';
  const t = translations[language as keyof typeof translations] || translations.ar;

  const loadCertificateData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/certificates/${certificateId}/download?lang=${language}`);
      
      if (!response.ok) {
        throw new Error('Certificate not found');
      }

      const result = await response.json();
      setTemplate(result.template);
      setData(result.data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Certificate not found');
    } finally {
      setLoading(false);
    }
  }, [certificateId, language]);

  useEffect(() => {
    loadCertificateData();
  }, [certificateId, language, loadCertificateData]);

  const getFieldDisplayText = (field: CertificateField) => {
    if (!data) return '';
    
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
        return data.certificateId; // Pass certificate ID for QR generation
      default:
        return '';
    }
  };

  const downloadPDF = async () => {
    if (!template || !data) return;

    try {
      setDownloading(true);
      
      // Get canvas image from the Fabric canvas
      const canvasImageDataUrl = window.exportCertificateCanvas?.();
      if (!canvasImageDataUrl) {
        throw new Error('Failed to export canvas');
      }

      // Generate PDF
      const pdfBytes = await generateCertificateFromCanvas(canvasImageDataUrl);

      // Download PDF
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${certificateId}-${language}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch {
      setError('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">{t.loadingCertificate}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t.certificateNotFound}</h1>
          <p className="text-gray-600 mb-4">{t.certificateNotFoundDesc}</p>
          <p className="text-sm text-gray-500">Certificate ID: {certificateId}</p>
        </div>
      </div>
    );
  }

  if (!template || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <p className="text-gray-600">{t.noCertificateData}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 sticky top-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">{t.certificateVerification}</h1>
              <p className="text-sm text-gray-600">ID: {certificateId}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadPDF}
                disabled={downloading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {t.generating}
                  </>
                ) : (
                  <>
                    📄 {t.downloadPDF}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Certificate Display */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-center overflow-auto">
            <FabricCertificateCanvas
              backgroundImage={template.backgroundImage}
              fields={template.fields}
              selectedFieldId={null}
              onSelectField={() => {}}
              onUpdateField={() => {}}
              getFieldDisplayText={getFieldDisplayText}
              zoom={1.0}
              readOnly={true} // Lock all elements to prevent editing
            />
          </div>
        </div>

        {/* Certificate Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t.certificateInformation}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">{t.studentName}</span>
              <p className="text-gray-600">{data.studentName}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">{t.courseTitle}</span>
              <p className="text-gray-600">{data.courseTitle}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">{t.completionDate}</span>
              <p className="text-gray-600">{data.completionDate}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">{t.certificateID}</span>
              <p className="text-gray-600 font-mono">{data.certificateId}</p>
            </div>
            {data.duration && (
              <div>
                <span className="font-medium text-gray-700">{t.duration}</span>
                <p className="text-gray-600">{data.duration}</p>
              </div>
            )}
            {data.instructor && (
              <div>
                <span className="font-medium text-gray-700">{t.instructor}</span>
                <p className="text-gray-600">{data.instructor}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}