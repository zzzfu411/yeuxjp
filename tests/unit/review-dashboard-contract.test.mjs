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
  assert.match(page, /isReviewableKanaId/)
  assert.match(page, /reviewableKanaDueIds/)
  assert.match(page, /getNextSrsDueAt/)
  assert.match(page, /setSession\(\{ deck: "today", items: todayQueue \}\)/)
  assert.match(page, /setSession\(\{ deck: "kana", ids: reviewableKanaDueIds \}\)/)
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
  assert.match(source, /formatReviewNextDueAt/)
  assert.match(source, /from "@\/components\/review\/review-banners"/)
  assert.match(source, /<FirstReviewBanner/)
  assert.match(source, /<ReviewStreakBanner/)
  assert.match(source, /<TodayReviewPanel/)
  assert.match(source, /from "@\/components\/review\/review-deck-card"/)
  assert.match(source, /from "@\/components\/review\/recent-mistakes"/)
  assert.match(source, /<ReviewDeckCard\b/)
  assert.match(source, /<RecentMistakes\b/)
  assert.doesNotMatch(source, /function ReviewDeckCard/)
  assert.doesNotMatch(source, /function RecentMistakes/)
  assert.match(source, /SpeechSettingsBar/)
  assert.match(source, /LearningDataPanel/)
  assert.doesNotMatch(source, /state-empty\.webp/)
  assert.doesNotMatch(source, /review-streak\.webp/)
  assert.doesNotMatch(source, /data-testid="review-start-today"/)
})

test("review banners own first-time, streak, and today review surfaces", () => {
  const source = read("src/components/review/review-banners.tsx")

  assert.match(source, /export function FirstReviewBanner/)
  assert.match(source, /export function ReviewStreakBanner/)
  assert.match(source, /export function TodayReviewPanel/)
  assert.match(source, /state-empty\.webp/)
  assert.match(source, /review-streak\.webp/)
  assert.match(source, /href="\/kana"/)
  assert.match(source, /href="\/vocabulary"/)
  assert.match(source, /href="\/quiz"/)
  assert.match(source, /href="\/path"/)
  assert.match(source, /data-testid="review-start-today"/)
})

test("ReviewDeckCard owns deck counts and start action presentation", () => {
  const source = read("src/components/review/review-deck-card.tsx")

  assert.match(source, /export function ReviewDeckCard/)
  assert.match(source, /formatReviewDueCount/)
  assert.match(source, /待复习/)
  assert.match(source, /已加入/)
  assert.match(source, /disabled=\{startDisabled\}/)
  assert.match(source, /\{extra \? <div className="pt-1">\{extra\}<\/div> : null\}/)
})

test("RecentMistakes owns recent mistake preview and remove action", () => {
  const source = read("src/components/review/recent-mistakes.tsx")

  assert.match(source, /export function RecentMistakes/)
  assert.match(source, /mistakes\.slice\(0, 6\)\.map/)
  assert.match(source, /mistake\.questionText \?\? mistake\.questionAudio/)
  assert.match(source, /onRemove\(mistake\.id\)/)
  assert.match(source, /点击“错题本”开始复习/)
})
