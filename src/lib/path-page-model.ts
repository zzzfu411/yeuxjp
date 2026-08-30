import type { LessonTrack } from "@/data/lesson-types"
import type { Kana } from "@/data/kana-data"
import { KANA_SCRIPTS, makeKanaId } from "@/lib/kana-id"
import type { VocabLevelStat } from "@/data/vocabulary/stats"
import { SKILL_TREE, type SkillId, type SkillNode } from "@/lib/skill-tree"
import { averageMastery, type ItemProgressMap } from "@/lib/learning-progress-model"

export type SkillStatus = "locked" | "available" | "in-progress" | "done"

export interface PathProgressStat {
  total: number
  done: number
  ratio: number
}

export interface PathKanaStats {
  seion: PathProgressStat
  dakuon: PathProgressStat
  yoon: PathProgressStat
  special: PathProgressStat
}

export interface PathVocabStats {
  survival: VocabLevelStat
  daily: VocabLevelStat
  fluent: VocabLevelStat
}

export interface PathMasterySummary {
  avg: number
  attempts: number
  production: number
}

export interface SkillStatusResult {
  status: SkillStatus
  badge?: string
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function safeCount(value: unknown) {
  return Math.max(0, Math.floor(finiteNumber(value, 0)))
}

function safeDone(done: unknown, total: number) {
  const count = safeCount(done)
  return total > 0 ? Math.min(count, total) : 0
}

function clampRatio(value: unknown) {
  const ratio = finiteNumber(value, 0)
  return Math.max(0, Math.min(1, ratio))
}

function safeScore(value: unknown) {
  return Math.max(0, Math.min(100, finiteNumber(value, 0)))
}

function ratio(done: number, total: number) {
  const safeTotal = safeCount(total)
  if (safeTotal <= 0) return 0
  return safeDone(done, safeTotal) / safeTotal
}

export function ratioText(done: number, total: number) {
  const safeTotal = safeCount(total)
  return `${safeDone(done, safeTotal)}/${safeTotal}`
}

function makeStat(done: number, total: number): PathProgressStat {
  const safeTotal = safeCount(total)
  const safeCompleted = safeDone(done, safeTotal)
  return { total: safeTotal, done: safeCompleted, ratio: ratio(safeCompleted, safeTotal) }
}

export function getKanaSkillStats(data: readonly Kana[], isMastered: (id: string) => boolean): PathKanaStats {
  const stat = (list: readonly Kana[]) => {
    const total = list.length * KANA_SCRIPTS.length
    const done = list.reduce(
      (count, item) =>
        count + KANA_SCRIPTS.reduce((scriptCount, script) => {
          const id = makeKanaId(script, item.romaji)
          return scriptCount + (id && isMastered(id) ? 1 : 0)
        }, 0),
      0
    )
    return makeStat(done, total)
  }

  return {
    seion: stat(data.filter((item) => item.type === "seion")),
    dakuon: stat(data.filter((item) => item.type === "dakuon" || item.type === "handakuon")),
    yoon: stat(data.filter((item) => item.type === "yoon")),
    special: stat(data.filter((item) => item.type === "special")),
  }
}

export type CourseRecommendationHint = {
  nextTrack?: LessonTrack | null
  allLessonsDone?: boolean
  goal?: "balanced" | "travel" | "jlpt" | "media" | null
  kanaLevel?: "none" | "some" | "solid" | null
}

const COURSE_TRACK_RANK: Record<string, number> = {
  "starter-45": 0,
  "n4-core": 1,
  "n3-core": 2,
  "n2-core": 3,
}

export function seionRecommendationThreshold(kanaLevel?: CourseRecommendationHint["kanaLevel"]) {
  if (kanaLevel === "solid") return 0.4
  if (kanaLevel === "some") return 0.55
  return 0.7
}

export function hasReachedCourseTrack(course: CourseRecommendationHint | undefined, track: LessonTrack) {
  if (course?.allLessonsDone) return true
  const next = course?.nextTrack
  if (!next) return false
  return (COURSE_TRACK_RANK[next] ?? -1) >= (COURSE_TRACK_RANK[track] ?? Number.POSITIVE_INFINITY)
}

export function getRecommendedSkillId(
  kanaStats: PathKanaStats,
  vocabStats: PathVocabStats,
  course?: CourseRecommendationHint
): SkillId {
  const seionThreshold = seionRecommendationThreshold(course?.kanaLevel)
  const survivalThreshold = course?.goal === "travel" ? 0.4 : course?.goal === "jlpt" ? 0.15 : 0.25
  if (clampRatio(kanaStats.seion.ratio) < seionThreshold) return "kana-seion"
  if (clampRatio(kanaStats.dakuon.ratio) < 0.35) return "kana-dakuon"
  if (clampRatio(kanaStats.yoon.ratio) < 0.35) return "kana-yoon"
  if (clampRatio(kanaStats.special.ratio) < 0.5) return "kana-sokuon"
  if (clampRatio(vocabStats.survival.ratio) < survivalThreshold) return "vocab-survival"
  if (course?.goal === "media" && course.allLessonsDone) return "pragmatics"
  if (course?.nextTrack === "n4-core") return "grammar-n4"
  if (course?.nextTrack === "n3-core") return "grammar-n3"
  if (course?.nextTrack === "n2-core") return "grammar-n2"
  if (course?.allLessonsDone) {
    if (clampRatio(vocabStats.daily.ratio) < 0.2) return "vocab-daily"
    if (clampRatio(vocabStats.fluent.ratio) < 0.15) return "vocab-fluent"
  }
  if (course?.nextTrack === "starter-45") return "grammar-n5"
  return "particles-basic"
}

export function findSkillNode(skillId: SkillId, skillTree: readonly SkillNode[] = SKILL_TREE) {
  return skillTree.find((skill) => skill.id === skillId) ?? null
}

export function isSkillUnlocked(
  skillId: SkillId,
  kanaStats: PathKanaStats,
  vocabStats: PathVocabStats,
  skillTree: readonly SkillNode[] = SKILL_TREE,
  course?: CourseRecommendationHint
) {
  const node = findSkillNode(skillId, skillTree)
  if (!node?.prerequisites?.length) return true

  return node.prerequisites.every((prerequisite) => {
    if (prerequisite === "kana-seion") return clampRatio(kanaStats.seion.ratio) >= 0.4
    if (prerequisite === "kana-sokuon") return clampRatio(kanaStats.special.ratio) >= 0.2
    if (prerequisite === "particles-basic") return clampRatio(kanaStats.seion.ratio) >= 0.4
    if (prerequisite === "grammar-n5") return hasReachedCourseTrack(course, "n4-core")
    if (prerequisite === "grammar-n4") return hasReachedCourseTrack(course, "n3-core")
    if (prerequisite === "grammar-n3") return hasReachedCourseTrack(course, "n2-core")
    if (prerequisite === "vocab-survival") return clampRatio(vocabStats.survival.ratio) >= 0.1
    if (prerequisite === "vocab-daily") return clampRatio(vocabStats.daily.ratio) >= 0.1
    return true
  })
}

function statusFromStat(stat: PathProgressStat, doneRatio: number, emptyBadge: string): SkillStatusResult {
  const progressRatio = clampRatio(stat.ratio)
  const done = safeDone(stat.done, safeCount(stat.total))
  if (progressRatio >= doneRatio) return { status: "done", badge: `已掌握 ${ratioText(done, stat.total)}` }
  if (done > 0) return { status: "in-progress", badge: `进度 ${ratioText(done, stat.total)}` }
  return { status: "available", badge: emptyBadge }
}

export function getSkillStatus(
  skillId: SkillId,
  kanaStats: PathKanaStats,
  vocabStats: PathVocabStats,
  skillTree: readonly SkillNode[] = SKILL_TREE,
  course?: CourseRecommendationHint
): SkillStatusResult {
  if (!isSkillUnlocked(skillId, kanaStats, vocabStats, skillTree, course)) {
    if (skillId === "grammar-n4") return { status: "locked", badge: "先完成 N5 课表" }
    if (skillId === "grammar-n3") return { status: "locked", badge: "先完成 N4 课表" }
    if (skillId === "grammar-n2") return { status: "locked", badge: "先完成 N3 课表" }
    return { status: "locked", badge: "建议稍后" }
  }

  if (skillId === "kana-seion") return statusFromStat(kanaStats.seion, 0.9, "从这里开始")
  if (skillId === "kana-dakuon") return statusFromStat(kanaStats.dakuon, 0.85, "建议学习")
  if (skillId === "kana-yoon") return statusFromStat(kanaStats.yoon, 0.85, "建议学习")
  if (skillId === "kana-sokuon") return statusFromStat(kanaStats.special, 0.95, "建议学习")
  if (skillId === "vocab-survival") return statusFromStat(vocabStats.survival, 0.6, "建议学习")
  if (skillId === "vocab-daily") return statusFromStat(vocabStats.daily, 0.5, "建议学习")
  if (skillId === "vocab-fluent") return statusFromStat(vocabStats.fluent, 0.4, "建议学习")

  const grammarStatus = getGrammarSkillProgress(skillId, course)
  if (grammarStatus) return grammarStatus

  return { status: "available", badge: "可练习" }
}

const GRAMMAR_SKILL_TRACK: Partial<Record<SkillId, LessonTrack>> = {
  "grammar-n5": "starter-45",
  "grammar-n4": "n4-core",
  "grammar-n3": "n3-core",
  "grammar-n2": "n2-core",
}

export function getGrammarSkillProgress(skillId: SkillId, course?: CourseRecommendationHint): SkillStatusResult | null {
  const track = GRAMMAR_SKILL_TRACK[skillId]
  if (!track) return null
  const need = COURSE_TRACK_RANK[track] ?? 0
  const now = course?.allLessonsDone ? 4 : COURSE_TRACK_RANK[course?.nextTrack ?? "starter-45"] ?? 0
  if (now > need) return { status: "done", badge: "课表已过该阶段" }
  if (now === need) return { status: "in-progress", badge: "当前阶段" }
  return { status: "available", badge: "可练习" }
}

export function getPathMasterySummary(items: ItemProgressMap): PathMasterySummary {
  const values = Object.values(items)
  if (!values.length) return { avg: 0, attempts: 0, production: 0 }

  return {
    avg: Math.round(values.reduce((acc, item) => acc + averageMastery(item), 0) / values.length),
    attempts: values.reduce((acc, item) => acc + safeCount(item.attempts), 0),
    production: Math.round(values.reduce((acc, item) => acc + safeScore(item.production), 0) / values.length),
  }
}
