import type { Metadata, Viewport } from "next";
import { DM_Sans, Ma_Shan_Zheng, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PaperGrain } from "@/components/layout/paper-grain";
import { ThemeProvider } from "@/components/theme-provider";
import { GlossaryProvider } from "@/components/ui/glossary";
import { SpeechPreferencesProvider } from "@/components/ui/speech-preferences";
import { PwaRegister } from "@/components/pwa-register";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-ui",
  display: "swap",
});

const notoSerifJp = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-jp",
  display: "swap",
  preload: false,
});

const maShanZheng = Ma_Shan_Zheng({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-brush",
  display: "swap",
  preload: false,
});

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
  themeColor: "#facc15",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${notoSerifJp.variable} ${maShanZheng.variable} min-h-screen bg-background font-sans antialiased flex flex-col`}
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
