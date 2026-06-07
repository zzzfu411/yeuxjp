import { useCallback, useEffect, useMemo, useState } from "react"
import { LEARNING_STORE_EVENT } from "@/lib/learning-store"
import { applySrsResult, createSrsState, removeSrs, setSrsState, clearSrs } from "@/lib/srs"
import { STORAGE_KEYS } from "@/lib/storage-keys"

export type MistakeOption = { value: string; display: string }

export type MistakeItem = {
  id: string
  type: string
  questionText?: string
  questionAudio?: string
  correctAnswer: string
  correctDisplay?: string
  lastWrongAnswer?: string
  explanation?: string
  meta?: {
    verb?: { dict: string; kanji?: string; meaning: string; kind: string }
    askedForm?: { id: string; label: string }
  }
  options: MistakeOption[]
  wrongCount: number
  createdAt: number
  lastWrongAt: number
}

const DEFAULT_STORAGE_KEY = STORAGE_KEYS.MISTAKES
export const MISTAKE_SRS_STORAGE_KEY = STORAGE_KEYS.SRS_MISTAKES

// 类型安全的meta验证函数
function validateMeta(meta: unknown): MistakeItem["meta"] | undefined {
  if (!meta || typeof meta !== "object") return undefined

  const m = meta as Record<string, unknown>
  const result: MistakeItem["meta"] = {}

  // 验证verb字段
  if (m.verb && typeof m.verb === "object") {
    const v = m.verb as Record<string, unknown>
    if (typeof v.dict === "string" && typeof v.meaning === "string" && typeof v.kind === "string") {
      result.verb = {
        dict: v.dict,
        kanji: typeof v.kanji === "string" ? v.kanji : undefined,
        meaning: v.meaning,
        kind: v.kind,
      }
    }
  }

  // 验证askedForm字段
  if (m.askedForm && typeof m.askedForm === "object") {
    const f = m.askedForm as Record<string, unknown>
    if (typeof f.id === "string" && typeof f.label === "string") {
      result.askedForm = { id: f.id, label: f.label }
    }
  }

  // 如果没有有效字段，返回undefined
  return result.verb || result.askedForm ? result : undefined
}

function readList(storageKey: string): MistakeItem[] {
  if (typeof window === "undefined") return []

  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const cleaned = parsed
      .filter((x) => x && typeof x === "object")
      .map((x) => x as Partial<MistakeItem>)
      .filter((x) => typeof x.id === "string" && typeof x.type === "string" && typeof x.correctAnswer === "string")
      .map((x) => ({
        id: x.id!,
        type: x.type!,
        questionText: x.questionText,
        questionAudio: x.questionAudio,
        correctAnswer: x.correctAnswer!,
        correctDisplay: x.correctDisplay,
        lastWrongAnswer: x.lastWrongAnswer,
        explanation: x.explanation,
        meta: validateMeta(x.meta),  // 使用类型安全的验证函数
        options: Array.isArray(x.options)
          ? (x.options
              .filter((o) => o && typeof o === "object")
              .map((o) => o as Partial<MistakeOption>)
              .filter((o) => typeof o.value === "string" && typeof o.display === "string")
              .map((o) => ({ value: o.value!, display: o.display! })) as MistakeOption[])
          : [],
        wrongCount: typeof x.wrongCount === "number" ? Math.max(1, Math.floor(x.wrongCount)) : 1,
        createdAt: typeof x.createdAt === "number" ? x.createdAt : Date.now(),
        lastWrongAt: typeof x.lastWrongAt === "number" ? x.lastWrongAt : Date.now(),
      }))

    const byId = new Map<string, MistakeItem>()
    for (const item of cleaned) {
      const prev = byId.get(item.id)
      if (!prev) byId.set(item.id, item)
      else if ((item.lastWrongAt ?? 0) >= (prev.lastWrongAt ?? 0)) byId.set(item.id, item)
    }

    return Array.from(byId.values()).sort((a, b) => b.lastWrongAt - a.lastWrongAt)
  } catch (e) {
    // 添加错误日志
    if (process.env.NODE_ENV === "development") {
      console.warn("[mistake-notebook] Failed to read from localStorage:", e)
    }
    return []
  }
}

