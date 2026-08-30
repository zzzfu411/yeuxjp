import { E2E_STORAGE_KEYS } from "./storage-keys.mjs"
import { seedMixedReviewState } from "./browser-fixtures.mjs"

const FLUENT_REVIEW_ID = "flu-abs-1"
const VOCABULARY_CHUNK_MARKERS = {
  survival: { exportName: "survivalVocab", tokens: ['"survivalVocab"', "sur-g-1"] },
  daily: { exportName: "dailyVocab", tokens: ['"dailyVocab"', "day-v-1"] },
  fluent: { exportName: "fluentVocab", tokens: ['"fluentVocab"', "flu-abs-1"] },
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
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
  const rewritten =
    rewriteDevConstToArmedProxy(source, exportName, level) ??
    rewriteDevVocabularyChunk(source, exportName, level) ??
    rewriteMinifiedVocabularyChunk(source, exportName, level)
  if (!rewritten) {
    throw new Error(`Could not find ${exportName} export call in vocabulary chunk`)
  }
  return rewritten
}

// Turbopack dev binds `const name = [...]` as a live export. Wrap the array in
// a proxy that throws once after module evaluation, so import() succeeds, the
// loader's first read fails, and retry can read the same module.
function rewriteDevConstToArmedProxy(source, exportName, level) {
  const pattern = new RegExp(`const ${escapeRegExp(exportName)} = \\[`)
  const match = pattern.exec(source)
  if (!match || match.index == null) return null

  const dataStart = match.index + match[0].length - 1
  const dataEnd = findExpressionEnd(source, dataStart)
  if (dataEnd < 0) return null

  const dataExpression = source.slice(dataStart, dataEnd)
  const replacement = `const ${exportName} = (()=>{let armed=false;queueMicrotask(()=>{armed=true});const data=${dataExpression};return new Proxy(data,{get(t,p,r){if(armed){armed=false;throw new Error("E2E transient vocabulary load failure: ${level}");}return Reflect.get(t,p,r);}})})()`
  return `${source.slice(0, match.index)}${replacement}${source.slice(dataEnd)}`
}

// Production chunks inline the dataset: X.s(["name",0,[...]])
function rewriteMinifiedVocabularyChunk(source, exportName, level) {
  const exportCallPattern = new RegExp(`([\\w$]+)\\.s\\(\\["${escapeRegExp(exportName)}",0,`)
  const match = exportCallPattern.exec(source)
  if (!match || match.index == null) return null

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

// Turbopack dev chunks register a lazy getter for a module-level binding:
// __turbopack_context__.s([ "name", ()=>name ]); const name = [...]
// Wrapping the getter keeps module evaluation successful, so the first export
// access rejects the loader promise while the retry import recovers.
function rewriteDevVocabularyChunk(source, exportName, level) {
  const exportCallPattern = new RegExp(
    `\\.s\\(\\[\\s*"${escapeRegExp(exportName)}"\\s*,\\s*\\(\\)\\s*=>\\s*([\\w$]+)\\s*,?\\s*\\]\\)`
  )
  const match = exportCallPattern.exec(source)
  if (!match || match.index == null) return null

  const binding = match[1]
  const failingGetter = [
    "(()=>{let first=true;return ()=>{",
    "if(first){first=false;",
    `throw new Error("E2E transient vocabulary load failure: ${level}");`,
    "}",
    `return ${binding};`,
    "};})()",
  ].join("")
  const replacement = `.s(["${exportName}", ${failingGetter}])`

  return `${source.slice(0, match.index)}${replacement}${source.slice(match.index + match[0].length)}`
}

const VOCABULARY_CHUNK_ROUTE_PATTERN = /\/_next\/static\/chunks\/.+\.js(?:\?.*)?$/

// Intercept every chunk request and inspect the real response body instead of
// guessing which on-disk chunk file the browser will ask for: Turbopack dev
// emits multiple chunk files containing the same module, so a path-based
// route can silently miss and the transient failure never happens.
async function failNextVocabularyLoad(page, level) {
  const marker = VOCABULARY_CHUNK_MARKERS[level]
  if (!marker) throw new Error(`Unknown vocabulary level for load failure: ${level}`)

  const { exportName, tokens } = marker
  let failed = false

  // Earlier flows in this shared browser context usually already loaded the
  // chunk; disk-cache hits and 304 revalidations never expose a full response
  // body to the interception route, so the transient failure would silently
  // miss. Clear the HTTP cache so the next load is a real 200.
  const cdp = await page.context().newCDPSession(page)
  try {
    await cdp.send("Network.clearBrowserCache")
  } finally {
    await cdp.detach()
  }

  const handler = async (route) => {
    if (failed) {
      await route.continue()
      return
    }

    const response = await route.fetch()
    const body = await response.text()
    if (!tokens.every((item) => body.includes(item))) {
      await route.fulfill({ response, body })
      return
    }

    // Multiple chunk requests can be in flight while route.fetch() awaits.
    // Re-check after the await so only the first matching response is claimed.
    if (failed) {
      await route.fulfill({ response, body })
      return
    }

    failed = true
    await route.fulfill({
      status: 200,
      contentType: "application/javascript; charset=utf-8",
      headers: {
        "cache-control": "no-store",
      },
      body: makeTransientFailingVocabularyChunk(body, exportName, level),
    })
    await page.unroute(VOCABULARY_CHUNK_ROUTE_PATTERN, handler)
  }

  await page.route(VOCABULARY_CHUNK_ROUTE_PATTERN, handler)
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
        ["meaning", "recall", "listening"].includes(item.mode) &&
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
