import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

import { appDir, rapidClick, readJsonStorage } from "./harness.mjs"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

function readVocabularySource(fileName) {
  return fs.readFileSync(path.join(appDir, "src/data/vocabulary", fileName), "utf8")
}

function readVocabularyIds(fileName) {
  const source = readVocabularySource(fileName)
  return Array.from(source.matchAll(/id:\s*["']([^"']+)["']/g), (match) => match[1])
}

function readVocabularyPromptEntries(fileName) {
  const source = readVocabularySource(fileName)
  return Array.from(
    source.matchAll(/\bid:\s*["']([^"']+)["'][^\n]*\bkana:\s*["']([^"']+)["']/g),
    (match) => ({ id: match[1], prompt: match[2] })
  )
}

export const quizVocabIdsByLevel = {
  survival: readVocabularyIds("survival.ts"),
  daily: readVocabularyIds("daily.ts"),
  fluent: readVocabularyIds("fluent.ts"),
}

const quizVocabIdsByPrompt = new Map(
  ["survival.ts", "daily.ts", "fluent.ts"]
    .flatMap(readVocabularyPromptEntries)
    .map((entry) => [entry.prompt, entry.id])
)

export function getVocabularyIdForPrompt(prompt) {
  return quizVocabIdsByPrompt.get(prompt) ?? null
}

export async function resetQuizLearningState(page) {
  await page.evaluate((storageKeys) => {
    localStorage.clear()
    localStorage.setItem(storageKeys.SPEECH_PREFS, JSON.stringify({
      rate: 1,
      repeat: 1,
      autoPlay: false,
      gapMs: 250,
    }))
  }, E2E_STORAGE_KEYS)
}

async function clickQuizMode(page, mode) {
  if (mode === "hiragana-romaji") await page.getByTestId("quiz-mode-hiragana-romaji").click()
  else if (mode === "audio-kana") await page.getByTestId("quiz-mode-audio-kana").click()
  else if (mode === "particle") await page.getByTestId("quiz-mode-particle").click()
  else if (mode === "verb-conjugation") await page.getByTestId("quiz-mode-verb-conjugation").click()
  else if (mode === "audio-sokuon") await page.getByTestId("quiz-mode-audio-sokuon").click()
  else if (mode === "audio-longvowel") await page.getByTestId("quiz-mode-audio-longvowel").click()
  else if (mode === "meaning-vocab") await page.getByTestId("quiz-mode-meaning-vocab").click()
  else throw new Error(`Unknown quiz mode for browser E2E: ${mode}`)

  await page.getByTestId("quiz-score").waitFor({ state: "visible" })
  await page.locator('[data-testid^="quiz-answer-option-"]').first().waitFor({ state: "visible" })
}

export async function openQuizMode(page, baseUrl, mode) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await resetQuizLearningState(page)
  await page.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
  await clickQuizMode(page, mode)
}

export async function openQuizModeWithFixedRandom(page, baseUrl, mode, randomValue = 0) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await resetQuizLearningState(page)
  await page.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
  await page.evaluate((value) => {
    Math.random = () => value
  }, randomValue)
  await clickQuizMode(page, mode)
}

export async function openQuizModeWithLearningState(page, baseUrl, mode, {
  masteredKana = [],
  learnedVocab = [],
} = {}) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await resetQuizLearningState(page)
  await page.evaluate(({ storageKeys, masteredKanaIds, learnedVocabIds }) => {
    localStorage.setItem(storageKeys.KANA_MASTERED, JSON.stringify(masteredKanaIds))
    localStorage.setItem(storageKeys.VOCAB_LEARNED, JSON.stringify(learnedVocabIds))
  }, {
    storageKeys: E2E_STORAGE_KEYS,
    masteredKanaIds: masteredKana,
    learnedVocabIds: learnedVocab,
  })
  await page.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
  await clickQuizMode(page, mode)
}

export async function clickFirstQuizOptionAndReadPractice(page) {
  await rapidClick(page.locator('[data-testid^="quiz-answer-option-"]').first())
  await page.waitForFunction((key) => {
    const practice = JSON.parse(localStorage.getItem(key) ?? "[]")
    return Array.isArray(practice) && practice.length > 0
  }, E2E_STORAGE_KEYS.PRACTICE_RESULTS)
  assert.match(await page.getByTestId("quiz-score").innerText(), /\/1\b/, "rapid quiz answer clicks should score one attempt")
  return readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS)
}

export async function clickQuizOptionByValueAndReadPractice(page, value) {
  const option = page.locator(`[data-answer-value="${value}"]`)
  await option.waitFor({ state: "visible" })
  await rapidClick(option)
  await page.waitForFunction((key) => {
    const practice = JSON.parse(localStorage.getItem(key) ?? "[]")
    return Array.isArray(practice) && practice.length > 0
  }, E2E_STORAGE_KEYS.PRACTICE_RESULTS)
  assert.match(await page.getByTestId("quiz-score").innerText(), /\/1\b/)
  return readJsonStorage(page, E2E_STORAGE_KEYS.PRACTICE_RESULTS)
}

export async function clickQuizOptionExceptValueAndReadPractice(page, value) {
  const wrongValue = await page.evaluate((correctValue) => {
    return Array.from(document.querySelectorAll("[data-answer-value]"))
      .map((button) => button.getAttribute("data-answer-value"))
      .find((optionValue) => optionValue && optionValue !== correctValue) ?? null
  }, value)
  assert.ok(wrongValue, `quiz should expose at least one answer option other than ${value}`)
  const practice = await clickQuizOptionByValueAndReadPractice(page, wrongValue)
  return { wrongValue, practice }
}

export async function assertQuizModeRecordsPractice(page, baseUrl, { mode, itemType, practiceMode }) {
  await openQuizMode(page, baseUrl, mode)
  const practice = await clickFirstQuizOptionAndReadPractice(page)
  assert.ok(
    Array.isArray(practice) &&
      practice.some((item) => item.itemType === itemType && item.mode === practiceMode),
    `${mode} quiz should record ${itemType}/${practiceMode} practice`
  )

  const itemProgress = await readJsonStorage(page, E2E_STORAGE_KEYS.ITEM_PROGRESS)
  assert.ok(
    Object.values(itemProgress ?? {}).some((item) => item.itemType === itemType && item.attempts >= 1),
    `${mode} quiz should update item progress`
  )
}
