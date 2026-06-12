import assert from "node:assert/strict"

import { readJsonStorage } from "./harness.mjs"

export async function verifyKanaAndVocabularyFlow(page, baseUrl) {
  await page.goto(`${baseUrl}/kana`, { waitUntil: "networkidle" })
  await page.getByTestId("kana-card-a").click()
  await page.getByTestId("kana-stroke-toggle").click()
  await page.getByTestId("kana-stroke-board").waitFor({ state: "visible" })
  await page.getByTestId("kana-mastery-toggle").click()
  await page.waitForFunction(() => {
    const mastered = JSON.parse(localStorage.getItem("yasashi.kana.mastered.v1") ?? "[]")
    const srs = JSON.parse(localStorage.getItem("yasashi.srs.kana.v1") ?? "{}")
    return Array.isArray(mastered) && mastered.includes("a") && !!srs?.a?.dueAt
  })
  const masteredKana = await readJsonStorage(page, "yasashi.kana.mastered.v1")
  assert.ok(Array.isArray(masteredKana) && masteredKana.includes("a"), "kana mastery toggle should persist kana a")
  const masteredKanaSrs = await readJsonStorage(page, "yasashi.srs.kana.v1")
  assert.ok(masteredKanaSrs?.a?.dueAt, "kana mastery toggle should enroll kana a for SRS review")

  await page.goto(`${baseUrl}/vocabulary`, { waitUntil: "networkidle" })
  await page.getByTestId("vocabulary-search").fill("みせ")
  await page.getByText("みせ").first().waitFor({ state: "visible" })
  await page.getByTestId("vocabulary-expand-sur-n-35").click()
  await page.getByTestId("vocabulary-focus-card").click()
  await page.getByTestId("vocabulary-learned-toggle").click()
  await page.waitForFunction(() => {
    const learned = JSON.parse(localStorage.getItem("yasashi.vocab.learned.v1") ?? "[]")
    const srs = JSON.parse(localStorage.getItem("yasashi.srs.vocab.v1") ?? "{}")
    return Array.isArray(learned) && learned.includes("sur-n-35") && !!srs?.["sur-n-35"]?.dueAt
  })
  const learnedVocab = await readJsonStorage(page, "yasashi.vocab.learned.v1")
  assert.ok(Array.isArray(learnedVocab) && learnedVocab.includes("sur-n-35"), "vocabulary learned toggle should persist the selected vocabulary id")
  const vocabSrs = await readJsonStorage(page, "yasashi.srs.vocab.v1")
  assert.ok(vocabSrs?.["sur-n-35"]?.dueAt, "vocabulary learned toggle should enroll the selected vocabulary for SRS review")
  await page.goto(`${baseUrl}/vocabulary`, { waitUntil: "networkidle" })
  await page.getByTestId("vocabulary-level-daily").click()
  await page.getByTestId("vocabulary-search").fill("Yakusoku")
  await page.getByText("約束").first().waitFor({ state: "visible" })
  await page.getByTestId("vocabulary-level-fluent").click()
  await page.getByTestId("vocabulary-search").fill("Gainen")
  await page.getByText("概念").first().waitFor({ state: "visible" })
}
