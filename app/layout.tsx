import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Header from "./components/Header";
import { StoreProvider } from "@/lib/stores/store-provider";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import ScrollToTopButton from "./components/ScrollToTopButton";

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
        <ErrorBoundary>
          <StoreProvider>
            <Header />
            <ScrollToTop />
            {children}
            <ScrollToTopButton />
          </StoreProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
