"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { cn } from "@/lib/utils"
import {
  DEFAULT_SPEECH_PREFERENCES,
  DEFAULT_SPEECH_PREFS_STORAGE_KEY,
  loadSpeechPreferences,
  resetSpeechPreferences,
  updateSpeechPreferences,
  type SpeechUserPreferences,
} from "@/lib/speech"

export type SpeechPreferences = SpeechUserPreferences

type SpeechPreferencesContextValue = {
  prefs: SpeechPreferences
  update: (patch: Partial<SpeechPreferences>) => void
  reset: () => void
}

const SpeechPreferencesContext = React.createContext<SpeechPreferencesContextValue | null>(null)

export function useSpeechPreferences() {
  return React.useContext(SpeechPreferencesContext)
}

export function SpeechPreferencesProvider({
  children,
  storageKey = DEFAULT_SPEECH_PREFS_STORAGE_KEY,
}: {
  children: React.ReactNode
  storageKey?: string
}) {
  const [prefs, setPrefs] = React.useState<SpeechPreferences>(() => DEFAULT_SPEECH_PREFERENCES)

  React.useEffect(() => {
    let cancelled = false

    const syncPreferences = () => {
      const loaded = loadSpeechPreferences(storageKey)
      setPrefs(loaded)
    }

    Promise.resolve().then(() => {
      if (cancelled) return
      syncPreferences()
    })

    const onLearningStore = (event: Event) => {
      const detail = (event as CustomEvent).detail as { keys?: readonly string[] } | undefined
      if (!detail?.keys?.includes(STORAGE_KEYS.SPEECH_PREFS)) return
      syncPreferences()
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return
      syncPreferences()
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener(LEARNING_STORE_EVENT, onLearningStore)

    return () => {
      cancelled = true
      window.removeEventListener("storage", onStorage)
      window.removeEventListener(LEARNING_STORE_EVENT, onLearningStore)
    }
  }, [storageKey])

  const update = React.useCallback(
    (patch: Partial<SpeechPreferences>) => {
      setPrefs(() => updateSpeechPreferences(patch, storageKey))
    },
    [storageKey]
  )

  const reset = React.useCallback(() => {
    setPrefs(() => resetSpeechPreferences(storageKey))
  }, [storageKey])

  const value = React.useMemo<SpeechPreferencesContextValue>(() => ({ prefs, update, reset }), [prefs, reset, update])

  return <SpeechPreferencesContext.Provider value={value}>{children}</SpeechPreferencesContext.Provider>
}

export function SpeechSettingsBar({
  className,
  showQuizOptions = false,
}: {
  className?: string
  showQuizOptions?: boolean
}) {
  const ctx = useSpeechPreferences()
  if (!ctx) return null
  const { prefs, update, reset } = ctx

  const rateOptions: { label: string; value: number }[] = [
    { label: "很慢", value: 0.75 },
    { label: "较慢", value: 0.85 },
    { label: "正常", value: 1.0 },
  ]

  return (
    <div className={cn("w-full rounded-xl border bg-muted/10 p-4 space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-foreground">听力设置</div>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={reset}>
          恢复默认
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="text-xs text-muted-foreground w-16">语速</div>
        {rateOptions.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            variant={prefs.rate === opt.value ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => update({ rate: opt.value })}
          >
            {opt.label}
          </Button>
        ))}
        <div className="text-xs text-muted-foreground ml-1 font-mono">{prefs.rate.toFixed(2)}x</div>
      </div>

      {showQuizOptions && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs text-muted-foreground w-16">重复</div>
          {[1, 2, 3].map((n) => (
            <Button
              key={n}
              type="button"
              variant={prefs.repeat === n ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => update({ repeat: n as 1 | 2 | 3 })}
            >
              ×{n}
            </Button>
          ))}

          <div className="w-4" />

          <Button
            type="button"
            variant={prefs.autoPlay ? "secondary" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => update({ autoPlay: !prefs.autoPlay })}
          >
            {prefs.autoPlay ? "自动播放：开" : "自动播放：关"}
          </Button>
        </div>
      )}
    </div>
  )
}
