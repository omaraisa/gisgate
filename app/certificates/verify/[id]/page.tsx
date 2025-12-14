'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { CheckCircle, XCircle, Calendar, Clock, User, BookOpen, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Footer from '../../../components/Footer';
import AnimatedBackground from '../../../components/AnimatedBackground';

interface CertificateVerification {
  valid: boolean;
  certificate?: {
    id: string;
    issuedAt: string;
    studentName: string;
    courseTitle: string;
    completedAt: string;
    duration?: string;
    instructor?: string;
    language: string;
  };
  error?: string;
}

export default function CertificateVerifyPage() {
  const params = useParams();
  const certificateId = params.id as string;
  const [verification, setVerification] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(true);

  const verifyTertificate = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/certificates/verify/${certificateId}`);
      const data = await response.json();
      setVerification(data);
    } catch {
      setVerification({
        valid: false,
        error: 'فشل في التحقق من الشهادة'
      });
    } finally {
      setLoading(false);
    }
  }, [certificateId]);

  useEffect(() => {
    if (certificateId) {
      verifyTertificate();
    }
  }, [certificateId, verifyTertificate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadCertificate = () => {
    window.open(`/certificates/${certificateId}?lang=ar`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        {/* Desktop Animated Background */}
        <div className="hidden md:block">
          <AnimatedBackground />
        </div>
        
        {/* Mobile Lightweight Background */}
        <div className="block md:hidden absolute inset-0 z-0">
          {/* Gradient Background using brand colors */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary-700/60 to-primary-600/40"></div>
          
          {/* Static Geometric Shapes using brand colors */}
          <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-secondary-400/20 to-secondary-500/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-40 left-8 w-24 h-24 bg-gradient-to-br from-primary-400/25 to-primary-500/25 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-secondary-600/15 to-secondary-700/15 rounded-full blur-2xl"></div>
          
          {/* Subtle Pattern Overlay */}
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="mobile-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <circle cx="30" cy="30" r="1" fill="rgba(173, 217, 0, 0.3)"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#mobile-grid)"/>
            </svg>
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-secondary-400 border-t-transparent rounded-full relative z-10"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Desktop Animated Background */}
      <div className="hidden md:block">
        <AnimatedBackground />
      </div>
      
      {/* Mobile Lightweight Background */}
      <div className="block md:hidden absolute inset-0 z-0">
        {/* Gradient Background using brand colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary-700/60 to-primary-600/40"></div>
        
        {/* Static Geometric Shapes using brand colors */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-secondary-400/20 to-secondary-500/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 left-8 w-24 h-24 bg-gradient-to-br from-primary-400/25 to-primary-500/25 rounded-full blur-lg"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-br from-secondary-600/15 to-secondary-700/15 rounded-full blur-2xl"></div>
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mobile-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <circle cx="30" cy="30" r="1" fill="rgba(173, 217, 0, 0.3)"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mobile-grid)"/>
          </svg>
        </div>
      </div>

      {/* Header */}
      <section className="relative z-10 pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-secondary-400 hover:text-secondary-300 transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة إلى الرئيسية
          </Link>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              التحقق من صحة الشهادة
            </h1>
            <p className="text-white/80 text-lg">
              تحقق من صحة شهادة إتمام الدورة
            </p>
          </div>

          {/* Verification Result */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8"
          >
            {!verification?.valid ? (
              <div className="text-center">
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-red-400 mb-4">
                  شهادة غير صحيحة
                </h2>
                <p className="text-white/70 mb-6">
                  {verification?.error || 'لم يتم العثور على الشهادة أو أنها غير صالحة'}
                </p>
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-200 text-sm">
                    <strong>رقم الشهادة:</strong> {certificateId}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center mb-8">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-green-400 mb-2">
                    شهادة صحيحة ومعتمدة
                  </h2>
                  <p className="text-white/70">
                    تم التحقق من صحة هذه الشهادة بنجاح
                  </p>
                </div>

                {/* Certificate Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white/5 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <User className="w-5 h-5 text-primary-400" />
                      <h3 className="font-semibold text-white">معلومات الطالب</h3>
                    </div>
                    <p className="text-white/80 text-lg">
                      {verification.certificate?.studentName}
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <BookOpen className="w-5 h-5 text-primary-400" />
                      <h3 className="font-semibold text-white">اسم الدورة</h3>
                    </div>
                    <p className="text-white/80 text-lg">
                      {verification.certificate?.courseTitle}
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Calendar className="w-5 h-5 text-primary-400" />
                      <h3 className="font-semibold text-white">تاريخ الإكمال</h3>
                    </div>
                    <p className="text-white/80">
                      {verification.certificate?.completedAt && formatDate(verification.certificate.completedAt)}
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Clock className="w-5 h-5 text-primary-400" />
                      <h3 className="font-semibold text-white">مدة الدورة</h3>
                    </div>
                    <p className="text-white/80">
                      {verification.certificate?.duration || 'غير محدد'}
                    </p>
                  </div>
                </div>

                {/* Certificate Info */}
                <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 border border-primary-500/30 rounded-lg p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/60">رقم الشهادة:</span>
                      <br />
                      <span className="text-white font-mono">{verification.certificate?.id}</span>
                    </div>
                    <div>
                      <span className="text-white/60">تاريخ الإصدار:</span>
                      <br />
                      <span className="text-white">
                        {verification.certificate?.issuedAt && formatDate(verification.certificate.issuedAt)}
                      </span>
                    </div>
                    {verification.certificate?.instructor && (
                      <div className="md:col-span-2">
                        <span className="text-white/60">المدرب:</span>
                        <br />
                        <span className="text-white">{verification.certificate.instructor}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Download Button */}
                <div className="text-center">
                  <button
                    onClick={downloadCertificate}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-300"
                  >
                    <Download className="w-5 h-5" />
                    تحميل الشهادة (PDF)
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}