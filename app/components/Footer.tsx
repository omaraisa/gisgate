export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">تابعنا على</h3>
            <div className="flex space-x-4 space-x-reverse">
              <a href="https://www.facebook.com/arabgisgate" className="hover:text-blue-400">Facebook</a>
              <a href="https://www.youtube.com/channel/UC1R4Y31wIYw3KZN5vdPrN1w" className="hover:text-red-400">YouTube</a>
              <a href="https://twitter.com/gis_gate" className="hover:text-blue-400">Twitter</a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">تواصل معنا</h3>
            <form className="space-y-4">
              <input type="text" placeholder="اسمك" className="w-full p-2 rounded text-black" />
              <input type="email" placeholder="بريدك الإلكتروني" className="w-full p-2 rounded text-black" />
              <input type="text" placeholder="الموضوع" className="w-full p-2 rounded text-black" />
              <textarea placeholder="رسالتك" className="w-full p-2 rounded text-black" rows={4}></textarea>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">إرسال</button>
            </form>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">اشترك معنا</h3>
            <form className="space-y-4">
              <input type="text" placeholder="الاسم الأول" className="w-full p-2 rounded text-black" />
              <input type="text" placeholder="الاسم الأخير" className="w-full p-2 rounded text-black" />
              <input type="email" placeholder="البريد الإلكتروني" className="w-full p-2 rounded text-black" />
              <button type="submit" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded">إشتراك</button>
            </form>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <p>&copy; 2025 بوابة نظم المعلومات الجغرافية. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
