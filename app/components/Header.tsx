export default function Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">بوابة نظم المعلومات الجغرافية</h1>
          </div>
          <nav className="hidden md:flex space-x-8 space-x-reverse">
            <a href="#" className="text-gray-700 hover:text-gray-900">الرئيسية</a>
            <a href="#" className="text-gray-700 hover:text-gray-900">فيديوهات</a>
            <a href="#" className="text-gray-700 hover:text-gray-900">مقالات</a>
            <a href="#" className="text-gray-700 hover:text-gray-900">دورات تدريبية</a>
            <a href="#" className="text-gray-700 hover:text-gray-900">من نحن</a>
          </nav>
        </div>
      </div>
    </header>
  );
}
