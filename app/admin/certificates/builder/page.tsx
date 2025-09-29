'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Upload, Plus, Trash2, Move, Type, Image, QrCode } from 'lucide-react';
import Footer from '../../../components/Footer';
import AnimatedBackground from '../../../components/AnimatedBackground';

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
  fields: CertificateField[];
}

const FIELD_TYPES = [
  { type: 'STUDENT_NAME', label: 'اسم الطالب', icon: Type, defaultText: 'محمد أحمد علي' },
  { type: 'COURSE_TITLE', label: 'عنوان الدورة', icon: Type, defaultText: 'مقدمة في نظم المعلومات الجغرافية' },
  { type: 'COMPLETION_DATE', label: 'تاريخ الإكمال', icon: Type, defaultText: '15 سبتمبر 2025' },
  { type: 'DURATION', label: 'مدة الدورة', icon: Type, defaultText: '8 ساعات' },
  { type: 'INSTRUCTOR', label: 'المدرب', icon: Type, defaultText: 'عمر الهادي' },
  { type: 'CERTIFICATE_ID', label: 'رقم الشهادة', icon: Type, defaultText: 'CERT-2025-ABC123' },
  { type: 'QR_CODE', label: 'رمز QR', icon: QrCode, defaultText: '[QR CODE]' }
];

