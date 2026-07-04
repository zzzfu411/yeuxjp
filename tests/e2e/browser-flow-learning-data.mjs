import assert from "node:assert/strict"
import fs from "node:fs/promises"

import {
  assertManagedLearningSnapshot,
  managedLearningBackupKeys,
  readManagedLearningBackupSnapshot,
  seedLearningDataBackupState,
} from "./browser-fixtures.mjs"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"

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

  const malformedShapeFileChooserPromise = page.waitForEvent("filechooser")
  await page.getByTestId("learning-data-import").click()
  const malformedShapeFileChooser = await malformedShapeFileChooserPromise
  await malformedShapeFileChooser.setFiles({
    name: "malformed-yasashi-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({
      version: 1,
      exportedAt: Date.now(),
      entries: {
        [E2E_STORAGE_KEYS.KANA_MASTERED]: "{}",
        [E2E_STORAGE_KEYS.SRS_KANA]: JSON.stringify({ a: "bad" }),
      },
    })),
  })
  await page.waitForFunction(() =>
    document.querySelector('[data-testid="learning-data-notice"]')?.getAttribute("data-tone") === "error"
  )
  assertManagedLearningSnapshot(
    await readManagedLearningBackupSnapshot(page),
    seededLearningBackupSnapshot,
    "malformed but valid JSON backup import should not overwrite managed learning keys"
  )

  const staleBackup = {
    ...exportedBackup,
    exportedAt: Date.now(),
    entries: {
      ...exportedBackup.entries,
      [E2E_STORAGE_KEYS.KANA_MASTERED]: JSON.stringify(["a", "sokuon:kitte", "ka", "a"]),
      [E2E_STORAGE_KEYS.VOCAB_LEARNED]: JSON.stringify(["sur-n-35", "sur-g-999", "day-v-1", "sur-n-35"]),
      [E2E_STORAGE_KEYS.SRS_KANA]: JSON.stringify({
        a: { box: 2, dueAt: 1, createdAt: 2, right: 1, wrong: 0 },
        "sokuon:kitte": { box: 2, dueAt: 1, createdAt: 2, right: 1, wrong: 0 },
      }),
      [E2E_STORAGE_KEYS.SRS_VOCAB]: JSON.stringify({
        "sur-n-35": { box: 1, dueAt: 1, createdAt: 2, right: 0, wrong: 0 },
        "sur-g-999": { box: 1, dueAt: 1, createdAt: 2, right: 0, wrong: 0 },
      }),
    },
  }
  const staleFileChooserPromise = page.waitForEvent("filechooser")
  await page.getByTestId("learning-data-import").click()
  const staleFileChooser = await staleFileChooserPromise
  await staleFileChooser.setFiles({
    name: "stale-yasashi-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(staleBackup)),
  })
  await page.waitForFunction(() =>
    document.querySelector('[data-testid="learning-data-notice"]')?.getAttribute("data-tone") === "success"
  )
  const normalizedStaleSnapshot = await readManagedLearningBackupSnapshot(page)
  assert.deepEqual(
    JSON.parse(normalizedStaleSnapshot[E2E_STORAGE_KEYS.KANA_MASTERED]),
    ["a", "ka"],
    "valid backup import should remove non-reviewable kana from mastered progress"
  )
  assert.deepEqual(
    JSON.parse(normalizedStaleSnapshot[E2E_STORAGE_KEYS.VOCAB_LEARNED]),
    ["sur-n-35", "day-v-1"],
    "valid backup import should remove stale vocabulary ids from learned progress"
  )
  assert.deepEqual(
    Object.keys(JSON.parse(normalizedStaleSnapshot[E2E_STORAGE_KEYS.SRS_KANA])),
    ["a"],
    "valid backup import should remove non-reviewable kana from SRS"
  )
  assert.deepEqual(
    Object.keys(JSON.parse(normalizedStaleSnapshot[E2E_STORAGE_KEYS.SRS_VOCAB])),
    ["sur-n-35"],
    "valid backup import should remove stale vocabulary ids from SRS"
  )

  await page.getByTestId("learning-data-reset").click()
  await page.getByTestId("learning-data-reset-dialog").waitFor({ state: "visible" })
  await page.getByTestId("learning-data-reset-dialog-cancel").click()
  await page.getByTestId("learning-data-reset-dialog").waitFor({ state: "hidden" })
  assertManagedLearningSnapshot(
    await readManagedLearningBackupSnapshot(page),
    normalizedStaleSnapshot,
    "canceling all learning data reset should keep managed learning keys"
  )

  await page.getByTestId("learning-data-reset").click()
  await page.getByTestId("learning-data-reset-dialog").waitFor({ state: "visible" })
  await page.getByTestId("learning-data-reset-dialog-confirm").click()
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
  const restoredProfile = JSON.parse(restoredSnapshot[E2E_STORAGE_KEYS.USER_PROFILE])
  assert.equal(restoredProfile?.goal, "balanced", "learning data import should restore the profile backup")
  const restoredMistakes = JSON.parse(restoredSnapshot[E2E_STORAGE_KEYS.MISTAKES])
  assert.ok(
    Array.isArray(restoredMistakes) && restoredMistakes.some((item) => item.id === "kana:a:hiragana-romaji"),
    "learning data import should restore the mistake notebook backup"
  )
  const restoredMistakeSrs = JSON.parse(restoredSnapshot[E2E_STORAGE_KEYS.SRS_MISTAKES])
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
