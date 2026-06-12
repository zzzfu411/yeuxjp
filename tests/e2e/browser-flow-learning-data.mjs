import assert from "node:assert/strict"
import fs from "node:fs/promises"

import {
  assertManagedLearningSnapshot,
  managedLearningBackupKeys,
  readManagedLearningBackupSnapshot,
  seedLearningDataBackupState,
} from "./browser-fixtures.mjs"

export async function verifyLearningDataFlow(page, baseUrl) {
  await seedLearningDataBackupState(page, baseUrl)
  const seededLearningBackupSnapshot = await readManagedLearningBackupSnapshot(page)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("learning-data-panel").waitFor({ state: "visible" })
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("learning-data-export").click(),
  ])
  assert.match(download.suggestedFilename(), /^yasashi-learning-backup-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.json$/)
  const backupPath = await download.path()
  assert.ok(backupPath, "learning data export should create a downloadable backup file")
  const exportedBackup = JSON.parse(await fs.readFile(backupPath, "utf8"))
  assert.equal(exportedBackup.version, 1, "learning data export should use the current backup version")
  assertManagedLearningSnapshot(
    exportedBackup.entries,
    seededLearningBackupSnapshot,
    "learning data export should include every managed learning key"
  )

  const invalidFileChooserPromise = page.waitForEvent("filechooser")
  await page.getByTestId("learning-data-import").click()
  const invalidFileChooser = await invalidFileChooserPromise
  await invalidFileChooser.setFiles({
    name: "invalid-yasashi-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from("{not-valid-json"),
  })
  await page.waitForFunction(() =>
    document.querySelector('[data-testid="learning-data-notice"]')?.getAttribute("data-tone") === "error"
  )
  assert.equal(await page.getByTestId("learning-data-notice").getAttribute("data-tone"), "error")
  assertManagedLearningSnapshot(
    await readManagedLearningBackupSnapshot(page),
    seededLearningBackupSnapshot,
    "invalid learning data import should not overwrite managed learning keys"
  )

  await page.getByTestId("learning-data-reset").click()
  await page.getByTestId("learning-data-reset").click()
  await page.waitForFunction((keys) => keys.every((key) => localStorage.getItem(key) === null), managedLearningBackupKeys)
  const resetSnapshot = await readManagedLearningBackupSnapshot(page)
  for (const key of managedLearningBackupKeys) {
    assert.equal(resetSnapshot[key], null, `learning data reset should clear managed learning key: ${key}`)
  }
  assert.equal(
    await page.evaluate(() => localStorage.getItem("yasashi.e2e.unmanaged")),
    "keep",
    "learning data reset should leave unmanaged browser state alone"
  )

  const fileChooserPromise = page.waitForEvent("filechooser")
  await page.getByTestId("learning-data-import").click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(backupPath)
  await page.waitForFunction((keys) => keys.every((key) => localStorage.getItem(key) !== null), managedLearningBackupKeys)
  const restoredSnapshot = await readManagedLearningBackupSnapshot(page)
  assertManagedLearningSnapshot(
    restoredSnapshot,
    seededLearningBackupSnapshot,
    "learning data import should restore every managed learning key"
  )
  const restoredProfile = JSON.parse(restoredSnapshot["yasashi.learning.profile.v1"])
  assert.equal(restoredProfile?.goal, "balanced", "learning data import should restore the profile backup")
  const restoredMistakes = JSON.parse(restoredSnapshot["yasashi.mistakes.v1"])
  assert.ok(
    Array.isArray(restoredMistakes) && restoredMistakes.some((item) => item.id === "kana:a:hiragana-romaji"),
    "learning data import should restore the mistake notebook backup"
  )
  const restoredMistakeSrs = JSON.parse(restoredSnapshot["yasashi.srs.mistakes.v1"])
  assert.ok(
    restoredMistakeSrs?.["kana:a:hiragana-romaji"]?.dueAt,
    "learning data import should restore mistake SRS state"
  )
  assert.equal(
    await page.evaluate(() => localStorage.getItem("yasashi.e2e.unmanaged")),
    "keep",
    "learning data import should leave unmanaged browser state alone"
  )
}
