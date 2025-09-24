export default function Footer() {
  return (
    <footer>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-center mb-8">
              <img src="/logo.png" alt="بوابة نظم المعلومات الجغرافية" className="h-16 w-auto mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-4 text-secondary-400 text-center">تابعنا على</h3>
            <div className="flex justify-center space-x-4 space-x-reverse">
              <a href="https://www.facebook.com/arabgisgate" className="text-white/80 hover:text-secondary-400 transition-colors duration-200" aria-label="Facebook">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.406.595 24 1.326 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.325-.594 1.325-1.326V1.326C24 .592 23.405 0 22.675 0"></path></svg>
              </a>
              <a href="https://www.youtube.com/channel/UC1R4Y31wIYw3KZN5vdPrN1w" className="text-white/80 hover:text-secondary-400 transition-colors duration-200" aria-label="YouTube">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a2.994 2.994 0 0 0-2.112-2.112C19.191 3.5 12 3.5 12 3.5s-7.191 0-9.386.574a2.994 2.994 0 0 0-2.112 2.112C0 8.381 0 12 0 12s0 3.619.502 5.814a2.994 2.994 0 0 0 2.112 2.112C4.809 20.5 12 20.5 12 20.5s7.191 0 9.386-.574a2.994 2.994 0 0 0 2.112-2.112C24 15.619 24 12 24 12s0-3.619-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"></path></svg>
              </a>
              <a href="https://twitter.com/gis_gate" className="text-white/80 hover:text-secondary-400 transition-colors duration-200" aria-label="Twitter">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557a9.93 9.93 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.916 4.916 0 0 0-8.384 4.482C7.691 8.095 4.066 6.13 1.64 3.161c-.543.93-.855 2.011-.855 3.17 0 2.188 1.115 4.117 2.813 5.254a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.418A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.142 0 14.307-7.721 13.995-14.646A9.936 9.936 0 0 0 24 4.557z"></path></svg>
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-secondary-400">تواصل معنا</h3>
            <form className="space-y-4">
              <input type="text" placeholder="اسمك" className="w-full p-2 rounded bg-white/10 border border-white/20 focus:border-secondary-500 focus:outline-none text-white placeholder-white/50" />
              <input type="email" placeholder="بريدك الإلكتروني" className="w-full p-2 rounded bg-white/10 border border-white/20 focus:border-secondary-500 focus:outline-none text-white placeholder-white/50" />
              <input type="text" placeholder="الموضوع" className="w-full p-2 rounded bg-white/10 border border-white/20 focus:border-secondary-500 focus:outline-none text-white placeholder-white/50" />
              <textarea placeholder="رسالتك" className="w-full p-2 rounded bg-white/10 border border-white/20 focus:border-secondary-500 focus:outline-none text-white placeholder-white/50" rows={4}></textarea>
              <button type="submit" className="bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 px-4 py-2 rounded transition-all duration-200">إرسال</button>
            </form>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-secondary-400">اشترك معنا</h3>
            <form className="space-y-4">
              <input type="text" placeholder="الاسم الأول" className="w-full p-2 rounded bg-white/10 border border-white/20 focus:border-secondary-500 focus:outline-none text-white placeholder-white/50" />
              <input type="text" placeholder="الاسم الأخير" className="w-full p-2 rounded bg-white/10 border border-white/20 focus:border-secondary-500 focus:outline-none text-white placeholder-white/50" />
              <input type="email" placeholder="البريد الإلكتروني" className="w-full p-2 rounded bg-white/10 border border-white/20 focus:border-secondary-500 focus:outline-none text-white placeholder-white/50" />
              <button type="submit" className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 px-4 py-2 rounded transition-all duration-200">إشتراك</button>
            </form>
          </div>
        </div>
        <div className="mt-8 pt-8 text-center">
          <p className="text-white/60">&copy; 2025 بوابة نظم المعلومات الجغرافية. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
