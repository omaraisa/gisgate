import Image from 'next/image';

interface FooterProps {
  theme?: 'dark' | 'light';
}

export default function Footer({ theme = 'dark' }: FooterProps) {
  const isDark = theme === 'dark';

  return (
    <footer className={isDark ? 'bg-primary-900' : 'bg-gray-50 border-t border-gray-200'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
            <div className="text-center mb-8">
              <Image src="/logo.png" alt="بوابة نظم المعلومات الجغرافية" width={64} height={64} className="h-16 w-auto mx-auto" />
            </div>
            <h3 className={`text-lg font-semibold mb-4 text-center ${isDark ? 'text-secondary-400' : 'text-gray-700'}`}>تابعنا على</h3>
            <div className="flex justify-center gap-12">
              <a href="https://x.com/gis_gate" className={`transition-colors duration-200 p-2 ${isDark ? 'text-white/80 hover:text-secondary-400' : 'text-gray-600 hover:text-secondary-600'}`} aria-label="X">
              <i className="fab fa-x-twitter text-3xl"></i>
              </a>
              <a href="https://www.facebook.com/arabgisgate" className={`transition-colors duration-200 p-2 ${isDark ? 'text-white/80 hover:text-secondary-400' : 'text-gray-600 hover:text-secondary-600'}`} aria-label="Facebook">
              <i className="fab fa-facebook-f text-3xl"></i>
              </a>
              <a href="https://www.youtube.com/channel/UC1R4Y31wIYw3KZN5vdPrN1w" className={`transition-colors duration-200 p-2 ${isDark ? 'text-white/80 hover:text-secondary-400' : 'text-gray-600 hover:text-secondary-600'}`} aria-label="YouTube">
              <i className="fab fa-youtube text-3xl"></i>
              </a>
            </div>
            </div>
            <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-secondary-400' : 'text-gray-700'}`}>تواصل معنا</h3>
            <form className="space-y-4">
              <input type="text" placeholder="اسمك" className={`w-full p-2 rounded focus:outline-none ${isDark ? 'bg-white/10 border border-white/20 focus:border-secondary-500 text-white placeholder-white/50' : 'bg-white border border-gray-300 focus:border-secondary-500 text-gray-900 placeholder-gray-500'}`} />
              <input type="email" placeholder="بريدك الإلكتروني" className={`w-full p-2 rounded focus:outline-none ${isDark ? 'bg-white/10 border border-white/20 focus:border-secondary-500 text-white placeholder-white/50' : 'bg-white border border-gray-300 focus:border-secondary-500 text-gray-900 placeholder-gray-500'}`} />
              <input type="text" placeholder="الموضوع" className={`w-full p-2 rounded focus:outline-none ${isDark ? 'bg-white/10 border border-white/20 focus:border-secondary-500 text-white placeholder-white/50' : 'bg-white border border-gray-300 focus:border-secondary-500 text-gray-900 placeholder-gray-500'}`} />
              <textarea placeholder="رسالتك" className={`w-full p-2 rounded focus:outline-none ${isDark ? 'bg-white/10 border border-white/20 focus:border-secondary-500 text-white placeholder-white/50' : 'bg-white border border-gray-300 focus:border-secondary-500 text-gray-900 placeholder-gray-500'}`} rows={4}></textarea>
              <button type="submit" className="bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 px-4 py-2 rounded transition-all duration-200">إرسال</button>
            </form>
          </div>
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-secondary-400' : 'text-gray-700'}`}>اشترك معنا</h3>
            <form className="space-y-4">
              <input type="text" placeholder="الاسم الأول" className={`w-full p-2 rounded focus:outline-none ${isDark ? 'bg-white/10 border border-white/20 focus:border-secondary-500 text-white placeholder-white/50' : 'bg-white border border-gray-300 focus:border-secondary-500 text-gray-900 placeholder-gray-500'}`} />
              <input type="text" placeholder="الاسم الأخير" className={`w-full p-2 rounded focus:outline-none ${isDark ? 'bg-white/10 border border-white/20 focus:border-secondary-500 text-white placeholder-white/50' : 'bg-white border border-gray-300 focus:border-secondary-500 text-gray-900 placeholder-gray-500'}`} />
              <input type="email" placeholder="البريد الإلكتروني" className={`w-full p-2 rounded focus:outline-none ${isDark ? 'bg-white/10 border border-white/20 focus:border-secondary-500 text-white placeholder-white/50' : 'bg-white border border-gray-300 focus:border-secondary-500 text-gray-900 placeholder-gray-500'}`} />
              <button type="submit" className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 px-4 py-2 rounded transition-all duration-200">إشتراك</button>
            </form>
          </div>
        </div>
        <div className="mt-8 pt-8 text-center">
          <p className={isDark ? 'text-white/60' : 'text-gray-500'}>&copy; 2025 بوابة نظم المعلومات الجغرافية. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
