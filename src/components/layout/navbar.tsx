"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { SpeechControlsButton } from "@/components/ui/speech-controls-button"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { cn } from "@/lib/utils"

const primaryItems = [
  { name: "今日学习", href: "/" },
  { name: "学习路径", href: "/path" },
  { name: "五十音", href: "/kana" },
  { name: "复习", href: "/review" },
]
const navGroups = [
  { name: "学习", items: [...primaryItems, { name: "找学习起点", href: "/placement" }, { name: "专项测验", href: "/quiz" }] },
  { name: "查阅", items: [{ name: "单词", href: "/vocabulary" }, { name: "语法手册", href: "/grammar" }, { name: "近义辨析", href: "/semantics" }, { name: "情境表达", href: "/pragmatics" }] },
  { name: "设置", items: [{ name: "学习与数据设置", href: "/settings" }] },
]

export function Navbar() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/") || (href === "/path" && pathname.startsWith("/learn/"))
  return (
    <header className="paper-nav fixed inset-x-0 top-0 z-[60]">
      <div className="nav-inner">
        <Link href="/" className="brand-lockup" aria-label="や · Yasashi 首页"><span className="brand-mark"><Image src="/assets/brand/ya-calligraphy.png" alt="や" width={52} height={52} sizes="52px" loading="eager" /></span><span className="brand-caption"><strong>Yasashi</strong><span lang="ja">日本語を、少しずつ。</span></span></Link>
        <nav aria-label="主导航" className="hidden items-center gap-8 lg:flex">
          {primaryItems.map(item => <Link key={item.href} href={item.href}
            data-testid={item.href === "/path" ? "nav-start-learning" : undefined}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={cn("nav-signpost", isActive(item.href) && "is-active")}>{item.name}</Link>)}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0">
          <SpeechControlsButton /><ModeToggle />
          <Button variant="ghost" className="gap-1.5 px-2" aria-label="打开导航菜单" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu className="h-4 w-4" aria-hidden="true" /><span>菜单</span></Button>
        </div>
      </div>
      <Modal isOpen={menuOpen} onClose={() => setMenuOpen(false)} ariaLabelledBy="navigation-title" className="max-w-md p-6 sm:p-8">
        <h2 id="navigation-title" className="mb-5 text-xl font-semibold">学习导航</h2>
        <nav aria-label="移动导航" className="space-y-5">
          {navGroups.map(group => <section key={group.name} aria-label={group.name}>
            <h3 className="mb-1 text-sm font-semibold text-muted-foreground">{group.name}</h3>
            <div className="grid grid-cols-2 gap-x-6">{group.items.map(item => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
              className={cn("nav-signpost inline-flex min-h-11 items-center border-b border-border/40 py-3", isActive(item.href) && "is-active")}
              aria-current={isActive(item.href) ? "page" : undefined}>{item.name}</Link>)}</div>
          </section>)}
        </nav>
      </Modal>
    </header>
  )
}
