export type QuizStats = {
  score: number
  total: number
}

export function createQuizStats(): QuizStats {
  return { score: 0, total: 0 }
}

export function recordQuizAnswer(stats: QuizStats, correct: boolean): QuizStats {
  return {
    score: stats.score + (correct ? 1 : 0),
    total: stats.total + 1,
  }
}

export function getQuizAccuracy(stats: QuizStats): number | null {
  if (stats.total === 0) return null
  return Math.round((stats.score / stats.total) * 100)
}
