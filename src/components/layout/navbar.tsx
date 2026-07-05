import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { SpeechControlsButton } from "@/components/ui/speech-controls-button"

const navItems = [
  { name: "五十音", href: "/kana" },
  { name: "技能树", href: "/path" },
  { name: "复习", href: "/review" },
  { name: "单词", href: "/vocabulary" },
  { name: "语法", href: "/grammar" },
  { name: "语义", href: "/semantics" },
  { name: "语用", href: "/pragmatics" },
  { name: "测验", href: "/quiz" },
]

// We render the brand SVGs via CSS `mask-image` so the strokes inherit a
// Tailwind background color. This keeps `currentColor` semantics across
// light/dark themes without inlining the SVG markup or adding a loader.
const MASK_BASE = {
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskPosition: "center",
  WebkitMaskSize: "contain",
  maskSize: "contain",
} as const

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="優しい Japanese 首页">
          <span
            aria-hidden
            className="block w-8 h-8 bg-primary transition-colors group-hover:bg-primary/80"
            style={{
              ...MASK_BASE,
              WebkitMaskImage: "url(/brand/logo-mark.svg)",
              maskImage: "url(/brand/logo-mark.svg)",
            }}
          />
          <span
            aria-hidden
            className="hidden sm:block h-6 w-[160px] bg-foreground/85 transition-colors group-hover:bg-foreground"
            style={{
              ...MASK_BASE,
              WebkitMaskImage: "url(/brand/logo-wordmark.svg)",
              maskImage: "url(/brand/logo-wordmark.svg)",
              WebkitMaskPosition: "left center",
              maskPosition: "left center",
            }}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          <SpeechControlsButton />
          <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
            <Link href="/review">复习</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/path" data-testid="nav-start-learning">开始学习</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
