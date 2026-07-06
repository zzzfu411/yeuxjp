import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"
import { seedMixedReviewState } from "./browser-fixtures.mjs"

const FLUENT_REVIEW_ID = "flu-abs-1"
const appDir = fileURLToPath(new URL("../..", import.meta.url))
const vocabularyChunkRoots = [
  path.join(appDir, ".next", "static", "chunks"),
  path.join(appDir, ".next", "dev", "static", "chunks"),
]
const VOCABULARY_CHUNK_MARKERS = {
  survival: ["survivalVocab", "sur-g-1"],
  daily: ["dailyVocab", "day-v-1"],
  fluent: ["fluentVocab", "flu-abs-1"],
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function listJavaScriptFiles(root) {
  if (!fs.existsSync(root)) return []

  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name)
    if (entry.isDirectory()) return listJavaScriptFiles(fullPath)
    return entry.isFile() && entry.name.endsWith(".js") ? [fullPath] : []
  })
}

function findExpressionEnd(source, startIndex) {
  let depth = 0
  let quote = null
  let escaped = false

  for (let index = startIndex; index < source.length; index += 1) {
    const char = source[index]

    if (quote) {
      if (escaped) {
        escaped = false
      } else if (char === "\\") {
        escaped = true
      } else if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char
      continue
    }

    if (char === "[") {
      depth += 1
      continue
    }

    if (char === "]") {
      depth -= 1
      if (depth === 0) return index + 1
    }
  }

  return -1
}

function makeTransientFailingVocabularyChunk(source, exportName, level) {
  const exportCallPattern = new RegExp(`([\\w$]+)\\.s\\(\\["${escapeRegExp(exportName)}",0,`)
  const match = exportCallPattern.exec(source)
  if (!match || match.index == null) {
    throw new Error(`Could not find ${exportName} export call in vocabulary chunk`)
  }

  const runtimeName = match[1]
  const dataStart = match.index + match[0].length
  const dataEnd = findExpressionEnd(source, dataStart)
  if (dataEnd < 0 || source.slice(dataEnd, dataEnd + 2) !== "])") {
    throw new Error(`Could not parse ${exportName} data expression in vocabulary chunk`)
  }

  const dataExpression = source.slice(dataStart, dataEnd)
  const replacement = [
    "(()=>{",
    "let first=true;",
    `let data=${dataExpression};`,
    `${runtimeName}.s(["${exportName}",()=>{`,
    "if(first){first=false;",
    `throw new Error("E2E transient vocabulary load failure: ${level}");`,
    "}",
    "return data",
    "}])",
    "})()",
  ].join("")

  return `${source.slice(0, match.index)}${replacement}${source.slice(dataEnd + 2)}`
}

function findVocabularyChunkRoute(level) {
  const marker = VOCABULARY_CHUNK_MARKERS[level]
  if (!marker) throw new Error(`Unknown vocabulary level for load failure: ${level}`)

  for (const root of vocabularyChunkRoots) {
    for (const filePath of listJavaScriptFiles(root)) {
      const source = fs.readFileSync(filePath, "utf8")
      if (!marker.every((item) => source.includes(item))) continue

      const relativePath = path.relative(root, filePath).split(path.sep).join("/")
      return {
        exportName: marker[0],
        filePath,
        routePattern: new RegExp(`${escapeRegExp(`/_next/static/chunks/${relativePath}`)}(?:\\?.*)?$`),
      }
    }
  }

  throw new Error(`Could not find vocabulary chunk containing ${marker.join(", ")}`)
}

async function failNextVocabularyLoad(page, level) {
  const { exportName, filePath, routePattern } = findVocabularyChunkRoute(level)
  let failed = false

  const handler = async (route) => {
    if (failed) {
      await route.continue()
      return
    }

    failed = true
    const source = fs.readFileSync(filePath, "utf8")
    await route.fulfill({
      status: 200,
      contentType: "application/javascript; charset=utf-8",
      body: makeTransientFailingVocabularyChunk(source, exportName, level),
    })
    await page.unroute(routePattern, handler)
  }

  await page.route(routePattern, handler)
}

async function seedFluentVocabularyReviewState(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate(({ storageKeys, id }) => {
    const now = Date.now()
    localStorage.clear()
    localStorage.setItem(storageKeys.VOCAB_LEARNED, JSON.stringify([id]))
    localStorage.setItem(
      storageKeys.SRS_VOCAB,
      JSON.stringify({ [id]: { box: 1, dueAt: now - 1, createdAt: now - 3000, right: 0, wrong: 0 } })
    )
  }, { storageKeys: E2E_STORAGE_KEYS, id: FLUENT_REVIEW_ID })
}

