"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

const emptySubscribe = () => () => {}

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = React.useSyncExternalStore(emptySubscribe, () => true, () => false)
  const action = !mounted ? "切换明暗主题" : resolvedTheme === "dark" ? "切换为明亮主题" : "切换为深色主题"

  return (
    <button
      type="button"
      aria-label={action}
      title={action}
      data-testid="theme-toggle"
      className="nav-icon-toggle relative inline-flex h-10 w-10 items-center justify-center text-foreground transition-colors"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun aria-hidden="true" className="h-4 w-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      <Moon aria-hidden="true" className="absolute h-4 w-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
    </button>
  )
}
