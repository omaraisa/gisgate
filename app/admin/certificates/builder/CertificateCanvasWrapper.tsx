'use client';

import { useEffect, useState } from 'react';

import type { CertificateCanvasProps } from './CertificateCanvas';

export default function CertificateCanvasWrapper(props: CertificateCanvasProps) {
  const [CanvasComponent, setCanvasComponent] = useState<React.ComponentType<CertificateCanvasProps> | null>(null);

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
