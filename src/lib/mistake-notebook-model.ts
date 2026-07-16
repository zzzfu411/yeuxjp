import type { PracticeItemType, PracticeMode } from "@/lib/learning-progress-model"
import { inferKanaScriptFromText, normalizeKanaPracticeItemId } from "@/lib/kana-id"

export type MistakeOption = { value: string; display: string }

export type MistakeMeta = {
  verb?: { dict: string; kanji?: string; meaning: string; kind: string }
  askedForm?: { id: string; label: string }
}

export type MistakeItem = {
  id: string
  type: string
  questionText?: string
  questionAudio?: string
  itemId?: string
  itemType?: PracticeItemType
  mode?: PracticeMode
  correctAnswer: string
  acceptedAnswers?: string[]
  correctDisplay?: string
  lastWrongAnswer?: string
  explanation?: string
  meta?: MistakeMeta
  options: MistakeOption[]
  wrongCount: number
  createdAt: number
  lastWrongAt: number
}

export type RecordMistakeInput = {
  type: string
  questionText?: string
  questionAudio?: string
  itemId?: string
  itemType?: PracticeItemType
  mode?: PracticeMode
  correctAnswer: string
  acceptedAnswers?: string[]
  correctDisplay?: string
  wrongAnswer: string
  explanation?: string
  meta?: MistakeMeta
  options?: MistakeOption[]
  id?: string
}

type MistakeIdentityInput = {
  type: string
  questionText?: string
  questionAudio?: string
  correctAnswer: string
}

function stringOrUndefined(value: unknown) {
  return typeof value === "string" ? value : undefined
}

function safeTimestamp(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  return Number.isFinite(fallback) ? fallback : 0
}

function safeCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1
}

const PRACTICE_ITEM_TYPES = new Set<PracticeItemType>(["kana", "vocab", "grammar", "sentence", "lesson"])
const PRACTICE_MODES = new Set<PracticeMode>(["recognition", "listening", "meaning", "recall", "production"])

function normalizeMistakeProgressMetadata(input: Record<string, unknown>) {
  if (typeof input.itemId !== "string" || !input.itemId.trim()) return null
  if (typeof input.itemType !== "string" || !PRACTICE_ITEM_TYPES.has(input.itemType as PracticeItemType)) return null
  if (typeof input.mode !== "string" || !PRACTICE_MODES.has(input.mode as PracticeMode)) return null

  const itemType = input.itemType as PracticeItemType
  const itemId =
    itemType === "kana"
      ? normalizeKanaPracticeItemId(input.itemId, {
          scriptHint: inferKanaScriptFromText(input.questionText, input.questionAudio, input.correctDisplay),
          textHints: [input.questionText, input.questionAudio, input.correctDisplay],
        })
      : input.itemId
  if (!itemId) return null

  return {
    itemId,
    itemType,
    mode: input.mode as PracticeMode,
  }
}

export function buildMistakeId(input: MistakeIdentityInput) {
  const qt = input.questionText ?? ""
  const qa = input.questionAudio ?? ""
  return `${input.type}::${qt}::${qa}::${input.correctAnswer}`
}

export function normalizeMistakeMeta(meta: unknown): MistakeMeta | undefined {
  if (!meta || typeof meta !== "object") return undefined

  const source = meta as Record<string, unknown>
  const normalized: MistakeMeta = {}

  if (source.verb && typeof source.verb === "object") {
    const verb = source.verb as Record<string, unknown>
    if (typeof verb.dict === "string" && typeof verb.meaning === "string" && typeof verb.kind === "string") {
      normalized.verb = {
        dict: verb.dict,
        kanji: stringOrUndefined(verb.kanji),
        meaning: verb.meaning,
        kind: verb.kind,
      }
    }
  }

  if (source.askedForm && typeof source.askedForm === "object") {
    const askedForm = source.askedForm as Record<string, unknown>
    if (typeof askedForm.id === "string" && typeof askedForm.label === "string") {
      normalized.askedForm = { id: askedForm.id, label: askedForm.label }
    }
  }

  return normalized.verb || normalized.askedForm ? normalized : undefined
}

