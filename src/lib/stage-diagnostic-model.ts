import { DIAGNOSTIC_RULES, STAGE_DIAGNOSTICS, diagnosticVersion, diagnosticSnapshotVersion, type DiagnosticQuestion, type DiagnosticDomain } from "@/data/stage-diagnostics"
import type { CoursePhaseId } from "@/lib/course-phases"
import { contentFingerprint } from "@/lib/content-fingerprint"
import { normalizeAnswer } from "@/lib/questions"
import { shuffleList } from "@/lib/question-options"
import { createSeededRandom } from "@/lib/seeded-random"

export type DiagnosticAttempt = {
  id: string
  phase: CoursePhaseId
  version: string
  rules: { totalPercent: number; domainPercent: number; questionCount: number; kanjiMinimum: number }
  questions: DiagnosticQuestion[]
  createdAt: number
  completedAt?: number
  answers: Record<string, { value: string; answeredAt: number }>
  heardAudio: string[]
  assistedAudio: string[]
  usedReferences: boolean
}
export type DiagnosticStore = { attempts: Record<string, DiagnosticAttempt>; entryAttemptId?: string }
export const EMPTY_DIAGNOSTIC_STORE: DiagnosticStore = { attempts: {} }
export const DIAGNOSTIC_DOMAINS: DiagnosticDomain[] = ["words", "grammar", "reading", "listening"]
const ENTRY_AFTER_PHASE: Record<CoursePhaseId, 46 | 91 | 136 | null> = { n5: 46, n4: 91, n3: 136, n2: null }
const isObject = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value)
const validTime = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0 && Number.isFinite(new Date(value).getTime())
const safeKey = (value: unknown): value is string => typeof value === "string" && value.length > 0 && !["__proto__", "constructor", "prototype"].includes(value)
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(v => typeof v === "string")

export function diagnosticAudioId(question: DiagnosticQuestion) { return question.audio ? contentFingerprint(question.audio) : null }
export function diagnosticDefinitionIsCurrent(attempt: DiagnosticAttempt) {
  return attempt.version === diagnosticVersion(attempt.phase) && diagnosticSnapshotVersion(attempt.rules, attempt.questions) === attempt.version
}
export function createDiagnosticAttempt(phase: CoursePhaseId, id: string, now: number): DiagnosticAttempt {
  return { id, phase, version: diagnosticVersion(phase), rules: { ...DIAGNOSTIC_RULES }, questions: structuredClone(STAGE_DIAGNOSTICS[phase]), createdAt: now,
    answers: {}, heardAudio: [], assistedAudio: [], usedReferences: false }
}
export function diagnosticOptions(question: DiagnosticQuestion, attemptId: string) {
  return shuffleList(question.options, createSeededRandom(`${attemptId}:${question.id}`))
}
function readingAnswer(value: string) {
  return normalizeAnswer(value).replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 0x60))
}
export function diagnosticAnswerMatches(question: DiagnosticQuestion, value: string) {
  return question.readingInput ? readingAnswer(value) === readingAnswer(question.answer) : normalizeAnswer(value) === normalizeAnswer(question.answer)
}
export function summarizeDiagnostic(attempt: DiagnosticAttempt) {
  const current = diagnosticDefinitionIsCurrent(attempt)
  const complete = attempt.completedAt !== undefined && attempt.questions.every(q => Object.hasOwn(attempt.answers, q.id))
  const rows = attempt.questions.map(question => {
    const answer = attempt.answers[question.id]
    const audioId = diagnosticAudioId(question)
    const independent = !attempt.usedReferences && (!audioId || (attempt.heardAudio.includes(audioId) && !attempt.assistedAudio.includes(audioId)))
    const correct = !!answer && diagnosticAnswerMatches(question, answer.value)
    return { question, answer, correct, independent, independentCorrect: correct && independent }
  })
  const domains = DIAGNOSTIC_DOMAINS.map(domain => {
    const items = rows.filter(row => row.question.domain === domain)
    const correct = items.filter(row => row.independentCorrect).length
    return { domain, total: items.length, answered: items.filter(row => row.answer).length, correct,
      passed: items.length > 0 && correct / items.length * 100 >= attempt.rules.domainPercent }
  })
  const correct = rows.filter(row => row.independentCorrect).length
  const score = attempt.questions.length ? Math.round(correct / attempt.questions.length * 100) : 0
  const kanji = rows.filter(row => row.question.readingInput)
  const kanjiCorrect = kanji.filter(row => row.independentCorrect).length
  const passed = current && complete && correct / attempt.questions.length * 100 >= attempt.rules.totalPercent
    && domains.every(domain => domain.passed) && kanjiCorrect >= attempt.rules.kanjiMinimum
  return { current, complete, rows, domains, correct, score, kanjiCorrect, kanjiTotal: kanji.length, passed,
    entryOrder: passed ? ENTRY_AFTER_PHASE[attempt.phase] : null }
}
export function getDiagnosticEntryOrder(store: DiagnosticStore): 1 | 46 | 91 | 136 {
  const attempt = store.entryAttemptId ? store.attempts[store.entryAttemptId] : null
  return attempt ? summarizeDiagnostic(attempt).entryOrder ?? 1 : 1
}

