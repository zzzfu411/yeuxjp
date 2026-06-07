import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { GlossaryProvider } from "@/components/ui/glossary";
import { SpeechPreferencesProvider } from "@/components/ui/speech-preferences";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "Yasashi Japanese | 零基础日语学习",
  description: "一个温暖、简单的零基础日语学习平台",
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
};

export const viewport: Viewport = {
  themeColor: "#ffb7b2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className="min-h-screen bg-background font-sans antialiased flex flex-col"
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
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </GlossaryProvider>
          </SpeechPreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
