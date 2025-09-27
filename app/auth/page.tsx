'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    fullNameArabic: '',
    fullNameEnglish: '',
  });

  // Password validation function
  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    return {
      minLength,
      hasLowerCase,
      hasUpperCase,
      hasNumber,
      isValid: minLength && hasLowerCase && hasUpperCase && hasNumber
    };
  };

  const passwordValidation = validatePassword(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword;

  const router = useRouter();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const sessionToken = localStorage.getItem('sessionToken');
        const user = localStorage.getItem('user');
        
        if (sessionToken && user) {
          // Verify the session is still valid
          const response = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${sessionToken}`,
            },
          });

          if (response.ok) {
            const userData = JSON.parse(user);
            // Redirect based on user role
            if (userData.role === 'ADMIN') {
              router.push('/admin');
            } else {
              router.push('/');
            }
            return;
          } else {
            // Invalid session, clear storage
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            window.dispatchEvent(new Event('auth-change'));
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear potentially corrupted storage
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-change'));
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate password for registration
    if (!isLogin) {
      if (!passwordValidation.isValid) {
        setError('كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، وحروف كبيرة وصغيرة وأرقام');
        setLoading(false);
        return;
      }
      
      if (!passwordsMatch) {
        setError('كلمتا المرور غير متطابقتان');
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : {
            email: formData.email,
            password: formData.password,
            username: formData.username,
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
        
        // Trigger a custom event to notify Header component
        window.dispatchEvent(new Event('auth-change'));
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

  // Show loading spinner while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري التحقق من حالة تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

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
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  !isLogin && formData.password && !passwordValidation.isValid
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="كلمة المرور"
                minLength={8}
              />
              {!isLogin && formData.password && (
                <div className="mt-2 text-xs space-y-1">
                  <div className={`flex items-center ${
                    passwordValidation.minLength ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className="mr-2">{passwordValidation.minLength ? '✓' : '✗'}</span>
                    8 أحرف على الأقل
                  </div>
                  <div className={`flex items-center ${
                    passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className="mr-2">{passwordValidation.hasLowerCase ? '✓' : '✗'}</span>
                    حرف صغير واحد على الأقل (a-z)
                  </div>
                  <div className={`flex items-center ${
                    passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className="mr-2">{passwordValidation.hasUpperCase ? '✓' : '✗'}</span>
                    حرف كبير واحد على الأقل (A-Z)
                  </div>
                  <div className={`flex items-center ${
                    passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className="mr-2">{passwordValidation.hasNumber ? '✓' : '✗'}</span>
                    رقم واحد على الأقل (0-9)
                  </div>
                </div>
              )}
            </div>

            {!isLogin && (
              <>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    تأكيد كلمة المرور *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      formData.confirmPassword && !passwordsMatch
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="أعد كتابة كلمة المرور"
                  />
                  {formData.confirmPassword && (
                    <div className={`mt-1 text-xs ${
                      passwordsMatch ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <span className="mr-2">{passwordsMatch ? '✓' : '✗'}</span>
                      {passwordsMatch ? 'كلمتا المرور متطابقتان' : 'كلمتا المرور غير متطابقتان'}
                    </div>
                  )}
                </div>
                
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