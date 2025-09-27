'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: '',
    fullNameArabic: '',
    fullNameEnglish: '',
  });

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            email: formData.email,
            password: formData.password,
            username: formData.username,
            firstName: formData.firstName,
            lastName: formData.lastName,
            fullNameArabic: formData.fullNameArabic,
            fullNameEnglish: formData.fullNameEnglish.toUpperCase(),
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store tokens
      if (data.tokens) {
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('sessionToken', data.tokens.sessionToken);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Redirect based on user role
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'fullNameEnglish' ? value.toUpperCase() : value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? 'أدخل بياناتك للوصول إلى حسابك' : 'املأ البيانات التالية لإنشاء حساب جديد'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit} dir="rtl">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                البريد الإلكتروني *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                كلمة المرور *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="كلمة المرور"
                minLength={8}
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    اسم المستخدم
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="username"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      الاسم الأول
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="الاسم الأول"
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      الاسم الأخير
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="الاسم الأخير"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="fullNameArabic" className="block text-sm font-medium text-gray-700">
                    الاسم الكامل بالعربية *
                  </label>
                  <input
                    id="fullNameArabic"
                    name="fullNameArabic"
                    type="text"
                    required
                    value={formData.fullNameArabic}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="كما سيظهر على الشهادة"
                  />
                </div>
                
                <div>
                  <label htmlFor="fullNameEnglish" className="block text-sm font-medium text-gray-700">
                    الاسم الكامل بالإنجليزية *
                  </label>
                  <input
                    id="fullNameEnglish"
                    name="fullNameEnglish"
                    type="text"
                    required
                    value={formData.fullNameEnglish}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="كما سيظهر على الشهادة"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  جاري المعالجة...
                </div>
              ) : (
                isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              {isLogin ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'لديك حساب بالفعل؟ تسجيل الدخول'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}