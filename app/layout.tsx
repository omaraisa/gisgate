import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Header from "./components/Header";
import Cart from "./components/Cart";
import { StoreProvider } from "@/lib/stores/store-provider";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import ScrollToTopButton from "./components/ScrollToTopButton";
import AuthChecker from "./components/AuthChecker";
import { Toaster } from "sonner";

const kufi = localFont({
  src: "../fonts/kufi.ttf",
  variable: "--font-kufi",
});

const aldrich = localFont({
  src: "../fonts/Aldrich.ttf",
  variable: "--font-aldrich",
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
        className={`${kufi.variable} ${aldrich.variable} font-sans antialiased`}
      >
        <ErrorBoundary>
          <StoreProvider>
            <AuthChecker />
            <Header />
            <Cart />
            <ScrollToTop />
            {children}
            <ScrollToTopButton />
            <Toaster position="top-center" richColors />
          </StoreProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
