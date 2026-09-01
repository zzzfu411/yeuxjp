// Capture product screenshots for README.md from a running production server.
// Usage: npm start   then   node scripts/capture-readme-screenshots.mjs
import { mkdir } from "node:fs/promises"
import path from "node:path"
import { chromium } from "playwright"

const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:3000"
const OUT_DIR = process.env.SCREENSHOT_OUT_DIR ?? "/workspace/docs/screenshots"

function seedLearnerState() {
  const STORAGE_KEYS = {
    KANA_MASTERED: "yasashi.kana.mastered.v1",
    VOCAB_LEARNED: "yasashi.vocab.learned.v1",
    SRS_KANA: "yasashi.srs.kana.v1",
    SRS_VOCAB: "yasashi.srs.vocab.v1",
    SRS_MISTAKES: "yasashi.srs.mistakes.v1",
    MISTAKES: "yasashi.mistakes.v1",
    USER_PROFILE: "yasashi.learning.profile.v1",
    LESSON_PROGRESS: "yasashi.learning.lessons.v1",
    ITEM_PROGRESS: "yasashi.learning.items.v1",
    PRACTICE_RESULTS: "yasashi.learning.practice.v1",
  }
  const masteredKana = [
    "hiragana:a",
    "hiragana:i",
    "hiragana:u",
    "hiragana:e",
    "hiragana:o",
    "hiragana:ka",
    "hiragana:ki",
    "hiragana:ku",
    "hiragana:ke",
    "hiragana:ko",
    "hiragana:sa",
    "hiragana:shi",
  ]
  const learnedVocab = ["sur-g-1", "sur-g-2", "sur-g-3", "sur-g-5", "sur-g-6", "sur-v-1"]
  const completedLessons = [
    "day-1-a-row-hello",
    "day-2-ka-row-thanks",
    "day-3-sa-ta-row-sumimasen",
    "day-4-na-ha-ma-intro-sentence",
  ]

  const daysAgo = (days, hour = 10) => {
    const date = new Date()
    date.setDate(date.getDate() - days)
    date.setHours(hour, 20, 0, 0)
    return date.getTime()
  }
  const srsEntry = (createdDaysAgo, dueOffsetMs, box = 2, right = 3, wrong = 0) => {
    const createdAt = daysAgo(createdDaysAgo)
    return {
      box,
      dueAt: Date.now() + dueOffsetMs,
      createdAt,
      lastReviewedAt: createdAt + 3_600_000,
      right,
      wrong,
    }
  }

  const now = Date.now()
  const profile = {
    goal: "balanced",
    minutesPerDay: 15,
    kanaLevel: "some",
    romajiMode: "practice",
    createdAt: daysAgo(12),
    updatedAt: now,
  }

  const lessons = Object.fromEntries(
    completedLessons.map((lessonId, index) => {
      const completedAt = daysAgo(completedLessons.length - index)
      return [
        lessonId,
        {
          lessonId,
          status: "completed",
          startedAt: completedAt - 20 * 60 * 1000,
          completedAt,
          score: 88 + index,
          currentStepIndex: 5,
          updatedAt: completedAt,
        },
      ]
    })
  )
  lessons["day-5-se-so-te-to"] = {
    lessonId: "day-5-se-so-te-to",
    status: "started",
    startedAt: daysAgo(0, 9),
    currentStepIndex: 1,
    lastStepId: "ohayou-example",
    updatedAt: now,
  }

  const items = {}
  for (const id of masteredKana) {
    items[id] = {
      itemId: id,
      itemType: "kana",
      recognition: 82,
      listening: 70,
      meaning: 64,
      recall: 58,
      production: 40,
      attempts: 8,
      correct: 7,
      updatedAt: now,
    }
  }
  for (const id of learnedVocab) {
    items[id] = {
      itemId: id,
      itemType: "vocab",
      recognition: 76,
      listening: 62,
      meaning: 80,
      recall: 54,
      production: 36,
      attempts: 6,
      correct: 5,
      updatedAt: now,
    }
  }

  const practiceIds = [
    ...masteredKana.slice(0, 8),
    ...learnedVocab.slice(0, 6),
    "hiragana:ta",
    "hiragana:chi",
    "hiragana:na",
    "sur-g-10",
  ]
  const results = []
  for (let day = 4; day >= 0; day--) {
    const count = day === 0 ? 18 : 8
    for (let i = 0; i < count; i++) {
      const itemId = practiceIds[i % practiceIds.length]
      results.push({
        lessonId: day === 0 ? "day-5-se-so-te-to" : completedLessons[Math.min(day, completedLessons.length - 1)],
        itemId,
        itemType: itemId.startsWith("sur-") ? "vocab" : "kana",
        mode: i % 2 === 0 ? "recognition" : "meaning",
        correct: i % 7 !== 0,
        createdAt: daysAgo(day, 10) + i * 60_000,
      })
    }
  }

  const kanaSrs = Object.fromEntries(
    masteredKana.map((id, index) => [
      id,
      srsEntry(8 - (index % 4), index < 6 ? -((index + 1) * 60_000) : 6 * 60 * 60 * 1000, 2 + (index % 3), 4, index % 5 === 0 ? 1 : 0),
    ])
  )
  const vocabSrs = Object.fromEntries(
    learnedVocab.map((id, index) => [
      id,
      srsEntry(6, index < 3 ? -((index + 2) * 90_000) : 12 * 60 * 60 * 1000, 2, 3, 0),
    ])
  )

  const mistakes = [
    {
      id: "mistake:kana-sa",
      type: "hiragana-romaji",
      questionText: "さ",
      itemId: "hiragana:sa",
      itemType: "kana",
      mode: "recognition",
      correctAnswer: "sa",
      correctDisplay: "sa",
      lastWrongAnswer: "shi",
      options: [
        { value: "sa", display: "sa" },
        { value: "shi", display: "shi" },
        { value: "za", display: "za" },
        { value: "cha", display: "cha" },
      ],
      wrongCount: 2,
      createdAt: daysAgo(1),
      lastWrongAt: daysAgo(0, 9),
    },
    {
      id: "mistake:vocab-sumimasen",
      type: "meaning-vocab",
      questionText: "すみません",
      itemId: "sur-g-6",
      itemType: "vocab",
      mode: "meaning",
      correctAnswer: "对不起/劳驾",
      correctDisplay: "对不起/劳驾",
      lastWrongAnswer: "谢谢",
      options: [
        { value: "对不起/劳驾", display: "对不起/劳驾" },
        { value: "谢谢", display: "谢谢" },
      ],
      wrongCount: 1,
      createdAt: daysAgo(2),
      lastWrongAt: daysAgo(0, 8),
    },
  ]
  const mistakeSrs = Object.fromEntries(
    mistakes.map((item, index) => [item.id, srsEntry(2, -((index + 1) * 30_000), 1, 0, item.wrongCount)])
  )

  localStorage.clear()
  localStorage.setItem("theme", "light")
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile))
  localStorage.setItem(STORAGE_KEYS.LESSON_PROGRESS, JSON.stringify(lessons))
  localStorage.setItem(STORAGE_KEYS.ITEM_PROGRESS, JSON.stringify(items))
  localStorage.setItem(STORAGE_KEYS.PRACTICE_RESULTS, JSON.stringify(results))
  localStorage.setItem(STORAGE_KEYS.KANA_MASTERED, JSON.stringify(masteredKana))
  localStorage.setItem(STORAGE_KEYS.VOCAB_LEARNED, JSON.stringify(learnedVocab))
  localStorage.setItem(STORAGE_KEYS.SRS_KANA, JSON.stringify(kanaSrs))
  localStorage.setItem(STORAGE_KEYS.SRS_VOCAB, JSON.stringify(vocabSrs))
  localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(mistakes))
  localStorage.setItem(STORAGE_KEYS.SRS_MISTAKES, JSON.stringify(mistakeSrs))
}

