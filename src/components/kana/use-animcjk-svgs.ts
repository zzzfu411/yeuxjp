"use client"

import { useEffect, useMemo, useState } from "react"
import { getAnimCjkKanaUrl, parseAnimCJK, type ParsedAnimCjkSvg } from "@/lib/animcjk"

interface AnimCjkSvgState {
  key: string
  svgs?: ParsedAnimCjkSvg[]
  error?: string
}

export function useAnimCjkSvgs(char: string) {
  const parts = useMemo(() => Array.from(char), [char])
  const cacheKey = useMemo(() => parts.join(""), [parts])
  const [parsed, setParsed] = useState<AnimCjkSvgState | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const results = await Promise.all(
          parts.map(async (part) => {
            const url = getAnimCjkKanaUrl(part)
            if (!url) throw new Error("Invalid character")

            const res = await fetch(url)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const text = await res.text()
            return parseAnimCJK(text)
          })
        )

        if (cancelled) return
        setParsed({ key: cacheKey, svgs: results })
      } catch (err) {
        if (cancelled) return
        setParsed({ key: cacheKey, error: err instanceof Error ? err.message : String(err) })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [cacheKey, parts])

  return {
    parts,
    cacheKey,
    svgs: parsed?.key === cacheKey ? parsed.svgs ?? null : null,
    error: parsed?.key === cacheKey ? parsed.error ?? null : null,
  }
}