export function normalizeDiagnosticStore(input: unknown): DiagnosticStore | null {
  if (!isObject(input) || !isObject(input.attempts)) return null
  const attempts: Record<string, DiagnosticAttempt> = {}
  for (const [id, raw] of Object.entries(input.attempts)) {
    if (!safeKey(id) || !isObject(raw) || raw.id !== id || !safeKey(raw.phase) || !Object.hasOwn(STAGE_DIAGNOSTICS, raw.phase)
      || typeof raw.version !== "string" || !validTime(raw.createdAt) || (raw.completedAt !== undefined && !validTime(raw.completedAt))
      || typeof raw.usedReferences !== "boolean" || !strings(raw.heardAudio) || !strings(raw.assistedAudio)
      || !isObject(raw.rules) || !isObject(raw.answers) || !Array.isArray(raw.questions) || !raw.questions.length) return null
    const rules = raw.rules
    if (![rules.totalPercent, rules.domainPercent].every(v => typeof v === "number" && Number.isFinite(v) && v > 0 && v <= 100)
      || !Number.isInteger(rules.questionCount) || rules.questionCount !== raw.questions.length
      || !Number.isInteger(rules.kanjiMinimum) || (rules.kanjiMinimum as number) < 0) return null
    const questions: DiagnosticQuestion[] = []
    for (const value of raw.questions) {
      if (!isObject(value) || !safeKey(value.id) || typeof value.domain !== "string" || !DIAGNOSTIC_DOMAINS.includes(value.domain as DiagnosticDomain)
        || typeof value.prompt !== "string" || typeof value.answer !== "string" || !value.answer || typeof value.explanation !== "string"
        || !strings(value.options) || (value.passage !== undefined && typeof value.passage !== "string")
        || (value.audio !== undefined && typeof value.audio !== "string") || (value.readingInput !== undefined && typeof value.readingInput !== "boolean")) return null
      questions.push({ id: value.id, domain: value.domain as DiagnosticDomain, prompt: value.prompt, answer: value.answer, options: [...value.options], explanation: value.explanation,
        ...(value.passage !== undefined ? { passage: value.passage } : {}), ...(value.audio !== undefined ? { audio: value.audio } : {}), ...(value.readingInput !== undefined ? { readingInput: value.readingInput } : {}) })
    }
    if (new Set(questions.map(q => q.id)).size !== questions.length) return null
    const clipIds = new Set(questions.map(diagnosticAudioId).filter(Boolean))
    if ([...raw.heardAudio, ...raw.assistedAudio].some(id => !clipIds.has(id))) return null
    const answers: DiagnosticAttempt["answers"] = {}
    for (const [key, value] of Object.entries(raw.answers)) {
      const question = questions.find(q => q.id === key)
      if (!question || !isObject(value) || typeof value.value !== "string" || !validTime(value.answeredAt) || value.answeredAt < raw.createdAt
        || (question.options.length && value.value !== "" && !question.options.includes(value.value))) return null
      answers[key] = { value: value.value, answeredAt: value.answeredAt }
    }
    if (raw.completedAt !== undefined && (Object.keys(answers).length !== questions.length || raw.completedAt < raw.createdAt
      || Object.values(answers).some(answer => answer.answeredAt > (raw.completedAt as number)))) return null
    const attempt: DiagnosticAttempt = { id, phase: raw.phase as CoursePhaseId, version: raw.version,
      rules: { totalPercent: rules.totalPercent as number, domainPercent: rules.domainPercent as number, questionCount: rules.questionCount as number, kanjiMinimum: rules.kanjiMinimum as number },
      questions, createdAt: raw.createdAt, ...(raw.completedAt !== undefined ? { completedAt: raw.completedAt } : {}), answers,
      heardAudio: [...new Set(raw.heardAudio)], assistedAudio: [...new Set(raw.assistedAudio)], usedReferences: raw.usedReferences }
    if (diagnosticSnapshotVersion(attempt.rules, attempt.questions) !== attempt.version) return null
    attempts[id] = attempt
  }
  if (input.entryAttemptId !== undefined && (!safeKey(input.entryAttemptId) || !attempts[input.entryAttemptId])) return null
  return { attempts, ...(typeof input.entryAttemptId === "string" ? { entryAttemptId: input.entryAttemptId } : {}) }
}