export function normalizeMistakeOptions(options: unknown): MistakeOption[] {
  if (!Array.isArray(options)) return []

  const seen = new Set<string>()
  const normalized: MistakeOption[] = []

  for (const option of options) {
    if (!option || typeof option !== "object") continue
    const item = option as Record<string, unknown>
    if (typeof item.value !== "string" || typeof item.display !== "string") continue
    if (seen.has(item.value)) continue
    seen.add(item.value)
    normalized.push({ value: item.value, display: item.display })
  }

  return normalized
}

export function normalizeAcceptedMistakeAnswers(answers: unknown): string[] | undefined {
  if (!Array.isArray(answers)) return undefined

  const seen = new Set<string>()
  const normalized: string[] = []

  for (const answer of answers) {
    if (typeof answer !== "string") continue
    const value = answer.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    normalized.push(value)
  }

  return normalized.length ? normalized : undefined
}

export function normalizeMistakeList(input: unknown, now: number = Date.now()): MistakeItem[] {
  const safeNow = safeTimestamp(now, 0)
  if (!Array.isArray(input)) return []

  const byId = new Map<string, MistakeItem>()

  for (const value of input) {
    if (!value || typeof value !== "object") continue
    const item = value as Record<string, unknown>
    if (typeof item.id !== "string" || typeof item.type !== "string" || typeof item.correctAnswer !== "string") continue

    const normalized: MistakeItem = {
      id: item.id,
      type: item.type,
      questionText: stringOrUndefined(item.questionText),
      questionAudio: stringOrUndefined(item.questionAudio),
      ...normalizeMistakeProgressMetadata(item),
      correctAnswer: item.correctAnswer,
      acceptedAnswers: normalizeAcceptedMistakeAnswers(item.acceptedAnswers),
      correctDisplay: stringOrUndefined(item.correctDisplay),
      lastWrongAnswer: stringOrUndefined(item.lastWrongAnswer),
      explanation: stringOrUndefined(item.explanation),
      meta: normalizeMistakeMeta(item.meta),
      options: normalizeMistakeOptions(item.options),
      wrongCount: safeCount(item.wrongCount),
      createdAt: safeTimestamp(item.createdAt, safeNow),
      lastWrongAt: safeTimestamp(item.lastWrongAt, safeNow),
    }

    const previous = byId.get(normalized.id)
    if (!previous || normalized.lastWrongAt >= previous.lastWrongAt) {
      byId.set(normalized.id, normalized)
    }
  }

  return Array.from(byId.values()).sort((a, b) => b.lastWrongAt - a.lastWrongAt)
}

export function upsertWrongMistake(previous: readonly MistakeItem[], input: RecordMistakeInput, now: number = Date.now()) {
  const safeNow = safeTimestamp(now, 0)
  const id = input.id ?? buildMistakeId(input)
  const index = previous.findIndex((item) => item.id === id)
  const base = index >= 0 ? previous[index] : null
  const progressMetadata =
    normalizeMistakeProgressMetadata(input as Record<string, unknown>) ??
    (base ? normalizeMistakeProgressMetadata(base as unknown as Record<string, unknown>) : null)

  const updated: MistakeItem = {
    id,
    type: input.type,
    questionText: input.questionText,
    questionAudio: input.questionAudio,
    ...(progressMetadata ?? {}),
    correctAnswer: input.correctAnswer,
    acceptedAnswers: normalizeAcceptedMistakeAnswers(input.acceptedAnswers) ?? base?.acceptedAnswers,
    correctDisplay: input.correctDisplay,
    lastWrongAnswer: input.wrongAnswer,
    explanation: input.explanation,
    meta: input.meta,
    options: normalizeMistakeOptions(input.options),
    wrongCount: (base?.wrongCount ?? 0) + 1,
    createdAt: base?.createdAt ?? safeNow,
    lastWrongAt: safeNow,
  }

  const next = [...previous]
  if (index >= 0) next[index] = updated
  else next.unshift(updated)

  return normalizeMistakeList(next, safeNow)
}

export function removeMistakeById(previous: readonly MistakeItem[], id: string) {
  if (!previous.some((item) => item.id === id)) return previous
  return previous.filter((item) => item.id !== id)
}
