'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navigationItems = [
    { href: '/', label: 'الرئيسية', icon: '🏠' },
    { href: '/articles', label: 'المقالات', icon: '📰' },
    { href: '#', label: 'فيديوهات', icon: '🎥' },
    { href: '#', label: 'دورات تدريبية', icon: '🎓' },
    { href: '/admin', label: 'إدارة المحتوى', icon: '⚙️', highlight: true },
    { href: '#', label: 'من نحن', icon: '👥' },
  ];
  return (
    <>
      <header className="sticky top-0 z-50 shadow-lg backdrop-blur-sm" style={{ background: 'rgb(30 46 20 / 67%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            {/* Logo and Title */}
            <div className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="بوابة نظم المعلومات الجغرافية" 
                width={isScrolled ? 40 : 60} 
                height={isScrolled ? 40 : 60} 
                className={`mr-3 transition-all duration-300 ${isScrolled ? 'h-10 w-10' : 'h-[60px] w-[60px]'}`} 
              />
              <h1 className={`font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent transition-all duration-300 ${
                isScrolled ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
              }`}>
                <span className="hidden sm:inline">بوابة نظم المعلومات الجغرافية</span>
                <span className="sm:hidden">بوابة GIS</span>
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-6 lg:gap-8">
              {navigationItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={`relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:scale-105 ${
                    item.highlight 
                      ? 'text-lime-300 hover:text-lime-200 font-semibold' 
                      : 'text-white hover:text-lime-300'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden relative z-50 p-2 rounded-md text-white hover:text-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-300 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span className={`w-6 h-0.5 bg-current transform transition-all duration-300 ${
                  isMobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                }`}></span>
                <span className={`w-6 h-0.5 bg-current mt-1 transition-all duration-300 ${
                  isMobileMenuOpen ? 'opacity-0' : ''
                }`}></span>
                <span className={`w-6 h-0.5 bg-current mt-1 transform transition-all duration-300 ${
                  isMobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                }`}></span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 transition-opacity duration-300 md:hidden ${
        isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
      </div>

      {/* Mobile Slide Menu */}
      <div className={`mobile-menu-container fixed top-0 right-0 h-full w-80 max-w-[85vw] z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full bg-gradient-to-b from-green-900 via-green-800 to-green-900 shadow-2xl">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-6 border-b border-green-700">
            <div className="flex items-center">
              <Image 
                src="/logo.png" 
                alt="Logo" 
                width={40} 
                height={40} 
                className="ml-3"
              />
              <h2 className="text-white font-bold text-lg">بوابة GIS</h2>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 rounded-full text-white hover:bg-green-700 transition-colors duration-200"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu Navigation */}
          <nav className="py-6">
            <div className="px-6 mb-4">
              <p className="text-green-200 text-sm font-medium">التنقل الرئيسي</p>
            </div>
            {navigationItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-6 py-4 text-right transition-all duration-200 hover:bg-green-700 hover:border-r-4 hover:border-lime-400 ${
                  item.highlight 
                    ? 'text-lime-300 bg-green-800 border-r-4 border-lime-400' 
                    : 'text-white'
                }`}
              >
                <span className="text-2xl ml-4">{item.icon}</span>
                <div className="flex-1">
                  <span className="block text-lg font-medium">{item.label}</span>
                  {item.highlight && (
                    <span className="block text-sm text-lime-200 mt-1">لوحة التحكم</span>
                  )}
                </div>
                <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-green-700">
            <div className="text-center">
              <p className="text-green-200 text-sm">
                © 2025 بوابة نظم المعلومات الجغرافية
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
