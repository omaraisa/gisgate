'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserRole, PaymentStatus } from '@prisma/client';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, X, CheckCircle, XCircle, CreditCard, BookOpen, Award } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth-store';

interface Enrollment {
  id: string;
  enrolledAt: string;
  completedAt?: string;
  progress: number;
  isCompleted: boolean;
  course: {
    id: string;
    title: string;
    titleEnglish?: string;
    slug: string;
    price?: number;
    currency?: string;
    isFree: boolean;
  };
  certificates: {
    id: string;
    certificateId: string;
    createdAt: string;
  }[];
}

interface Certificate {
  id: string;
  certificateId: string;
  createdAt: string;
  enrollment: {
    course: {
      id: string;
      title: string;
      titleEnglish?: string;
      slug: string;
    };
  };
  template: {
    name: string;
    language: string;
  };
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paypalOrderId?: string;
  createdAt: string;
  paidAt?: string;
  course: {
    id: string;
    title: string;
    titleEnglish?: string;
    price?: number;
    currency?: string;
  };
}

interface UserDetails {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullNameArabic?: string;
  fullNameEnglish?: string;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  wordpressId?: number;
  enrollments: Enrollment[];
  certificates: Certificate[];
  payments: Payment[];
}

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'enrollments' | 'certificates' | 'payments'>('overview');

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    if (!user) return;

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      setUser({ ...user, role: newRole });
      alert('User role updated successfully');
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  const handleStatusChange = async (isActive: boolean) => {
    if (!user) return;

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      setUser({ ...user, isActive });
      alert(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    if (!confirm('هل أنت متأكد من إزالة هذا التسجيل؟ سيتم حذف جميع البيانات المرتبطة به.')) return;

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove enrollment');
      }

      // Refresh user details
      await fetchUserDetails();
      alert('تم إزالة التسجيل بنجاح');
    } catch (err) {
      alert('فشل في إزالة التسجيل');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل تفاصيل المستخدم...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">خطأ</h1>
          <p className="text-gray-600">{error || 'المستخدم غير موجود'}</p>
          <Link
            href="/admin/users"
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            العودة إلى قائمة المستخدمين
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة إلى قائمة المستخدمين
          </Link>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-bold">
                  {(user.fullNameArabic || user.fullNameEnglish || user.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user.fullNameArabic || user.fullNameEnglish || 'بدون اسم'}
                  </h1>
                  <p className="text-gray-600">{user.email}</p>
                  {user.username && <p className="text-sm text-gray-500">@{user.username}</p>}
                </div>
              </div>

              <div className="flex gap-2">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={UserRole.ADMIN}>مدير</option>
                  <option value={UserRole.EDITOR}>محرر</option>
                  <option value={UserRole.AUTHOR}>كاتب</option>
                  <option value={UserRole.USER}>مستخدم</option>
                </select>

                <button
                  onClick={() => handleStatusChange(!user.isActive)}
                  className={`px-4 py-2 rounded-md text-white ${
                    user.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {user.isActive ? 'تعطيل' : 'تفعيل'}
                </button>
              </div>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">التسجيلات</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-1">{user.enrollments.length}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">الشهادات</span>
                </div>
                <p className="text-2xl font-bold text-green-600 mt-1">{user.certificates.length}</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">المدفوعات</span>
                </div>
                <p className="text-2xl font-bold text-purple-600 mt-1">{user.payments.length}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">تاريخ الانضمام</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{new Date(user.createdAt).toLocaleDateString('ar-SA')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                نظرة عامة
              </button>
              <button
                onClick={() => setActiveTab('enrollments')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'enrollments'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                التسجيلات ({user.enrollments.length})
              </button>
              <button
                onClick={() => setActiveTab('certificates')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'certificates'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                الشهادات ({user.certificates.length})
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'payments'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                المدفوعات ({user.payments.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات شخصية</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">الاسم الكامل (عربي)</dt>
                      <dd className="text-sm text-gray-900">{user.fullNameArabic || 'غير محدد'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">الاسم الكامل (إنجليزي)</dt>
                      <dd className="text-sm text-gray-900">{user.fullNameEnglish || 'غير محدد'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">الاسم الأول</dt>
                      <dd className="text-sm text-gray-900">{user.firstName || 'غير محدد'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">اسم العائلة</dt>
                      <dd className="text-sm text-gray-900">{user.lastName || 'غير محدد'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">حالة البريد الإلكتروني</dt>
                      <dd className="text-sm text-gray-900">
                        {user.emailVerified ? (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            مؤكد
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            غير مؤكد
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">معلومات الحساب</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">معرف المستخدم</dt>
                      <dd className="text-sm text-gray-900 font-mono">{user.id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">الدور</dt>
                      <dd className="text-sm text-gray-900">{user.role}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">الحالة</dt>
                      <dd className="text-sm text-gray-900">
                        {user.isActive ? (
                          <span className="text-green-600">نشط</span>
                        ) : (
                          <span className="text-red-600">غير نشط</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">آخر دخول</dt>
                      <dd className="text-sm text-gray-900">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString('ar-SA') : 'لم يدخل بعد'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">تاريخ الانضمام</dt>
                      <dd className="text-sm text-gray-900">{new Date(user.createdAt).toLocaleString('ar-SA')}</dd>
                    </div>
                    {user.wordpressId && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">معرف ووردبريس</dt>
                        <dd className="text-sm text-gray-900">{user.wordpressId}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}

            {activeTab === 'enrollments' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">التسجيلات في الكورسات</h3>
                {user.enrollments.length === 0 ? (
                  <p className="text-gray-500">لا توجد تسجيلات</p>
                ) : (
                  <div className="space-y-4">
                    {user.enrollments.map((enrollment) => (
                      <div key={enrollment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <Link
                              href={`/courses/${enrollment.course.slug}`}
                              className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                              target="_blank"
                            >
                              {enrollment.course.title}
                            </Link>
                            {enrollment.course.titleEnglish && (
                              <p className="text-sm text-gray-600">{enrollment.course.titleEnglish}</p>
                            )}
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600">
                                تاريخ التسجيل: {new Date(enrollment.enrolledAt).toLocaleDateString('ar-SA')}
                              </p>
                              <p className="text-sm text-gray-600">
                                التقدم: {enrollment.progress}%
                              </p>
                              <p className="text-sm text-gray-600">
                                الحالة: {enrollment.isCompleted ? 'مكتمل' : 'قيد التقدم'}
                              </p>
                              {enrollment.certificates.length > 0 && (
                                <p className="text-sm text-green-600">
                                  شهادة: {enrollment.certificates[0].certificateId}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveEnrollment(enrollment.id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            إزالة التسجيل
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'certificates' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">الشهادات المحصلة</h3>
                {user.certificates.length === 0 ? (
                  <p className="text-gray-500">لا توجد شهادات</p>
                ) : (
                  <div className="space-y-4">
                    {user.certificates.map((certificate) => (
                      <div key={certificate.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold">{certificate.enrollment.course.title}</p>
                            <p className="text-sm text-gray-600">معرف الشهادة: {certificate.certificateId}</p>
                            <p className="text-sm text-gray-600">
                              القالب: {certificate.template.name} ({certificate.template.language === 'ar' ? 'عربي' : 'إنجليزي'})
                            </p>
                            <p className="text-sm text-gray-600">
                              تاريخ الإصدار: {new Date(certificate.createdAt).toLocaleDateString('ar-SA')}
                            </p>
                          </div>
                          <Link
                            href={`/certificates/${certificate.certificateId}`}
                            target="_blank"
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            عرض الشهادة
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">سجل المدفوعات</h3>
                {user.payments.length === 0 ? (
                  <p className="text-gray-500">لا توجد مدفوعات</p>
                ) : (
                  <div className="space-y-4">
                    {user.payments.map((payment) => (
                      <div key={payment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold">{payment.course.title}</p>
                            <p className="text-sm text-gray-600">
                              المبلغ: {payment.amount} {payment.currency}
                            </p>
                            <p className="text-sm text-gray-600">
                              الحالة: {
                                payment.status === 'COMPLETED' ? 'مكتمل' :
                                payment.status === 'PENDING' ? 'معلق' :
                                payment.status === 'FAILED' ? 'فاشل' :
                                payment.status === 'CANCELLED' ? 'ملغي' : payment.status
                              }
                            </p>
                            <p className="text-sm text-gray-600">
                              تاريخ الطلب: {new Date(payment.createdAt).toLocaleDateString('ar-SA')}
                            </p>
                            {payment.paidAt && (
                              <p className="text-sm text-gray-600">
                                تاريخ الدفع: {new Date(payment.paidAt).toLocaleDateString('ar-SA')}
                              </p>
                            )}
                          </div>
                          {payment.paypalOrderId && (
                            <span className="text-xs text-gray-500">PayPal: {payment.paypalOrderId}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}