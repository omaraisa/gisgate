'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2, Star } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <AnimatedBackground />
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
      <AnimatedBackground />

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

      <Footer />
    </div>
  );
}