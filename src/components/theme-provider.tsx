"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps, useTheme } from "next-themes"

function ThemeColorSync() {
  const { resolvedTheme } = useTheme()

  React.useEffect(() => {
    if (!resolvedTheme) return
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    meta?.setAttribute("content", resolvedTheme === "dark" ? "#000000" : "#facc15")
  }, [resolvedTheme])

  return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ThemeColorSync />
      {children}
    </NextThemesProvider>
  )
}