/** Immutable actions are applied to the latest stored value under the shared learning lock. */
export type DiagnosticAction =
  | { type: "start"; phase: CoursePhaseId; id: string }
  | { type: "answer"; id: string; questionId: string; value: string }
  | { type: "heard" | "transcript"; id: string; questionId: string }
  | { type: "references"; id: string }
  | { type: "adopt"; id: string }
  | { type: "reset-entry" }
export function applyDiagnosticAction(store: DiagnosticStore, action: DiagnosticAction, now: number): DiagnosticStore | null {
  if (!validTime(now)) return null
  if (action.type === "reset-entry") return { attempts: store.attempts }
  if (action.type === "start") {
    if (!safeKey(action.id) || store.attempts[action.id] || !Object.hasOwn(STAGE_DIAGNOSTICS, action.phase)) return null
    return { ...store, attempts: { ...store.attempts, [action.id]: createDiagnosticAttempt(action.phase, action.id, now) } }
  }
  const attempt = store.attempts[action.id]
  if (!attempt || !diagnosticDefinitionIsCurrent(attempt)) return null
  if (action.type === "adopt") return summarizeDiagnostic(attempt).entryOrder ? { ...store, entryAttemptId: attempt.id } : null
  if (attempt.completedAt !== undefined || now < attempt.createdAt) return null
  let next = attempt
  if (action.type === "references") next = { ...attempt, usedReferences: true }
  else {
    const question = attempt.questions.find(q => q.id === action.questionId)
    if (!question || attempt.answers[question.id]) return null
    if (action.type === "answer") {
      // Forward-only submission makes stale/double clicks harmless and allows exact resumption.
      if (attempt.questions.find(q => !attempt.answers[q.id])?.id !== question.id
        || (question.options.length && action.value !== "" && !question.options.includes(action.value))) return null
      const answers = { ...attempt.answers, [question.id]: { value: action.value, answeredAt: now } }
      next = { ...attempt, answers, ...(Object.keys(answers).length === attempt.questions.length ? { completedAt: now } : {}) }
    } else {
      const clipId = diagnosticAudioId(question)
      if (!clipId) return null
      const field = action.type === "heard" ? "heardAudio" : "assistedAudio"
      next = { ...attempt, [field]: [...new Set([...attempt[field], clipId])] }
    }
  }
  return { ...store, attempts: { ...store.attempts, [attempt.id]: next } }
}