function writeList(storageKey: string, list: MistakeItem[]): boolean {
  if (typeof window === "undefined") return false
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(list))
    return true
  } catch (e) {
    // 添加错误日志
    if (process.env.NODE_ENV === "development") {
      console.warn("[mistake-notebook] Failed to write to localStorage:", e)
    }
    return false
  }
}

function buildId(input: { type: string; questionText?: string; questionAudio?: string; correctAnswer: string }) {
  const qt = input.questionText ?? ""
  const qa = input.questionAudio ?? ""
  return `${input.type}::${qt}::${qa}::${input.correctAnswer}`
}

export function useMistakeNotebook(storageKey: string = DEFAULT_STORAGE_KEY) {
  const [list, setList] = useState<MistakeItem[]>(() => [])

  useEffect(() => {
    let cancelled = false

    Promise.resolve().then(() => {
      if (cancelled) return
      setList(readList(storageKey))
    })

    const sync = () => setList(readList(storageKey))

    const onStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return
      sync()
    }

    const onLearningStore = (event: Event) => {
      const detail = (event as CustomEvent).detail as { keys?: readonly string[] } | undefined
      if (!detail?.keys?.includes(storageKey)) return
      sync()
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener(LEARNING_STORE_EVENT, onLearningStore)

    return () => {
      cancelled = true
      window.removeEventListener("storage", onStorage)
      window.removeEventListener(LEARNING_STORE_EVENT, onLearningStore)
    }
  }, [storageKey])

  const byId = useMemo(() => new Map(list.map((x) => [x.id, x])), [list])

  const recordWrong = useCallback(
    (input: {
      type: string
      questionText?: string
      questionAudio?: string
      correctAnswer: string
      correctDisplay?: string
      wrongAnswer: string
      explanation?: string
      meta?: MistakeItem["meta"]
      options: MistakeOption[]
      id?: string
    }) => {
      const now = Date.now()
      const id = input.id ?? buildId({ type: input.type, questionText: input.questionText, questionAudio: input.questionAudio, correctAnswer: input.correctAnswer })

      // For mistakes, we want "review soon" by default.
      setSrsState(MISTAKE_SRS_STORAGE_KEY, id, applySrsResult(createSrsState(now), "again", now))

      setList((prev) => {
        const next = [...prev]
        const idx = next.findIndex((x) => x.id === id)
        const base: MistakeItem | null = idx >= 0 ? next[idx] : null

        const updated: MistakeItem = {
          id,
          type: input.type,
          questionText: input.questionText,
          questionAudio: input.questionAudio,
          correctAnswer: input.correctAnswer,
          correctDisplay: input.correctDisplay,
          lastWrongAnswer: input.wrongAnswer,
          explanation: input.explanation,
          meta: input.meta,
          options: input.options ?? [],
          wrongCount: (base?.wrongCount ?? 0) + 1,
          createdAt: base?.createdAt ?? now,
          lastWrongAt: now,
        }

        if (idx >= 0) next[idx] = updated
        else next.unshift(updated)

        next.sort((a, b) => b.lastWrongAt - a.lastWrongAt)
        writeList(storageKey, next)
        return next
      })
    },
    [storageKey]
  )

  const remove = useCallback(
    (id: string) => {
      setList((prev) => {
        const next = prev.filter((x) => x.id !== id)
        writeList(storageKey, next)
        return next
      })
      removeSrs(MISTAKE_SRS_STORAGE_KEY, id)
    },
    [storageKey]
  )

  const clear = useCallback(() => {
    setList(() => {
      writeList(storageKey, [])
      return []
    })
    clearSrs(MISTAKE_SRS_STORAGE_KEY)
  }, [storageKey])

  return { list, byId, recordWrong, remove, clear }
}
