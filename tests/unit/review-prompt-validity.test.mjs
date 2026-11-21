import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"
const { resolveTodayReviewItemData } = await loadTsModule("src/lib/today-review-session.ts")
function resolve(item) {
  return resolveTodayReviewItemData({ current: { deck: "mistakes", id: "old" }, vocabulary: [], mistakes: new Map([["old", { id: "old", wrongCount: 1, createdAt: 1, lastWrongAt: 1, options: [], ...item }]]) }).data
}
test("mixed mistake review keeps answer explanations for feedback, never in the pre-answer prompt", () => {
  const data = resolve({ type: "grammar-practice", itemType: "grammar", mode: "recognition", questionText: "私___学生です。", correctAnswer: "は", explanation: "答案是 は。" })
  assert.doesNotMatch(data.sub ?? "", /答案是|は/)
  assert.equal(data.question.explanation, "答案是 は。")
})
test("isolated listening mistakes do not print their target glyph, and non-listening questions cannot play the filled answer", () => {
  const audio = resolve({ type: "audio-kana", mode: "listening", questionAudio: "か", correctAnswer: "ka" })
  assert.equal(audio.prompt.includes("か"), false)
  assert.equal(audio.audio, "か")
  const grammar = resolve({ type: "particle", mode: "recognition", questionText: "私___学生です。", questionAudio: "私は学生です。", correctAnswer: "は" })
  assert.equal(grammar.audio, undefined)
  assert.equal(grammar.autoPlayAudio, false)
})
