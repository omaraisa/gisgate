import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'من نحن - بوابة نظم المعلومات الجغرافية',
  description: 'تعرف على بوابة نظم المعلومات الجغرافية، أهدافها، ورؤيتها في إثراء المحتوى العربي في مجال نظم المعلومات الجغرافية',
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}