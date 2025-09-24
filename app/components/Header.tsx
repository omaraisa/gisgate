export default function Header() {
  return (
    <header className="bg-gradient-to-r from-primary-50 to-secondary-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              بوابة نظم المعلومات الجغرافية
            </h1>
          </div>
          <nav className="hidden md:flex space-x-8 space-x-reverse">
            <a href="#" className="text-primary-700 hover:text-secondary-600 transition-colors duration-200">الرئيسية</a>
            <a href="#" className="text-primary-700 hover:text-secondary-600 transition-colors duration-200">فيديوهات</a>
            <a href="#" className="text-primary-700 hover:text-secondary-600 transition-colors duration-200">مقالات</a>
            <a href="#" className="text-primary-700 hover:text-secondary-600 transition-colors duration-200">دورات تدريبية</a>
            <a href="#" className="text-primary-700 hover:text-secondary-600 transition-colors duration-200">من نحن</a>
          </nav>
        </div>
      </div>
    </header>
  );
}
