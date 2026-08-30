"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ModeToggle } from "@/components/mode-toggle"
import { SpeechControlsButton } from "@/components/ui/speech-controls-button"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "五十音", en: "Kana", href: "/kana" },
  { name: "路径", en: "Path", href: "/path" },
  { name: "复习", en: "Review", href: "/review" },
  { name: "单词", en: "Vocab", href: "/vocabulary" },
  { name: "语法", en: "Grammar", href: "/grammar" },
  { name: "语义", en: "Meaning", href: "/semantics" },
  { name: "语用", en: "Usage", href: "/pragmatics" },
  { name: "测验", en: "Quiz", href: "/quiz" },
]

export function Navbar() {
  const pathname = usePathname()
  const coverRoute = pathname === "/"
  const [pastCover, setPastCover] = useState(!coverRoute)
  const showNav = !coverRoute || pastCover

  useEffect(() => {
    if (!coverRoute) return

    const update = () => setPastCover(window.scrollY > Math.max(320, window.innerHeight * 0.68))
    const frame = window.requestAnimationFrame(update)
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [coverRoute])

  return (
    <header
      className={cn(
        "paper-nav fixed inset-x-0 top-0 z-[60] transition-[opacity,transform] duration-500",
        !showNav && "pointer-events-none -translate-y-full opacity-0"
      )}
    >
      <div className="flex h-[4.8rem] items-center gap-2 px-3 sm:px-5 lg:gap-5 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-baseline gap-2 font-brush text-xl leading-none sm:text-2xl"
          aria-label="優しい Yasashi 首页"
        >
          <span>優しい</span>
          <span className="hidden font-scribble text-base text-muted-foreground sm:inline">Yasashi</span>
        </Link>

        <nav className="scrollbar-hide flex min-w-0 flex-1 items-center gap-4 overflow-x-auto px-1 lg:gap-6">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "nav-signpost shrink-0 whitespace-nowrap text-sm text-muted-foreground",
                  active && "is-active text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.name}
                <span className="ml-1 hidden font-scribble text-[0.78rem] xl:inline">{item.en}</span>
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-0.5">
          <SpeechControlsButton />
          <ModeToggle />
          <Link
            href="/path"
            data-testid="nav-start-learning"
            className="nav-signpost ml-1 inline-flex h-10 min-w-10 items-center justify-center px-1 text-sm text-foreground sm:px-2"
            aria-label="开始学习"
          >
            <span className="sm:hidden">学</span>
            <span className="hidden sm:inline">学习</span>
            <span className="ml-1 hidden font-scribble text-xs text-muted-foreground lg:inline">Begin</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
