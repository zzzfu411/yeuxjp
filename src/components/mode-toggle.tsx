"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      type="button"
      aria-label="切换浅色 / 黑夜"
      title="切换浅色 / 黑夜"
      className="relative inline-flex h-10 w-10 items-center justify-center border-[3px] border-foreground bg-card text-foreground shadow-hard-sm transition-transform hover:-translate-x-px hover:-translate-y-px hover:bg-primary"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
