'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  username?: string;
  fullNameArabic?: string;
  fullNameEnglish?: string;
  bio?: string;
  website?: string;
  avatar?: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

interface CourseProgress {
  percentage: number;
  completedLessons: number;
  totalLessons: number;
  totalWatchTime: number;
}

interface Lesson {
  id: string;
  title: string;
  slug: string;
  duration?: string;
  order: number;
  watchedTime: number;
  isCompleted: boolean;
  completedAt?: string;
  lastWatchedAt: string;
}

interface Certificate {
  id: string;
  certificateId: string;
  templateName: string;
  language: string;
  earnedAt: string;
}

interface EnrolledCourse {
  id: string;
  title: string;
  titleEnglish?: string;
  slug: string;
  description?: string;
  excerpt?: string;
  featuredImage?: string;
  category?: string;
  level: string;
  language?: string;
  enrolledAt: string;
  completedAt?: string;
  isCompleted: boolean;
  progress: CourseProgress;
  lessons: Lesson[];
  certificates: Certificate[];
}

interface LearningStatistics {
  totalEnrolledCourses: number;
  completedCourses: number;
  totalLessonsCompleted: number;
  totalLessonsWatched: number;
  totalWatchTime: number;
  certificatesEarned: number;
  completionRate: number;
}

interface LearningProfile {
  enrolledCourses: EnrolledCourse[];
  statistics: LearningStatistics;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'password'>('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    fullNameArabic: '',
    fullNameEnglish: '',
    username: '',
    bio: '',
    website: '',
    avatar: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const router = useRouter();

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth');
        return;
      }

      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth-change'));
          router.push('/auth');
          return;
        }
        throw new Error('Failed to fetch profile');
      }

      const response_data = await response.json();
      const userData = response_data.user; // Extract user from response
      const learningData = response_data.learningProfile; // Extract learning profile
      
      setUser(userData);
      setLearningProfile(learningData);
      
      setFormData({
        fullNameArabic: userData.fullNameArabic || '',
        fullNameEnglish: userData.fullNameEnglish || '',
        username: userData.username || '',
        bio: userData.bio || '',
        website: userData.website || '',
        avatar: userData.avatar || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          fullNameEnglish: formData.fullNameEnglish.toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setUser(data.user); // Extract user from response
      setSuccess('تم تحديث الملف الشخصي بنجاح');
      setIsEditing(false);
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('كلمتا المرور الجديدة غير متطابقتان');
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess('تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول مرة أخرى.');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Clear tokens and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-change'));
      setTimeout(() => {
        router.push('/auth');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (activeTab === 'profile') {
      setFormData({
        ...formData,
        [name]: name === 'fullNameEnglish' ? value.toUpperCase() : value,
      });
    } else {
      setPasswordData({
        ...passwordData,
        [name]: value,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">خطأ</h1>
          <p className="text-gray-600">لم يتم العثور على الملف الشخصي</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 ml-8">
              <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-white text-2xl font-bold">
                {user.fullNameArabic?.charAt(0) || user.fullNameEnglish?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || '?'}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {user.fullNameArabic || user.fullNameEnglish || 'مستخدم جديد'}
              </h1>
              <p className="text-gray-600">{user.email || 'بريد إلكتروني غير محدد'}</p>
              <div className="flex items-center mt-2 space-x-4 space-x-reverse">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.role === 'ADMIN' 
                    ? 'bg-red-100 text-red-800' 
                    : user.role === 'EDITOR'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {user.role === 'ADMIN' ? 'مدير' : user.role === 'EDITOR' ? 'محرر' : 'مستخدم'}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.emailVerified 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {user.emailVerified ? '✓ بريد مؤكد' : '! بريد غير مؤكد'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 space-x-reverse px-6">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                لوحة التحكم
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                الملف الشخصي
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'password'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                تغيير كلمة المرور
              </button>
            </nav>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                {success}
              </div>
            )}

            {activeTab === 'dashboard' && learningProfile && (
              <div className="space-y-6">
                {/* Learning Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">الدورات المسجلة</p>
                        <p className="text-2xl font-bold">{learningProfile.statistics.totalEnrolledCourses}</p>
                      </div>
                      <div className="text-blue-200">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">الدورات المكتملة</p>
                        <p className="text-2xl font-bold">{learningProfile.statistics.completedCourses}</p>
                      </div>
                      <div className="text-green-200">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">الدروس المكتملة</p>
                        <p className="text-2xl font-bold">{learningProfile.statistics.totalLessonsCompleted}</p>
                      </div>
                      <div className="text-purple-200">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.84L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.84l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-sm">الشهادات المكتسبة</p>
                        <p className="text-2xl font-bold">{learningProfile.statistics.certificatesEarned}</p>
                      </div>
                      <div className="text-yellow-200">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Overview */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">نظرة عامة على التقدم</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>معدل إكمال الدورات</span>
                        <span>{learningProfile.statistics.completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${learningProfile.statistics.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{Math.floor(learningProfile.statistics.totalWatchTime / 3600)}h</p>
                        <p className="text-gray-600">وقت المشاهدة</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{learningProfile.statistics.totalLessonsWatched}</p>
                        <p className="text-gray-600">درس تم مشاهدته</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enrolled Courses */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">الدورات المسجلة</h3>
                  {learningProfile.enrolledCourses.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد دورات مسجلة</h3>
                      <p className="mt-1 text-sm text-gray-500">ابدأ رحلتك التعليمية بالتسجيل في دورة</p>
                      <div className="mt-6">
                        <Link
                          href="/courses"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          تصفح الدورات
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {learningProfile.enrolledCourses.map((course) => (
                        <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Link href={`/courses/${course.slug}`} className="block">
                                <h4 className="text-lg font-medium text-gray-900 hover:text-blue-600">
                                  {course.title}
                                </h4>
                                {course.titleEnglish && (
                                  <p className="text-sm text-gray-600">{course.titleEnglish}</p>
                                )}
                              </Link>
                              
                              <div className="mt-2 flex items-center space-x-4 space-x-reverse text-sm text-gray-500">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  course.level === 'BEGINNER' ? 'bg-green-100 text-green-800' :
                                  course.level === 'INTERMEDIATE' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {course.level === 'BEGINNER' ? 'مبتدئ' : 
                                   course.level === 'INTERMEDIATE' ? 'متوسط' : 'متقدم'}
                                </span>
                                <span>مسجل في {new Date(course.enrolledAt).toLocaleDateString('ar-SA')}</span>
                              </div>

                              <div className="mt-3">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                  <span>التقدم</span>
                                  <span>{course.progress.percentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${course.progress.percentage}%` }}
                                  ></div>
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                  {course.progress.completedLessons} من {course.progress.totalLessons} درس مكتمل
                                </div>
                              </div>

                              {course.certificates.length > 0 && (
                                <div className="mt-2 flex items-center text-sm text-green-600">
                                  <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  شهادة مكتسبة
                                </div>
                              )}
                            </div>

                            <div className="ml-4">
                              <Link
                                href={`/courses/${course.slug}`}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                              >
                                {course.isCompleted ? 'مراجعة الدورة' : 'متابعة الدراسة'}
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Certificates */}
                {learningProfile.enrolledCourses.some(course => course.certificates.length > 0) && (
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">الشهادات المكتسبة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {learningProfile.enrolledCourses
                        .filter(course => course.certificates.length > 0)
                        .map(course => 
                          course.certificates.map(cert => (
                            <div key={cert.id} className="border rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-yellow-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <div className="mr-3 flex-1">
                                    <h4 className="text-sm font-medium text-gray-900">{course.title}</h4>
                                    <p className="text-sm text-gray-600">شهادة إتمام الدورة</p>
                                    <p className="text-xs text-gray-500">
                                      مكتسب في {new Date(cert.earnedAt).toLocaleDateString('ar-SA')}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2 space-x-reverse">
                                  {cert.hasArabic && (
                                    <button
                                      onClick={() => window.open(`/certificates/${cert.certificateId}?lang=ar`, '_blank')}
                                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                    >
                                      عربي
                                    </button>
                                  )}
                                  {cert.hasEnglish && (
                                    <button
                                      onClick={() => window.open(`/certificates/${cert.certificateId}?lang=en`, '_blank')}
                                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                    >
                                      English
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )
                        .flat()
                      }
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم الكامل بالعربية *
                    </label>
                    <input
                      type="text"
                      name="fullNameArabic"
                      value={formData.fullNameArabic}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="كما سيظهر على الشهادة"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم الكامل بالإنجليزية *
                    </label>
                    <input
                      type="text"
                      name="fullNameEnglish"
                      value={formData.fullNameEnglish}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="FULL NAME IN ENGLISH"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اسم المستخدم
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الموقع الإلكتروني
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    النبذة الشخصية
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="اكتب نبذة مختصرة عنك..."
                  />
                </div>

                <div className="flex justify-between">
                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      تعديل الملف الشخصي
                    </button>
                  ) : (
                    <div className="space-x-4 space-x-reverse">
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            fullNameArabic: user.fullNameArabic || '',
                            fullNameEnglish: user.fullNameEnglish || '',
                            username: user.username || '',
                            bio: user.bio || '',
                            website: user.website || '',
                            avatar: user.avatar || '',
                          });
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        إلغاء
                      </button>
                    </div>
                  )}
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور الحالية *
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل كلمة المرور الحالية"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور الجديدة *
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handleInputChange}
                    required
                    minLength={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل كلمة المرور الجديدة"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تأكيد كلمة المرور الجديدة *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? 'جاري التحديث...' : 'تغيير كلمة المرور'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}