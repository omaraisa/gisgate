'use client';

import { useState, useEffect } from 'react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  return (
    <header className="sticky top-0 z-50 shadow-lg" style={{ background: 'rgb(30 46 20 / 67%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2">
            <div className="flex items-center">
            <img src="/logo.png" alt="بوابة نظم المعلومات الجغرافية" className={`mr-3 transition-all duration-300 ${isScrolled ? 'h-10 w-10' : 'h-[60px] w-[60px]'}`} />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              بوابة نظم المعلومات الجغرافية
            </h1>
            </div>
          <nav className="hidden md:flex gap-8">
            <a href="#" className="text-primary-700 hover:text-secondary-600 transition-colors duration-200 px-2">الرئيسية</a>
            <a href="#" className="text-primary-700 hover:text-secondary-600 transition-colors duration-200 px-2">فيديوهات</a>
            <a href="#" className="text-primary-700 hover:text-secondary-600 transition-colors duration-200 px-2">مقالات</a>
            <a href="#" className="text-primary-700 hover:text-secondary-600 transition-colors duration-200 px-2">دورات تدريبية</a>
            <a href="#" className="text-primary-700 hover:text-secondary-600 transition-colors duration-200 px-2">من نحن</a>
          </nav>
        </div>
      </div>
    </header>
  );
}