async function verifyQuizVocabularyLoadRetry(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" })
  await page.evaluate((storageKeys) => {
    localStorage.clear()
    localStorage.setItem(storageKeys.SPEECH_PREFS, JSON.stringify({
      rate: 1,
      repeat: 1,
      autoPlay: false,
      gapMs: 250,
    }))
  }, E2E_STORAGE_KEYS)
  await failNextVocabularyLoad(page, "survival")
  await page.goto(`${baseUrl}/quiz`, { waitUntil: "networkidle" })
  await page.getByTestId("quiz-mode-meaning-vocab").click()
  await page.getByTestId("quiz-retry-vocabulary").waitFor({ state: "visible" })
  await page.getByTestId("quiz-retry-vocabulary").click()
  await page.getByTestId("quiz-score").waitFor({ state: "visible" })
  await page.locator('[data-testid^="quiz-answer-option-"]').first().waitFor({ state: "visible" })
}

async function verifyVocabularyPageLoadRetry(page, baseUrl) {
  await page.goto(`${baseUrl}/vocabulary`, { waitUntil: "networkidle" })
  await page.getByTestId("vocabulary-search").waitFor({ state: "visible" })

  await failNextVocabularyLoad(page, "daily")
  await page.getByTestId("vocabulary-level-daily").click()
  await page.getByTestId("vocabulary-retry-load").waitFor({ state: "visible" })
  await page.getByTestId("vocabulary-retry-load").click()
  await page.getByTestId("vocabulary-search").fill("Yakusoku")
  await page.getByText("約束").first().waitFor({ state: "visible" })
}

async function verifyReviewVocabularyLoadRetry(page, baseUrl) {
  await seedFluentVocabularyReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-due-state").waitFor({ state: "visible" })

  await failNextVocabularyLoad(page, "fluent")
  await page.getByTestId("review-start-vocab").click()
  await page.getByTestId("review-retry-load").waitFor({ state: "visible" })
  await page.getByTestId("review-retry-load").click()
  await page.getByTestId("review-answer-flu-abs-1").waitFor({ state: "visible" })
  await page.getByTestId("review-answer-flu-abs-1").click()
  await page.waitForFunction(({ storageKeys, id }) => {
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_VOCAB) ?? "{}")
    return srs?.[id]?.box > 1 && srs?.[id]?.right >= 1
  }, { storageKeys: E2E_STORAGE_KEYS, id: FLUENT_REVIEW_ID })
}

async function verifyTodayReviewVocabularyLoadRetry(page, baseUrl) {
  await seedMixedReviewState(page, baseUrl)
  await page.goto(`${baseUrl}/review`, { waitUntil: "networkidle" })
  await page.getByTestId("review-due-state").waitFor({ state: "visible" })

  await failNextVocabularyLoad(page, "survival")
  await page.getByTestId("review-start-today").click()
  await page.getByTestId("review-retry-load").waitFor({ state: "visible" })
  await page.getByTestId("review-retry-load").click()
  await page.getByTestId("review-remaining").waitFor({ state: "visible" })

  await page.getByTestId("review-answer-a").click()
  await page.getByTestId("review-next").waitFor({ state: "visible" })
  await page.getByTestId("review-next").click()
  await page.getByTestId("review-answer-a").click()
  await page.getByTestId("review-next").waitFor({ state: "visible" })
  await page.getByTestId("review-next").click()
  await page.getByTestId("review-answer-sur-g-1").waitFor({ state: "visible" })
  await page.getByTestId("review-answer-sur-g-1").click()
  await page.waitForFunction((storageKeys) => {
    const srs = JSON.parse(localStorage.getItem(storageKeys.SRS_VOCAB) ?? "{}")
    const practice = JSON.parse(localStorage.getItem(storageKeys.PRACTICE_RESULTS) ?? "[]")
    return srs?.["sur-g-1"]?.box > 1 &&
      srs?.["sur-g-1"]?.right >= 1 &&
      Array.isArray(practice) &&
      practice.some((item) =>
        item.itemId === "sur-g-1" &&
        item.itemType === "vocab" &&
        item.mode === "meaning" &&
        item.correct === true
      )
  }, E2E_STORAGE_KEYS)
  await page.evaluate(() => localStorage.clear())
}

export async function verifyVocabularyLoadRetryFlow(page, baseUrl) {
  await verifyQuizVocabularyLoadRetry(page, baseUrl)
  await verifyVocabularyPageLoadRetry(page, baseUrl)
  await verifyReviewVocabularyLoadRetry(page, baseUrl)
  await verifyTodayReviewVocabularyLoadRetry(page, baseUrl)
}
