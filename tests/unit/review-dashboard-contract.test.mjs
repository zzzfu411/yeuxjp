import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

test("review page delegates dashboard surfaces while keeping SRS/session wiring", () => {
  const page = read("src/app/review/page.tsx")

  assert.match(page, /from "@\/components\/review\/review-dashboard"/)
  assert.match(page, /<ReviewDashboard\b/)
  assert.match(page, /buildTodayReviewQueue/)
  assert.match(page, /getNextSrsDueAt/)
  assert.match(page, /setSession\(\{ deck: "today", items: todayQueue \}\)/)
  assert.match(page, /setSession\(\{ deck: "kana", ids: kanaSrs\.dueIds \}\)/)
  assert.match(page, /setSession\(\{ deck: "vocab", ids: vocabSrs\.dueIds \}\)/)
  assert.match(page, /setSession\(\{ deck: "mistakes", ids: dueMistakeIds \}\)/)
  assert.doesNotMatch(page, /function DeckCard/)
  assert.doesNotMatch(page, /state-empty\.webp/)
  assert.doesNotMatch(page, /review-streak\.webp/)
  assert.doesNotMatch(page, /SpeechSettingsBar/)
  assert.doesNotMatch(page, /LearningDataPanel/)
})

test("ReviewDashboard owns review landing UI and delegates formatting to pure model helpers", () => {
  const source = read("src/components/review/review-dashboard.tsx")

  assert.match(source, /export function ReviewDashboard/)
  assert.match(source, /from "@\/lib\/review-dashboard-model"/)
  assert.match(source, /formatReviewDueCount/)
  assert.match(source, /formatReviewNextDueAt/)
  assert.match(source, /function FirstReviewBanner/)
  assert.match(source, /function ReviewStreakBanner/)
  assert.match(source, /function TodayReviewPanel/)
  assert.match(source, /function ReviewDeckCard/)
  assert.match(source, /function RecentMistakes/)
  assert.match(source, /state-empty\.webp/)
  assert.match(source, /review-streak\.webp/)
  assert.match(source, /SpeechSettingsBar/)
  assert.match(source, /LearningDataPanel/)
  assert.match(source, /data-testid="review-start-today"/)
})
