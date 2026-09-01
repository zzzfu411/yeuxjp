"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps, useTheme } from "next-themes"

const THEME_COLOR_BY_MODE = {
  light: "#d8d3cc",
  dark: "#2a2733",
} as const

function ThemeColorSync() {
  const { resolvedTheme } = useTheme()

  React.useEffect(() => {
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return

    const color = THEME_COLOR_BY_MODE[resolvedTheme]
    document
      .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute("content", color))
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
