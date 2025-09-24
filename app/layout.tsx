import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Header from "./components/Header";

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-sans-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

const kufi = localFont({
  src: "../fonts/kufi.ttf",
  variable: "--font-kufi",
});

export const metadata: Metadata = {
  title: "بوابة نظم المعلومات الجغرافية",
  description: "بوابة تعليمية لنظم المعلومات الجغرافية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${kufi.variable} font-sans antialiased`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
