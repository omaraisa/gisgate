'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeftIcon, 
  DocumentArrowDownIcon, 
  EyeIcon, 
  CloudArrowUpIcon, 
  PlusIcon, 
  TrashIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon
} from '@heroicons/react/24/outline';
import FabricCertificateCanvas from './FabricCertificateCanvas';
import Footer from '../../../components/Footer';
import AnimatedBackground from '../../../components/AnimatedBackground';
import { useAuthStore } from '@/lib/stores/auth-store';
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
  id?: string;
  name: string;
  language: string;
  backgroundImage: string;
  backgroundWidth: number;  // Actual image dimensions
  backgroundHeight: number;
  fields: CertificateField[];
}

const FIELD_TYPES = [
  { type: 'STUDENT_NAME', label: 'اسم الطالب', defaultText: 'محمد أحمد علي' },
  { type: 'COURSE_TITLE', label: 'عنوان الدورة', defaultText: 'مقدمة في نظم المعلومات الجغرافية' },
  { type: 'COMPLETION_DATE', label: 'تاريخ الإكمال', defaultText: '15 سبتمبر 2025' },
  { type: 'DURATION', label: 'مدة الدورة', defaultText: '8 ساعات' },
  { type: 'INSTRUCTOR', label: 'المدرب', defaultText: 'عمر الهادي' },
  { type: 'CERTIFICATE_ID', label: 'رقم الشهادة', defaultText: 'CERT-2025-ABC123' },
  { type: 'QR_CODE', label: 'رمز QR', defaultText: '[QR]' }
];

// Default certificate dimensions (fixed for your template)
const DEFAULT_CERT_WIDTH = 2000;
const DEFAULT_CERT_HEIGHT = 1414;

