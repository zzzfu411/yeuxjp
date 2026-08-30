"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      title={resolvedTheme === "dark" ? "切换到原纸" : "切换到夜墨"}
      className="relative inline-flex h-10 w-10 items-center justify-center border border-transparent bg-transparent text-foreground transition-colors hover:border-border/60 hover:bg-primary/10"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">原纸 / 夜墨</span>
    </button>
  )
}
