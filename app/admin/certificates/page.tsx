'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2, Star, Copy } from 'lucide-react';
import Footer from '../../components/Footer';
import AnimatedBackground from '../../components/AnimatedBackground';
import { CertificateField } from '@/lib/certificate-service';
import { useAuthStore } from '@/lib/stores/auth-store';

interface CertificateTemplate {
  id: string;
  name: string;
  language: string;
  backgroundImage: string;
  fields: CertificateField[] | Record<string, OldCertificateFieldConfig>;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OldCertificateFieldConfig {
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

export default function CertificateTemplatesPage() {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        window.location.href = '/auth';
        return;
      }

      const response = await fetch('/api/admin/certificates/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      } else {
        throw new Error('Failed to fetch templates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return;

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/admin/certificates/templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== id));
      } else {
        throw new Error('Failed to delete template');
      }
    } catch {
      alert('فشل في حذف القالب');
    }
  };

  const toggleDefault = async (id: string, currentIsDefault: boolean) => {
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/admin/certificates/templates/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isDefault: !currentIsDefault })
      });

      if (response.ok) {
        // Refetch all templates to ensure proper default state
        await fetchTemplates();
      } else {
        throw new Error('Failed to update template');
      }
    } catch {
      alert('فشل في تحديث القالب');
    }
  };

  const duplicateTemplate = async (template: CertificateTemplate) => {
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch('/api/admin/certificates/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `${template.name} (نسخة)`,
          language: template.language,
          backgroundImage: template.backgroundImage,
          fields: template.fields,
          isActive: false, // New template starts as inactive
          isDefault: false // New template is not default
        })
      });

      if (response.ok) {
        await fetchTemplates();
        alert('تم نسخ القالب بنجاح');
      } else {
        throw new Error('Failed to duplicate template');
      }
    } catch {
      alert('فشل في نسخ القالب');
    }
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
        <div className="max-w-6xl mx-auto">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-secondary-400 hover:text-secondary-300 transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة إلى لوحة التحكم
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">
                قوالب الشهادات
              </h1>
              <p className="text-white/80 text-lg">
                إنشاء وإدارة قوالب الشهادات للدورات
              </p>
            </div>

            <Link
              href="/admin/certificates/builder"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              إنشاء قالب جديد
            </Link>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-8">
              {error}
            </div>
          )}

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300"
              >
                <div className="relative aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={template.backgroundImage}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      template.language === 'ar' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-green-500 text-white'
                    }`}>
                      {template.language === 'ar' ? 'العربية' : 'English'}
                    </span>
                    {template.isDefault && (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500 text-white flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        افتراضي
                      </span>
                    )}
                  </div>
                  {!template.isActive && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-500 text-white">
                        غير نشط
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {template.name}
                  </h3>
                  <p className="text-white/60 text-sm mb-4">
                    {Array.isArray(template.fields) ? template.fields.length : 0} حقل • تم الإنشاء {new Date(template.createdAt).toLocaleDateString('ar-SA')}
                  </p>

                  <div className="flex gap-2">
                    <Link
                      href={`/admin/certificates/builder?edit=${template.id}`}
                      className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      تحرير
                    </Link>
                    
                    <button
                      onClick={() => duplicateTemplate(template)}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                      title="نسخ القالب"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => toggleDefault(template.id, template.isDefault)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                        template.isDefault 
                          ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                      title={template.isDefault ? 'إلغاء الافتراضي' : 'تعيين كافتراضي'}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {templates.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8">
                  <h3 className="text-xl font-semibold text-white mb-2">لا توجد قوالب شهادات</h3>
                  <p className="text-white/60 mb-4">ابدأ بإنشاء أول قالب شهادة للدورات</p>
                  <Link
                    href="/admin/certificates/builder"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-300"
                  >
                    <Plus className="w-5 h-5" />
                    إنشاء قالب جديد
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}