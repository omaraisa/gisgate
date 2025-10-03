'use client';

import { useEffect, useState } from 'react';

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

interface CertificateCanvasWrapperProps {
  backgroundImage: string;
  backgroundWidth: number;
  backgroundHeight: number;
  fields: CertificateField[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onUpdateField: (id: string, updates: Partial<CertificateField>) => void;
  getFieldDisplayText: (field: CertificateField) => string;
  zoom: number;
}

export default function CertificateCanvasWrapper(props: CertificateCanvasWrapperProps) {
  const [CanvasComponent, setCanvasComponent] = useState<any>(null);

  useEffect(() => {
    // Only import on client side after mount
    import('./CertificateCanvas').then((mod) => {
      setCanvasComponent(() => mod.default);
    });
  }, []);

  if (!CanvasComponent) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-secondary-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">جاري تحميل المحرر...</p>
        </div>
      </div>
    );
  }

  return <CanvasComponent {...props} />;
}
