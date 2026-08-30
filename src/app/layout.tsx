import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PaperGrain } from "@/components/layout/paper-grain";
import { ThemeProvider } from "@/components/theme-provider";
import { GlossaryProvider } from "@/components/ui/glossary";
import { SpeechPreferencesProvider } from "@/components/ui/speech-preferences";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://yeuxjp.vercel.app"),
  title: {
    default: "優しい Yasashi | 纸上日语",
    template: "%s | 優しい Yasashi",
  },
  description: "在一张安静的纸上，循序学习五十音、词汇、语法与复习。",
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
    title: "優しい Yasashi | 纸上日语",
    description: "在一张安静的纸上，循序学习日语。",
    images: [{ url: "/assets/brand/yasashi-og.webp", width: 1200, height: 630, alt: "優しい Yasashi 纸上日语" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "優しい Yasashi | 纸上日语",
    description: "在一张安静的纸上，循序学习日语。",
    images: ["/assets/brand/yasashi-og.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#d8d3cc" },
    { media: "(prefers-color-scheme: dark)", color: "#2a2733" },
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
              <PaperGrain />
              <a href="#main-content" className="skip-link">
                跳到正文
              </a>
              <Navbar />
              <main id="main-content" className="site-main flex-1">{children}</main>
              <Footer />
            </GlossaryProvider>
          </SpeechPreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
