"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { SpeechControlsButton } from "@/components/ui/speech-controls-button"
import { cn } from "@/lib/utils"

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

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95">
      <div className="flex flex-nowrap items-center gap-2 px-3 py-3 sm:px-4">
        <Link
          href="/"
          className="shrink-0 bg-primary px-3 py-1.5 text-xl font-black tracking-tighter text-foreground border-[3px] border-foreground shadow-hard-sm sm:text-2xl"
          aria-label="優しい Japanese 首页"
        >
          YASASHI!
        </Link>

        <nav className="scrollbar-hide flex min-w-0 flex-1 items-center overflow-x-auto">
          {navItems.map((item, index) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "shrink-0 border-[3px] border-foreground bg-card px-3 py-2 text-xs font-extrabold sm:text-sm",
                  index > 0 && "-ml-[3px]",
                  active
                    ? "z-[1] bg-foreground text-background dark:bg-primary dark:text-primary-foreground"
                    : "hover:bg-primary"
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ModeToggle />
          <SpeechControlsButton />
          <Button asChild size="sm" className="gap-2">
            <Link href="/path" data-testid="nav-start-learning" aria-label="开始学习">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span className="hidden min-[360px]:inline">开始学习</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
