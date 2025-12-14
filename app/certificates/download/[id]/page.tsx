'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import FabricCertificateCanvas from '@/app/admin/certificates/builder/FabricCertificateCanvas';
import { generateCertificateFromCanvas } from '@/lib/pdf-generator';

// Extend window interface to include the export function
declare global {
  interface Window {
    exportCertificateCanvas?: () => string | null;
  }
}

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

export default function CertificateDownloadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [template, setTemplate] = useState<CertificateTemplate | null>(null);
  const [data, setData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const certificateId = params.id as string;
  const language = searchParams.get('lang') || 'ar';

  const loadCertificateData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/certificates/${certificateId}/download?lang=${language}`);
      
      if (!response.ok) {
        throw new Error('Failed to load certificate data');
      }

      const result = await response.json();
      setTemplate(result.template);
      setData(result.data);
      
      // Don't auto-download - let user preview first
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
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
        return '[QR]';
      default:
        return '';
    }
  };

  const downloadPDF = async () => {
    if (!template || !data) return;

    try {
      setDownloading(true);
      
      // Get canvas image from the Fabric canvas (same as certificate builder)
      const canvasImageDataUrl = window.exportCertificateCanvas?.();
      if (!canvasImageDataUrl) {
        throw new Error('Failed to export canvas');
      }

      // Generate PDF with fixed dimensions (same as certificate builder)
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
      
      // Redirect back after download
      setTimeout(() => {
        try {
          window.close();
        } catch {
          window.location.href = '/profile';
        }
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الشهادة...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => {
              try {
                window.close();
              } catch {
                window.location.href = '/profile';
              }
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  if (!template || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">لا توجد بيانات شهادة</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Fixed Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4 sticky top-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">معاينة الشهادة</h1>
              <p className="text-sm text-gray-600">
                {downloading ? 'جاري إنشاء ملف PDF...' : 'يمكنك معاينة الشهادة وتحميلها كملف PDF'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  try {
                    window.close();
                  } catch {
                    window.history.back();
                  }
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                إغلاق
              </button>
              {downloading ? (
                <div className="flex items-center px-6 py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent mr-2"></div>
                  جاري التحميل...
                </div>
              ) : (
                <button
                  onClick={downloadPDF}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  📄 تحميل PDF
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Certificate Preview */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-center overflow-auto">
            <FabricCertificateCanvas
              backgroundImage={template.backgroundImage}
              fields={template.fields}
              selectedFieldId={null}
              onSelectField={() => {}} // Disabled for download view
              onUpdateField={() => {}} // Disabled for download view
              getFieldDisplayText={getFieldDisplayText}
              zoom={1.0} // Full size for proper preview
              readOnly={true} // Lock all elements to prevent editing
            />
          </div>
        </div>
      </div>
    </div>
  );
}