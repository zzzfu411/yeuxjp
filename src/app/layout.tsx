import type { Metadata, Viewport } from "next";
import { SITE_ORIGIN } from "@/lib/site-metadata";
import "./globals.css";
import "./visual-novel.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { GlossaryProvider } from "@/components/ui/glossary";
import { SpeechPreferencesProvider } from "@/components/ui/speech-preferences";
import { PwaRegister } from "@/components/pwa-register";
import { LearningStorageNotice } from "@/components/learning/learning-storage-notice";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "優しい Yasashi | 日语学习",
    template: "%s | 優しい Yasashi",
  },
  description: "从五十音到 N2：按 175 天课程学习词汇和语法，并用间隔复习巩固。",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Yasashi Japanese",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "優しい Yasashi",
    title: "優しい Yasashi | 日语学习",
    description: "从五十音到 N2，按 175 天课程循序学习日语。",
  },
  twitter: {
    card: "summary_large_image",
    title: "優しい Yasashi | 日语学习",
    description: "从五十音到 N2，按 175 天课程循序学习日语。",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffdf9" },
    { media: "(prefers-color-scheme: dark)", color: "#1e202b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className="flex min-h-screen flex-col bg-background font-sans antialiased"
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SpeechPreferencesProvider>
            <GlossaryProvider>
              <PwaRegister />
              <a href="#main-content" className="skip-link">
                跳到正文
              </a>
              <Navbar />
              <LearningStorageNotice />
              <main id="main-content" className="site-main flex-1">{children}</main>
              <Footer />
            </GlossaryProvider>
          </SpeechPreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
