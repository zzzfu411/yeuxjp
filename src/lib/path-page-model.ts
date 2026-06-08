import type { Kana } from "@/data/kana-data"
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

function ratio(done: number, total: number) {
  return total ? done / total : 0
}

export function ratioText(done: number, total: number) {
  return `${done}/${total}`
}

function makeStat(done: number, total: number): PathProgressStat {
  return { total, done, ratio: ratio(done, total) }
}

export function getKanaSkillStats(data: readonly Kana[], isMastered: (romaji: string) => boolean): PathKanaStats {
  const stat = (list: readonly Kana[]) => {
    const total = list.length
    const done = list.reduce((acc, item) => acc + (isMastered(item.romaji) ? 1 : 0), 0)
    return makeStat(done, total)
  }

  return {
    seion: stat(data.filter((item) => item.type === "seion")),
    dakuon: stat(data.filter((item) => item.type === "dakuon" || item.type === "handakuon")),
    yoon: stat(data.filter((item) => item.type === "yoon")),
    special: stat(data.filter((item) => item.type === "special")),
  }
}

export function getRecommendedSkillId(kanaStats: PathKanaStats, vocabStats: PathVocabStats): SkillId {
  if (kanaStats.seion.ratio < 0.7) return "kana-seion"
  if (kanaStats.dakuon.ratio < 0.35) return "kana-dakuon"
  if (kanaStats.yoon.ratio < 0.35) return "kana-yoon"
  if (kanaStats.special.ratio < 0.5) return "kana-sokuon"
  if (vocabStats.survival.ratio < 0.25) return "vocab-survival"
  return "particles-basic"
}

export function findSkillNode(skillId: SkillId, skillTree: readonly SkillNode[] = SKILL_TREE) {
  return skillTree.find((skill) => skill.id === skillId) ?? null
}

export function isSkillUnlocked(
  skillId: SkillId,
  kanaStats: PathKanaStats,
  vocabStats: PathVocabStats,
  skillTree: readonly SkillNode[] = SKILL_TREE
) {
  const node = findSkillNode(skillId, skillTree)
  if (!node?.prerequisites?.length) return true

  return node.prerequisites.every((prerequisite) => {
    if (prerequisite === "kana-seion") return kanaStats.seion.ratio >= 0.4
    if (prerequisite === "kana-sokuon") return kanaStats.special.ratio >= 0.2
    if (prerequisite === "particles-basic") return true
    if (prerequisite === "vocab-survival") return vocabStats.survival.ratio >= 0.1
    return true
  })
}

function statusFromStat(stat: PathProgressStat, doneRatio: number, emptyBadge: string): SkillStatusResult {
  if (stat.ratio >= doneRatio) return { status: "done", badge: `已掌握 ${ratioText(stat.done, stat.total)}` }
  if (stat.done > 0) return { status: "in-progress", badge: `进度 ${ratioText(stat.done, stat.total)}` }
  return { status: "available", badge: emptyBadge }
}

export function getSkillStatus(
  skillId: SkillId,
  kanaStats: PathKanaStats,
  vocabStats: PathVocabStats,
  skillTree: readonly SkillNode[] = SKILL_TREE
): SkillStatusResult {
  if (!isSkillUnlocked(skillId, kanaStats, vocabStats, skillTree)) {
    return { status: "locked", badge: "建议稍后" }
  }

  if (skillId === "kana-seion") return statusFromStat(kanaStats.seion, 0.9, "从这里开始")
  if (skillId === "kana-dakuon") return statusFromStat(kanaStats.dakuon, 0.85, "建议学习")
  if (skillId === "kana-yoon") return statusFromStat(kanaStats.yoon, 0.85, "建议学习")
  if (skillId === "kana-sokuon") return statusFromStat(kanaStats.special, 0.95, "建议学习")
  if (skillId === "vocab-survival") return statusFromStat(vocabStats.survival, 0.6, "建议学习")

  return { status: "available", badge: "可练习" }
}

export function getPathMasterySummary(items: ItemProgressMap): PathMasterySummary {
  const values = Object.values(items)
  if (!values.length) return { avg: 0, attempts: 0, production: 0 }

  return {
    avg: Math.round(values.reduce((acc, item) => acc + averageMastery(item), 0) / values.length),
    attempts: values.reduce((acc, item) => acc + item.attempts, 0),
    production: Math.round(values.reduce((acc, item) => acc + item.production, 0) / values.length),
  }
}
