"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { SpeechControlsButton } from "@/components/ui/speech-controls-button"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "今日学习", href: "/" },
  { name: "学习路径", href: "/path" },
  { name: "五十音", href: "/kana" },
  { name: "复习", href: "/review" },
  { name: "单词", href: "/vocabulary" },
  { name: "语法", href: "/grammar" },
  { name: "语义", href: "/semantics" },
  { name: "语用", href: "/pragmatics" },
  { name: "测验", href: "/quiz" },
  { name: "设置", href: "/settings" },
]

export function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")
  return (
    <header className="paper-nav fixed inset-x-0 top-0 z-[60]">
      <div className="nav-inner">
        <Link href="/" className="brand-lockup" aria-label="優しい Yasashi 首页"><span lang="ja">優しい</span><span className="brand-caption">日本語を、少しずつ。</span></Link>
        <nav aria-label="主导航" className="hidden items-center gap-8 lg:flex">
          {navItems.slice(0, 4).map(item => <Link key={item.href} href={item.href}
            data-testid={item.href === "/path" ? "nav-start-learning" : undefined}
            aria-label={item.href === "/path" ? "开始学习" : undefined}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn("nav-signpost", isActive(item.href) && "is-active")}>{item.name}</Link>)}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0">
          <SpeechControlsButton /><ModeToggle />
          <Button variant="ghost" className="gap-1.5 px-2" aria-label="打开导航菜单" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu className="h-4 w-4" aria-hidden="true" /><span>菜单</span></Button>
        </div>
      </div>
      <Modal isOpen={menuOpen} onClose={() => setMenuOpen(false)} ariaLabelledBy="navigation-title" className="max-w-md p-6 sm:p-8">
        <h2 id="navigation-title" className="mb-6 text-xl font-semibold">学习导航</h2>
        <nav aria-label="移动导航" className="grid grid-cols-2 gap-x-6">
          {navItems.map(item => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
            className={cn("nav-signpost border-b border-border/40 py-4", isActive(item.href) && "is-active")}
            aria-current={isActive(item.href) ? "page" : undefined}>{item.name}</Link>)}
        </nav>
      </Modal>
    </header>
  )
}
