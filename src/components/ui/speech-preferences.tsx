"use client"

import { runLearningWrite } from "@/lib/learning-write-lock"

import * as React from "react"
import { PracticeSaveError } from "@/components/practice/practice-save-error"
import { Button } from "@/components/ui/button"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"
import { STORAGE_KEYS } from "@/lib/storage-keys"
import { cn } from "@/lib/utils"
import {
  DEFAULT_SPEECH_PREFERENCES,
  DEFAULT_SPEECH_PREFS_STORAGE_KEY,
  SPEECH_PREFS_EVENT,
  loadSpeechPreferences,
  resetSpeechPreferencesWithStatus,
  updateSpeechPreferencesWithStatus,
  type SpeechUserPreferences,
} from "@/lib/speech"

export type SpeechPreferences = SpeechUserPreferences

type SpeechPreferencesContextValue = {
  prefs: SpeechPreferences
  update: (patch: Partial<SpeechPreferences>) => Promise<boolean>
  reset: () => Promise<boolean>
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

    const onSpeechPrefs = (event: Event) => {
      const detail = (event as CustomEvent).detail as { storageKey?: string } | undefined
      if (detail?.storageKey !== storageKey) return
      syncPreferences()
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener(LEARNING_STORE_EVENT, onLearningStore)
    window.addEventListener(SPEECH_PREFS_EVENT, onSpeechPrefs)

    return () => {
      cancelled = true
      window.removeEventListener("storage", onStorage)
      window.removeEventListener(LEARNING_STORE_EVENT, onLearningStore)
      window.removeEventListener(SPEECH_PREFS_EVENT, onSpeechPrefs)
    }
  }, [storageKey])

  const update = React.useCallback(
    async (patch: Partial<SpeechPreferences>) => {
      const result = await runLearningWrite(() => updateSpeechPreferencesWithStatus(patch, storageKey))
      if (!result) return false
      setPrefs(result.prefs)
      return result.saved
    },
    [storageKey]
  )

  const reset = React.useCallback(async () => {
    const result = await runLearningWrite(() => resetSpeechPreferencesWithStatus(storageKey))
    if (!result) return false
    setPrefs(result.prefs)
    return result.saved
  }, [storageKey])

  const value = React.useMemo<SpeechPreferencesContextValue>(() => ({ prefs, update, reset }), [prefs, reset, update])

  return <SpeechPreferencesContext.Provider value={value}>{children}</SpeechPreferencesContext.Provider>
}

export function SpeechSettingsBar({
  className,
  showQuizOptions = false,
  collapsible = false,
}: {
  className?: string
  showQuizOptions?: boolean
  collapsible?: boolean
}) {
  const ctx = useSpeechPreferences()
  const [saveError, setSaveError] = React.useState(false)
  const update = ctx?.update
  const reset = ctx?.reset

  const savePatch = React.useCallback(
    async (patch: Partial<SpeechPreferences>) => {
      if (!update) return
      setSaveError(!await update(patch))
    },
    [update]
  )

  const resetPrefs = React.useCallback(async () => {
    if (!reset) return
    setSaveError(!await reset())
  }, [reset])

  if (!ctx) return null
  const { prefs } = ctx

  const rateOptions: { label: string; value: number }[] = [
    { label: "很慢", value: 0.75 },
    { label: "较慢", value: 0.9 },
    { label: "正常", value: 1.0 },
  ]

  const body = (
    <div className={cn("paper-sheet w-full space-y-4 p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="eyebrow">听力 · Listening</div>
          <div className="text-sm font-semibold text-foreground">听力设置</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-none border-0 border-b border-dashed border-border/70 bg-transparent px-1 font-normal text-muted-foreground shadow-none hover:translate-y-0 hover:border-accent hover:bg-transparent hover:text-accent"
          data-testid="speech-preferences-reset"
          onClick={resetPrefs}
        >
          恢复默认
        </Button>
      </div>

      <div className="ledger-row flex flex-wrap items-center gap-2 border-b border-border/45 pb-3">
        <div className="w-16 text-xs text-muted-foreground">语速</div>
        <div className="flex" role="group" aria-label="朗读语速">
          {rateOptions.map((opt, index) => (
            <Button
              key={opt.value}
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "rounded-none border-border/55 bg-transparent font-normal shadow-none hover:translate-y-0 hover:bg-muted/35",
                index > 0 && "-ml-px",
                prefs.rate === opt.value && "z-[1] border-accent bg-accent/[0.05] text-accent"
              )}
              data-testid={`speech-rate-${String(opt.value).replace(".", "-")}`}
              onClick={() => savePatch({ rate: opt.value })}
              aria-pressed={prefs.rate === opt.value}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="font-scribble ml-1 text-sm text-muted-foreground">{prefs.rate.toFixed(2)}x</div>
      </div>

      {showQuizOptions && (
        <div className="ledger-row flex flex-wrap items-center gap-2 border-b border-border/45 pb-3">
          <div className="w-16 text-xs text-muted-foreground">重复</div>
          <div className="flex" role="group" aria-label="朗读重复次数">
            {[1, 2, 3].map((n, index) => (
              <Button
                key={n}
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-none border-border/55 bg-transparent font-normal shadow-none hover:translate-y-0 hover:bg-muted/35",
                  index > 0 && "-ml-px",
                  prefs.repeat === n && "z-[1] border-accent bg-accent/[0.05] text-accent"
                )}
                data-testid={`speech-repeat-${n}`}
                onClick={() => savePatch({ repeat: n as 1 | 2 | 3 })}
                aria-pressed={prefs.repeat === n}
              >
                x{n}
              </Button>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "ml-2 rounded-sm border-border/55 bg-transparent font-normal shadow-none hover:translate-y-0 hover:bg-muted/35",
              prefs.autoPlay && "border-accent bg-accent/[0.05] text-accent"
            )}
            data-testid="speech-autoplay-toggle"
            onClick={() => savePatch({ autoPlay: !prefs.autoPlay })}
            aria-pressed={prefs.autoPlay}
          >
            {prefs.autoPlay ? "自动播放：开" : "自动播放：关"}
          </Button>
        </div>
      )}

      <PracticeSaveError
        show={saveError}
        title="语音设置没有保存成功"
        description="请检查浏览器存储权限或剩余空间，然后再试一次。"
      />
    </div>
  )
  return collapsible ? <details className="my-3 border-y border-border/35 text-sm">
    <summary className="cursor-pointer px-1 py-3 text-muted-foreground">听力设置 · {prefs.rate.toFixed(2)}x</summary>
    {body}
  </details> : body
}
