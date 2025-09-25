import { motion } from 'framer-motion';
import { Twitter, Linkedin, Github, Rss } from 'lucide-react';

const socialLinks = [
  { icon: <Twitter />, href: '#' },
  { icon: <Linkedin />, href: '#' },
  { icon: <Github />, href: '#' },
  { icon: <Rss />, href: '#' },
];

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
      className="bg-background/20 backdrop-blur-sm border-t border-border py-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-foreground-muted">
        <div className="flex justify-center gap-8 mb-8">
          {socialLinks.map((link, index) => (
            <motion.a
              key={index}
              href={link.href}
              whileHover={{ scale: 1.2, y: -5, color: '#D4FF33' }}
              whileTap={{ scale: 0.9 }}
              className="transition-colors"
            >
              {link.icon}
            </motion.a>
          ))}
        </div>
        <p className="mb-4">
          جميع الحقوق محفوظة &copy; {new Date().getFullYear()} بوابة نظم المعلومات الجغرافية
        </p>
        <p className="text-sm">
          تصميم وتطوير بواسطة فريق البوابة
        </p>
      </div>
    </motion.footer>
  );
}