async function preparePage(page) {
  await page.addStyleTag({
    content: `
      html, body {
        scrollbar-width: none !important;
      }
      html::-webkit-scrollbar, body::-webkit-scrollbar {
        display: none !important;
      }
    `,
  })
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready
  })
  await page.waitForTimeout(400)
}

async function shot(page, name, { waitFor, click, scrollIntoView, extraWait = 0 } = {}) {
  if (waitFor) await page.locator(waitFor).first().waitFor({ state: "visible", timeout: 15_000 })
  if (click) {
    await page.locator(click).first().click()
    await page.waitForTimeout(500)
  }
  if (scrollIntoView) {
    await page.locator(scrollIntoView).first().scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, -72))
  }
  if (extraWait) await page.waitForTimeout(extraWait)
  await preparePage(page)
  const dest = path.join(OUT_DIR, name)
  await page.screenshot({
    path: dest,
    type: "jpeg",
    quality: 88,
    animations: "disabled",
    caret: "hide",
  })
  console.log(`wrote ${dest}`)
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({
    headless: true,
    args: ["--hide-scrollbars", "--disable-lcd-text"],
  })
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "light",
    reducedMotion: "reduce",
    locale: "zh-CN",
  })

  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" })
  await page.evaluate(seedLearnerState)
  await page.reload({ waitUntil: "networkidle" })
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.locator('[data-testid="home-start-learning"]').first().waitFor({ state: "visible", timeout: 15_000 })
  await page.locator('[data-testid="course-phase-n5"]').first().waitFor({ state: "visible", timeout: 15_000 })
  await page.evaluate(() => {
    const notebook = document.querySelector("#study-notebook")
    if (!notebook) return
    const top = notebook.getBoundingClientRect().top + window.scrollY
    window.scrollTo(0, Math.max(0, top - 88))
  })
  await shot(page, "home.jpg", {
    waitFor: "#study-notebook",
    extraWait: 600,
  })

  await page.setViewportSize({ width: 1440, height: 1300 })
  await page.goto(`${BASE_URL}/kana`, { waitUntil: "networkidle" })
  await shot(page, "kana.jpg", { waitFor: '[data-testid="kana-card-a"]', extraWait: 600 })

  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto(`${BASE_URL}/quiz?mode=hiragana-romaji`, { waitUntil: "networkidle" })
  await shot(page, "quiz.jpg", { waitFor: '[data-testid="quiz-question-text"]', extraWait: 400 })

  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto(`${BASE_URL}/path`, { waitUntil: "networkidle" })
  await shot(page, "path.jpg", { waitFor: '[data-testid="path-next-learning"]', extraWait: 400 })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${BASE_URL}/review`, { waitUntil: "networkidle" })
  await shot(page, "review.jpg", { waitFor: '[data-testid="review-today-due"]', extraWait: 400 })

  await page.goto(`${BASE_URL}/learn/day-5-se-so-te-to`, { waitUntil: "networkidle" })
  await shot(page, "lesson.jpg", { waitFor: "h2", extraWait: 600 })

  await browser.close()
}

await main()
