import Image from 'next/image';
import { useState } from 'react';

interface FooterProps {
  theme?: 'dark' | 'light';
}

export default function Footer({ theme = 'dark' }: FooterProps) {
  const isDark = theme === 'dark';

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactMessage, setContactMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Newsletter form state
  const [newsletterForm, setNewsletterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setContactMessage(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      });

      const data = await response.json();

      if (response.ok) {
        setContactMessage({ type: 'success', text: data.message });
        setContactForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setContactMessage({ type: 'error', text: data.error || 'حدث خطأ أثناء إرسال الرسالة' });
      }
    } catch {
      setContactMessage({ type: 'error', text: 'حدث خطأ في الشبكة. يرجى المحاولة مرة أخرى.' });
    } finally {
      setContactLoading(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterLoading(true);
    setNewsletterMessage(null);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsletterForm),
      });

      const data = await response.json();

      if (response.ok) {
        setNewsletterMessage({ type: 'success', text: data.message });
        setNewsletterForm({ firstName: '', lastName: '', email: '' });
      } else {
        setNewsletterMessage({ type: 'error', text: data.error || 'حدث خطأ أثناء الاشتراك' });
      }
    } catch {
      setNewsletterMessage({ type: 'error', text: 'حدث خطأ في الشبكة. يرجى المحاولة مرة أخرى.' });
    } finally {
      setNewsletterLoading(false);
    }
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleNewsletterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewsletterForm({
      ...newsletterForm,
      [e.target.name]: e.target.value,
    });
  };

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
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                value={contactForm.name}
                onChange={handleContactChange}
                placeholder="اسمك"
                required
                className={`w-full p-2 rounded focus:outline-none ${isDark ? 'bg-white/10 border border-white/20 focus:border-secondary-500 text-white placeholder-white/50' : 'bg-white border border-gray-300 focus:border-secondary-500 text-gray-900 placeholder-gray-500'}`}
              />
              <input
                type="email"
                name="email"
                value={contactForm.email}
                onChange={handleContactChange}
                placeholder="بريدك الإلكتروني"
                required
                className={`w-full p-2 rounded focus:outline-none ${isDark ? 'bg-white/10 border border-white/20 focus:border-secondary-500 text-white placeholder-white/50' : 'bg-white border border-gray-300 focus:border-secondary-500 text-gray-900 placeholder-gray-500'}`}
              />
              <input
                type="text"
                name="subject"
                value={contactForm.subject}
                onChange={handleContactChange}
                placeholder="الموضوع"
                required
                className={`w-full p-2 rounded focus:outline-none ${isDark ? 'bg-white/10 border border-white/20 focus:border-secondary-500 text-white placeholder-white/50' : 'bg-white border border-gray-300 focus:border-secondary-500 text-gray-900 placeholder-gray-500'}`}
              />
              <textarea
                name="message"
                value={contactForm.message}
                onChange={handleContactChange}
                placeholder="رسالتك"
                required
                rows={4}
                className={`w-full p-2 rounded focus:outline-none ${isDark ? 'bg-white/10 border border-white/20 focus:border-secondary-500 text-white placeholder-white/50' : 'bg-white border border-gray-300 focus:border-secondary-500 text-gray-900 placeholder-gray-500'}`}
              ></textarea>
              {contactMessage && (
                <div className={`p-2 rounded text-sm ${contactMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {contactMessage.text}
                </div>
              )}
              <button
                type="submit"
                disabled={contactLoading}
                className="bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 disabled:opacity-50 px-4 py-2 rounded transition-all duration-200"
              >
                {contactLoading ? 'جاري الإرسال...' : 'إرسال'}
              </button>
            </form>
          </div>
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-secondary-400' : 'text-gray-700'}`}>اشترك في النشرة الإخبارية</h3>
            <form onSubmit={handleNewsletterSubmit} className="space-y-4">
              <input
                type="text"
                name="firstName"
                value={newsletterForm.firstName}
                onChange={handleNewsletterChange}
                placeholder="الاسم الأول"
                required
                className={`w-full p-2 rounded focus:outline-none ${isDark ? 'bg-white/10 border border-white/20 focus:border-secondary-500 text-white placeholder-white/50' : 'bg-white border border-gray-300 focus:border-secondary-500 text-gray-900 placeholder-gray-500'}`}
              />
              <input
                type="text"
                name="lastName"
                value={newsletterForm.lastName}
                onChange={handleNewsletterChange}
                placeholder="الاسم الأخير"
                required
                className={`w-full p-2 rounded focus:outline-none ${isDark ? 'bg-white/10 border border-white/20 focus:border-secondary-500 text-white placeholder-white/50' : 'bg-white border border-gray-300 focus:border-secondary-500 text-gray-900 placeholder-gray-500'}`}
              />
              <input
                type="email"
                name="email"
                value={newsletterForm.email}
                onChange={handleNewsletterChange}
                placeholder="البريد الإلكتروني"
                required
                className={`w-full p-2 rounded focus:outline-none ${isDark ? 'bg-white/10 border border-white/20 focus:border-secondary-500 text-white placeholder-white/50' : 'bg-white border border-gray-300 focus:border-secondary-500 text-gray-900 placeholder-gray-500'}`}
              />
              {newsletterMessage && (
                <div className={`p-2 rounded text-sm ${newsletterMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {newsletterMessage.text}
                </div>
              )}
              <button
                type="submit"
                disabled={newsletterLoading}
                className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 px-4 py-2 rounded transition-all duration-200"
              >
                {newsletterLoading ? 'جاري الاشتراك...' : 'إشتراك'}
              </button>
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