export default function CertificateBuilderPage() {
  const [template, setTemplate] = useState<CertificateTemplate>({
    name: '',
    language: 'ar',
    backgroundImage: '',
    backgroundWidth: DEFAULT_CERT_WIDTH,
    backgroundHeight: DEFAULT_CERT_HEIGHT,
    fields: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load template for editing if edit parameter is provided
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
      setEditingTemplate(editId);
      loadTemplate(editId);
    }
  }, []);

  const loadTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/admin/certificates/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const loadedTemplate = data.template;
        
        // Ensure dimensions are set
        if (!loadedTemplate.backgroundWidth) loadedTemplate.backgroundWidth = DEFAULT_CERT_WIDTH;
        if (!loadedTemplate.backgroundHeight) loadedTemplate.backgroundHeight = DEFAULT_CERT_HEIGHT;
        
        setTemplate(loadedTemplate);
      } else {
        throw new Error('Failed to load template');
      }
    } catch (err) {
      alert('فشل في تحميل القالب');
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Always use fixed certificate dimensions regardless of uploaded image size
        setTemplate(prev => ({
          ...prev,
          backgroundImage: e.target?.result as string,
          backgroundWidth: DEFAULT_CERT_WIDTH,
          backgroundHeight: DEFAULT_CERT_HEIGHT
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addField = (fieldType: string) => {
    const newField: CertificateField = {
      id: `field-${Date.now()}`,
      type: fieldType as CertificateField['type'],
      x: 100, // Start closer to top-left for testing
      y: 100,
      fontSize: 48,
      fontFamily: template.language === 'ar' ? 'Arial' : 'Arial',
      color: '#000000',
      textAlign: 'center',
      width: fieldType === 'QR_CODE' ? 150 : undefined,
      height: fieldType === 'QR_CODE' ? 150 : undefined,
      fontWeight: 'bold',
      rotation: 0
    };

    setTemplate(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    setSelectedField(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<CertificateField>) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const deleteField = (fieldId: string) => {
    setTemplate(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
  };

  const saveTemplate = async () => {
    if (!template.name.trim()) {
      alert('يرجى إدخال اسم القالب');
      return;
    }

    if (!template.backgroundImage) {
      alert('يرجى رفع صورة خلفية للشهادة');
      return;
    }

    if (template.fields.length === 0) {
      alert('يرجى إضافة حقل واحد على الأقل');
      return;
    }

    try {
      setSaving(true);
      const token = useAuthStore.getState().token;
      
      const url = editingTemplate 
        ? `/api/admin/certificates/templates/${editingTemplate}`
        : '/api/admin/certificates/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: template.name,
          language: template.language,
          backgroundImage: template.backgroundImage,
          fields: template.fields,
          isActive: true
        })
      });

      if (response.ok) {
        const savedTemplate = await response.json();
        alert('تم حفظ القالب بنجاح');
        
        // If creating a new template, update the URL to edit mode but stay on the page
        if (!editingTemplate && savedTemplate.template?.id) {
          setEditingTemplate(savedTemplate.template.id);
          // Update the URL without refreshing the page
          window.history.pushState({}, '', `/admin/certificates/builder?edit=${savedTemplate.template.id}`);
        }
        // If editing existing template, just stay on the page
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save template');
      }
    } catch (err) {
      alert('فشل في حفظ القالب: ' + (err instanceof Error ? err.message : 'خطأ غير معروف'));
    } finally {
      setSaving(false);
    }
  };

  const getFieldDisplayText = (field: CertificateField) => {
    const fieldType = FIELD_TYPES.find(ft => ft.type === field.type);
    return fieldType?.defaultText || field.type;
  };

  const exportAsPDF = async () => {
    if (!template.backgroundImage) {
      alert('يرجى رفع صورة خلفية للشهادة');
      return;
    }

    try {
      setIsExporting(true);
      
      // Get canvas image from the Fabric canvas
      const canvasImageDataUrl = (window as any).exportCertificateCanvas?.();
      if (!canvasImageDataUrl) {
        throw new Error('Failed to export canvas');
      }

      // Generate PDF with fixed dimensions
      const pdfBytes = await generateCertificateFromCanvas(
        canvasImageDataUrl
      );

      // Download PDF
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.name || 'certificate'}-template.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('فشل في تصدير الشهادة: ' + (err instanceof Error ? err.message : 'خطأ غير معروف'));
    } finally {
      setIsExporting(false);
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
      <section className="relative z-10 pt-16 pb-4 px-4">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/admin/certificates"
            className="inline-flex items-center gap-2 text-secondary-400 hover:text-secondary-300 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            العودة إلى قوالب الشهادات
          </Link>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {editingTemplate ? 'تحرير قالب الشهادة' : 'منشئ قالب الشهادة'}
              </h1>
              <p className="text-white/80 text-sm">
                محرر دقيق بتقنية Canvas - الإحداثيات المحفوظة = PDF النهائي
              </p>
              {template.backgroundImage && (
                <p className="text-white/60 text-xs mt-1">
                  أبعاد الخلفية: {template.backgroundWidth} × {template.backgroundHeight} بكسل
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportAsPDF}
                disabled={isExporting || !template.backgroundImage}
                className="inline-flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-green-700 transition-all duration-300 disabled:opacity-50"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                {isExporting ? 'جاري التصدير...' : 'تصدير PDF'}
              </button>
              <button
                onClick={saveTemplate}
                disabled={saving}
                className="inline-flex items-center gap-1 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-300 disabled:opacity-50"
              >
                <CloudArrowUpIcon className="w-4 h-4" />
                {saving ? 'جاري الحفظ...' : 'حفظ القالب'}
              </button>
            </div>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] gap-4">
            {/* Left Panel - Template Settings & Field Types */}
            <div className="space-y-3">
              {/* Template Info */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-white mb-3">إعدادات القالب</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      اسم القالب
                    </label>
                    <input
                      type="text"
                      value={template.name}
                      onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-primary-400"
                      placeholder="مثال: شهادة إتمام عربية"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      اللغة
                    </label>
                    <select
                      value={template.language}
                      onChange={(e) => setTemplate(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-1 focus:ring-primary-400"
                    >
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-1">
                      صورة الخلفية
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center gap-1 px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white hover:bg-white/20 transition-colors"
                    >
                      <CloudArrowUpIcon className="w-3 h-3" />
                      {template.backgroundImage ? 'تغيير الصورة' : 'رفع صورة'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Field Types */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-white mb-2">أنواع الحقول</h3>
                
                <div className="space-y-1">
                  {FIELD_TYPES.map(fieldType => (
                    <button
                      key={fieldType.type}
                      onClick={() => addField(fieldType.type)}
                      className="w-full flex items-center gap-2 px-2 py-1 text-white/80 hover:bg-white/10 rounded transition-colors text-xs"
                    >
                      <PlusIcon className="w-3 h-3" />
                      {fieldType.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field Properties */}
              {selectedField && (() => {
                const field = template.fields.find(f => f.id === selectedField);
                if (!field) return null;

                return (
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3">
                    <h3 className="text-sm font-semibold text-white mb-3">خصائص الحقل</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-white/60 mb-1">النوع</label>
                        <div className="text-xs text-white/80 bg-white/10 px-2 py-1 rounded">
                          {FIELD_TYPES.find(ft => ft.type === field.type)?.label}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1">X</label>
                          <input
                            type="number"
                            value={Math.round(field.x)}
                            onChange={(e) => updateField(field.id, { x: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1">Y</label>
                          <input
                            type="number"
                            value={Math.round(field.y)}
                            onChange={(e) => updateField(field.id, { y: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                          />
                        </div>
                      </div>

                      {field.type !== 'QR_CODE' && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">حجم الخط</label>
                            <input
                              type="number"
                              value={field.fontSize}
                              onChange={(e) => updateField(field.id, { fontSize: parseInt(e.target.value) || 16 })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                              min="12"
                              max="200"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">نوع الخط</label>
                            <select
                              value={field.fontFamily}
                              onChange={(e) => updateField(field.id, { fontFamily: e.target.value })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            >
                              <option value="Arial">Arial</option>
                              <option value="Times New Roman">Times New Roman</option>
                              <option value="Courier New">Courier New</option>
                              <option value="Georgia">Georgia</option>
                              <option value="Verdana">Verdana</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">سماكة الخط</label>
                            <select
                              value={field.fontWeight}
                              onChange={(e) => updateField(field.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            >
                              <option value="normal">عادي</option>
                              <option value="bold">عريض</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">اللون</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={field.color}
                                onChange={(e) => updateField(field.id, { color: e.target.value })}
                                className="w-12 h-8 bg-white/10 border border-white/20 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={field.color}
                                onChange={(e) => updateField(field.id, { color: e.target.value })}
                                className="flex-1 px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">محاذاة</label>
                            <select
                              value={field.textAlign}
                              onChange={(e) => updateField(field.id, { textAlign: e.target.value as any })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            >
                              <option value="left">يسار</option>
                              <option value="center">وسط</option>
                              <option value="right">يمين</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">دوران (درجة)</label>
                            <input
                              type="number"
                              value={field.rotation || 0}
                              onChange={(e) => updateField(field.id, { rotation: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                              min="-180"
                              max="180"
                            />
                          </div>
                        </>
                      )}

                      {field.type === 'QR_CODE' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">العرض</label>
                            <input
                              type="number"
                              value={field.width || 150}
                              onChange={(e) => updateField(field.id, { width: parseInt(e.target.value) || 150 })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">الارتفاع</label>
                            <input
                              type="number"
                              value={field.height || 150}
                              onChange={(e) => updateField(field.id, { height: parseInt(e.target.value) || 150 })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => deleteField(field.id)}
                        className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
                      >
                        <TrashIcon className="w-3 h-3" />
                        حذف الحقل
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Center - Canvas */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">معاينة الشهادة</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}
                      className="p-1 bg-white/10 hover:bg-white/20 rounded transition-colors"
                      title="تصغير"
                    >
                      <MagnifyingGlassMinusIcon className="w-4 h-4 text-white" />
                    </button>
                    <span className="text-xs text-white/80 min-w-[60px] text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                      className="p-1 bg-white/10 hover:bg-white/20 rounded transition-colors"
                      title="تكبير"
                    >
                      <MagnifyingGlassPlusIcon className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height: '650px' }}>
                  {template.backgroundImage ? (
                    <FabricCertificateCanvas
                      backgroundImage={template.backgroundImage}
                      backgroundWidth={template.backgroundWidth}
                      backgroundHeight={template.backgroundHeight}
                      fields={template.fields}
                      selectedFieldId={selectedField}
                      onSelectField={setSelectedField}
                      onUpdateField={updateField}
                      getFieldDisplayText={getFieldDisplayText}
                      zoom={zoom}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-96 text-gray-400">
                      <div className="text-center">
                        <CloudArrowUpIcon className="w-12 h-12 mx-auto mb-2" />
                        <p>قم برفع صورة خلفية للشهادة</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            {/* Right Panel - Field Properties */}
            <div className="space-y-3">
              {selectedField && (() => {
                const field = template.fields.find(f => f.id === selectedField);
                if (!field) return (
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6 text-center">
                    <p className="text-white/60 text-sm">
                      اختر حقلاً لتعديل خصائصه
                    </p>
                  </div>
                );

                return (
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3">
                    <h3 className="text-sm font-semibold text-white mb-3">خصائص الحقل</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-white/60 mb-1">النوع</label>
                        <div className="text-xs text-white/80 bg-white/10 px-2 py-1 rounded">
                          {FIELD_TYPES.find(ft => ft.type === field.type)?.label}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1">X</label>
                          <input
                            type="number"
                            value={Math.round(field.x)}
                            onChange={(e) => updateField(field.id, { x: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1">Y</label>
                          <input
                            type="number"
                            value={Math.round(field.y)}
                            onChange={(e) => updateField(field.id, { y: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                          />
                        </div>
                      </div>

                      {field.type !== 'QR_CODE' && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">حجم الخط</label>
                            <input
                              type="number"
                              value={field.fontSize}
                              onChange={(e) => updateField(field.id, { fontSize: parseInt(e.target.value) || 16 })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                              min="12"
                              max="200"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">نوع الخط</label>
                            <select
                              value={field.fontFamily}
                              onChange={(e) => updateField(field.id, { fontFamily: e.target.value })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            >
                              <option value="Arial">Arial</option>
                              <option value="Times New Roman">Times New Roman</option>
                              <option value="Courier New">Courier New</option>
                              <option value="Georgia">Georgia</option>
                              <option value="Verdana">Verdana</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">سماكة الخط</label>
                            <select
                              value={field.fontWeight}
                              onChange={(e) => updateField(field.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            >
                              <option value="normal">عادي</option>
                              <option value="bold">عريض</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">اللون</label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={field.color}
                                onChange={(e) => updateField(field.id, { color: e.target.value })}
                                className="w-12 h-8 bg-white/10 border border-white/20 rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={field.color}
                                onChange={(e) => updateField(field.id, { color: e.target.value })}
                                className="flex-1 px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">محاذاة</label>
                            <select
                              value={field.textAlign}
                              onChange={(e) => updateField(field.id, { textAlign: e.target.value as any })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            >
                              <option value="left">يسار</option>
                              <option value="center">وسط</option>
                              <option value="right">يمين</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">دوران (درجة)</label>
                            <input
                              type="number"
                              value={field.rotation || 0}
                              onChange={(e) => updateField(field.id, { rotation: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                              min="-180"
                              max="180"
                            />
                          </div>
                        </>
                      )}

                      {field.type === 'QR_CODE' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">العرض</label>
                            <input
                              type="number"
                              value={field.width || 150}
                              onChange={(e) => updateField(field.id, { width: parseInt(e.target.value) || 150 })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">الارتفاع</label>
                            <input
                              type="number"
                              value={field.height || 150}
                              onChange={(e) => updateField(field.id, { height: parseInt(e.target.value) || 150 })}
                              className="w-full px-2 py-1 text-xs bg-white/10 border border-white/20 rounded text-white"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => deleteField(field.id)}
                        className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
                      >
                        <TrashIcon className="w-3 h-3" />
                        حذف الحقل
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