export default function CertificateBuilderPage() {
  const [template, setTemplate] = useState<CertificateTemplate>({
    name: '',
    language: 'ar',
    backgroundImage: '',
    fields: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
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
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await fetch(`/api/admin/certificates/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplate(data.template);
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
        setTemplate(prev => ({
          ...prev,
          backgroundImage: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addField = (fieldType: string) => {
    const getDefaultMaxWidth = (type: string) => {
      switch (type) {
        case 'COURSE_TITLE': return 700; // Wider for course titles
        case 'STUDENT_NAME': return 500;
        case 'QR_CODE': return undefined;
        default: return 400;
      }
    };

    const newField: CertificateField = {
      id: `field-${Date.now()}`,
      type: fieldType as CertificateField['type'],
      x: 400,
      y: 200,
      fontSize: 24,
      fontFamily: template.language === 'ar' ? 'Kufi' : 'Kufi',
      color: '#000000',
      textAlign: 'center',
      maxWidth: getDefaultMaxWidth(fieldType),
      width: fieldType === 'QR_CODE' ? 120 : undefined,
      height: fieldType === 'QR_CODE' ? 120 : undefined,
      fontWeight: 'normal'
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
      fields: (Array.isArray(prev.fields) ? prev.fields : []).map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const deleteField = (fieldId: string) => {
    setTemplate(prev => ({
      ...prev,
      fields: (Array.isArray(prev.fields) ? prev.fields : []).filter(field => field.id !== fieldId)
    }));
    if (selectedField === fieldId) {
      setSelectedField(null);
    }
  };

  const handleFieldDrag = (fieldId: string, x: number, y: number) => {
    updateField(fieldId, { x, y });
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

    const fields = Array.isArray(template.fields) ? template.fields : [];
    if (fields.length === 0) {
      alert('يرجى إضافة حقل واحد على الأقل');
      return;
    }

    try {
      setSaving(true);
      const sessionToken = localStorage.getItem('sessionToken');
      
      const url = editingTemplate 
        ? `/api/admin/certificates/templates/${editingTemplate}`
        : '/api/admin/certificates/templates';
      
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          name: template.name,
          language: template.language,
          backgroundImage: template.backgroundImage,
          fields: template.fields
        })
      });

      if (response.ok) {
        alert('تم حفظ القالب بنجاح');
        window.location.href = '/admin/certificates';
      } else {
        throw new Error('Failed to save template');
      }
    } catch (err) {
      alert('فشل في حفظ القالب');
    } finally {
      setSaving(false);
    }
  };

  const getFieldDisplayText = (field: CertificateField) => {
    const fieldType = FIELD_TYPES.find(ft => ft.type === field.type);
    return fieldType?.defaultText || field.type;
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
            <ArrowLeft className="w-4 h-4" />
            العودة إلى قوالب الشهادات
          </Link>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {editingTemplate ? 'تحرير قالب الشهادة' : 'منشئ قالب الشهادة'}
              </h1>
              <p className="text-white/80 text-sm">
                قم بإنشاء وتخصيص قوالب الشهادات بسحب وإفلات الحقول
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={saveTemplate}
                disabled={saving}
                className="inline-flex items-center gap-1 bg-gradient-to-r from-primary-600 to-secondary-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-300 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'جاري الحفظ...' : 'حفظ القالب'}
              </button>
            </div>
          </div>

          {/* Template Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
            {/* Left Panel - Settings */}
            <div className="lg:col-span-1 space-y-3">
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
                      <Upload className="w-3 h-3" />
                      {template.backgroundImage ? 'تغيير الصورة' : 'رفع صورة'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Field Types */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-white mb-2">أنواع الحقول</h3>
                
                <div className="space-y-1">
                  {FIELD_TYPES.map(fieldType => {
                    const Icon = fieldType.icon;
                    return (
                      <button
                        key={fieldType.type}
                        onClick={() => addField(fieldType.type)}
                        className="w-full flex items-center gap-2 px-2 py-1 text-white/80 hover:bg-white/10 rounded transition-colors text-xs"
                      >
                        <Icon className="w-3 h-3" />
                        {fieldType.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field Properties */}
              {selectedField && (
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">خصائص الحقل</h3>
                  
                  {(() => {
                    const fields = Array.isArray(template.fields) ? template.fields : [];
                    const field = fields.find(f => f.id === selectedField);
                    if (!field) return null;

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">X</label>
                            <input
                              type="number"
                              value={field.x}
                              onChange={(e) => updateField(field.id, { x: parseInt(e.target.value) })}
                              className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">Y</label>
                            <input
                              type="number"
                              value={field.y}
                              onChange={(e) => updateField(field.id, { y: parseInt(e.target.value) })}
                              className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1">حجم الخط</label>
                          <input
                            type="number"
                            value={field.fontSize || 16}
                            onChange={(e) => updateField(field.id, { fontSize: parseInt(e.target.value) || 16 })}
                            className="w-full px-2 py-1 text-sm bg-white/10 border border-white/20 rounded text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1">اللون</label>
                          <input
                            type="color"
                            value={field.color || '#000000'}
                            onChange={(e) => updateField(field.id, { color: e.target.value })}
                            className="w-full h-8 bg-white/10 border border-white/20 rounded"
                          />
                        </div>

                        {field.type !== 'QR_CODE' && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-medium text-white/60">عرض النص الأقصى</label>
                              <button
                                onClick={() => updateField(field.id, { maxWidth: 900 })}
                                className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                عرض كامل
                              </button>
                            </div>
                            <input
                              type="number"
                              value={field.maxWidth || 400}
                              onChange={(e) => updateField(field.id, { maxWidth: parseInt(e.target.value) })}
                              className="w-full px-1 py-0.5 text-xs bg-white/10 border border-white/20 rounded text-white"
                              placeholder="400"
                            />
                            <div className="flex gap-1 mt-1">
                              <button
                                onClick={() => updateField(field.id, { maxWidth: 300 })}
                                className="flex-1 px-1 py-0.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                              >
                                صغير
                              </button>
                              <button
                                onClick={() => updateField(field.id, { maxWidth: 500 })}
                                className="flex-1 px-1 py-0.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                              >
                                متوسط
                              </button>
                              <button
                                onClick={() => updateField(field.id, { maxWidth: 700 })}
                                className="flex-1 px-1 py-0.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                              >
                                كبير
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">نوع الخط</label>
                            <select
                              value={field.fontFamily || 'Kufi'}
                              onChange={(e) => updateField(field.id, { fontFamily: e.target.value })}
                              className="w-full px-1 py-0.5 text-xs bg-white/10 border border-white/20 rounded text-white"
                            >
                              <option value="Kufi">كوفي</option>
                              <option value="Arial">Arial</option>
                              <option value="Times New Roman">Times</option>
                              <option value="Calibri">Calibri</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-white/60 mb-1">سماكة الخط</label>
                            <select
                              value={field.fontWeight || 'normal'}
                              onChange={(e) => updateField(field.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
                              className="w-full px-1 py-0.5 text-xs bg-white/10 border border-white/20 rounded text-white"
                            >
                              <option value="normal">عادي</option>
                              <option value="bold">عريض</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-white/60 mb-1">محاذاة</label>
                          <select
                            value={field.textAlign || 'left'}
                            onChange={(e) => updateField(field.id, { textAlign: e.target.value as any })}
                            className="w-full px-1 py-0.5 text-xs bg-white/10 border border-white/20 rounded text-white"
                          >
                            <option value="left">يسار</option>
                            <option value="center">وسط</option>
                            <option value="right">يمين</option>
                          </select>
                        </div>

                        <button
                          onClick={() => deleteField(field.id)}
                          className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          حذف الحقل
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Main Canvas */}
            <div className="lg:col-span-3">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">معاينة الشهادة</h3>
                
                <div 
                  ref={canvasRef}
                  className="relative w-full aspect-[4/3] bg-white border border-gray-300 rounded-lg overflow-hidden"
                  style={{
                    backgroundImage: template.backgroundImage ? `url(${template.backgroundImage})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {!template.backgroundImage && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Upload className="w-12 h-12 mx-auto mb-2" />
                        <p>قم برفع صورة خلفية للشهادة</p>
                      </div>
                    </div>
                  )}

                  {(Array.isArray(template.fields) ? template.fields : []).map(field => (
                    <div
                      key={field.id}
                      className={`absolute cursor-move select-none ${
                        selectedField === field.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      style={{
                        left: `${(field.x / 1000) * 100}%`,
                        top: `${(field.y / 600) * 100}%`,
                        fontSize: `${(field.fontSize || 16) * 0.8}px`,
                        color: field.color || '#000000',
                        textAlign: field.textAlign || 'left',
                        maxWidth: field.type !== 'QR_CODE' && field.maxWidth ? `${Math.min(field.maxWidth * 0.8, 720)}px` : 'auto',
                        fontFamily: field.fontFamily || 'Kufi',
                        fontWeight: field.fontWeight || 'normal',
                        transform: field.rotation ? `rotate(${field.rotation}deg)` : undefined,
                        whiteSpace: field.type !== 'QR_CODE' ? 'nowrap' : 'normal',
                        overflow: field.type !== 'QR_CODE' ? 'visible' : 'hidden'
                      }}
                      onClick={() => setSelectedField(field.id)}
                      onMouseDown={(e) => {
                        const canvas = canvasRef.current;
                        if (!canvas) return;

                        const rect = canvas.getBoundingClientRect();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startFieldX = field.x;
                        const startFieldY = field.y;

                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const deltaX = moveEvent.clientX - startX;
                          const deltaY = moveEvent.clientY - startY;
                          
                          const newX = Math.max(0, Math.min(1000, startFieldX + (deltaX / rect.width) * 1000));
                          const newY = Math.max(0, Math.min(600, startFieldY + (deltaY / rect.height) * 600));
                          
                          handleFieldDrag(field.id, newX, newY);
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}
                    >
                      {field.type === 'QR_CODE' ? (
                        <div 
                          className="bg-black/20 border-2 border-dashed border-gray-400 flex items-center justify-center text-xs font-bold"
                          style={{
                            width: field.width ? `${field.width * 0.8}px` : '96px',
                            height: field.height ? `${field.height * 0.8}px` : '96px'
                          }}
                        >
                          QR
                        </div>
                      ) : (
                        <span style={{ 
                          fontFamily: field.fontFamily || 'Kufi',
                          fontWeight: field.fontWeight || 'normal'
                        }}>
                          {getFieldDisplayText(field)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}