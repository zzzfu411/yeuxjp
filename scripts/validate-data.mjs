import fs from "fs"
import path from "path"
import url from "url"

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const srcDir = path.join(root, "src")

let failed = false

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

function fail(message) {
  failed = true
  console.error(`✗ ${message}`)
}

function pass(message) {
  console.log(`✓ ${message}`)
}

function exists(relPath) {
  return fs.existsSync(path.join(root, relPath))
}

function unique(name, values) {
  const seen = new Set()
  const dupes = new Set()
  for (const value of values) {
    if (seen.has(value)) dupes.add(value)
    seen.add(value)
  }

  if (dupes.size) {
    fail(`${name} contains duplicate values: ${Array.from(dupes).join(", ")}`)
  } else {
    pass(`${name} values are unique (${values.length})`)
  }
}

function matches(text, regex) {
  return Array.from(text.matchAll(regex), (m) => m[1])
}

function objectBlocks(text) {
  return Array.from(text.matchAll(/\{[^{}]*\}/g), (m) => m[0])
}

function prop(block, name) {
  const match = block.match(new RegExp(`${name}:\\s*['"]([^'"]+)['"]`))
  return match?.[1]
}

function requiredString(block, file, id, name) {
  const value = prop(block, name)
  if (!value || !value.trim()) fail(`${file} ${id} is missing required string field: ${name}`)
  return value
}

function arrayStrings(block, name) {
  const match = block.match(new RegExp(`${name}:\\s*\\[([\\s\\S]*?)\\]`))
  if (!match) return []
  return matches(match[1], /['"]([^'"]*)['"]/g)
}

function requireFile(relPath, label = relPath) {
  if (exists(relPath)) pass(`${label} exists`)
  else fail(`${label} is missing`)
}

function validateLessonPracticeMetadata(lessonText, { kanaIdSet, vocabIdSet, grammarIdSet }) {
  const practiceTypes = new Set(["multipleChoice", "typing", "dictation", "sentenceBuild"])
  const itemTypes = new Set(["kana", "vocab", "grammar", "sentence"])
  const modes = new Set(["recognition", "listening", "meaning", "recall", "production"])
  let checked = 0

  for (const block of objectBlocks(lessonText)) {
    const type = prop(block, "type")
    if (!practiceTypes.has(type)) continue
    if (!/id:\s*['"]/.test(block)) continue

    checked += 1
    const stepId = requiredString(block, "lesson practice step", "(unknown)", "id") ?? "(unknown)"
    const itemId = requiredString(block, "lesson practice step", stepId, "itemId")
    const itemType = requiredString(block, "lesson practice step", stepId, "itemType")
    const mode = requiredString(block, "lesson practice step", stepId, "mode")
    const answer = requiredString(block, "lesson practice step", stepId, "answer")

    if (itemType && !itemTypes.has(itemType)) fail(`lesson practice step ${stepId} has unknown itemType: ${itemType}`)
    if (mode && !modes.has(mode)) fail(`lesson practice step ${stepId} has unknown mode: ${mode}`)

    if (itemId && itemType === "kana" && !kanaIdSet.has(itemId)) fail(`lesson practice step ${stepId} references missing kana itemId: ${itemId}`)
    if (itemId && itemType === "vocab" && !vocabIdSet.has(itemId)) fail(`lesson practice step ${stepId} references missing vocabulary itemId: ${itemId}`)
    if (itemId && itemType === "grammar" && !grammarIdSet.has(itemId)) fail(`lesson practice step ${stepId} references missing grammar itemId: ${itemId}`)
    if (itemId && itemType === "sentence" && !itemId.startsWith("sentence-")) fail(`lesson practice step ${stepId} sentence itemId must start with sentence-: ${itemId}`)

    if (type === "multipleChoice") {
      const options = arrayStrings(block, "options")
      if (options.length < 2) fail(`lesson practice step ${stepId} multipleChoice needs at least two options`)
      if (answer && options.length && !options.includes(answer)) fail(`lesson practice step ${stepId} answer is not present in options`)
    }

    if (type === "dictation") {
      requiredString(block, "lesson practice step", stepId, "audioText")
    }

    if (type === "sentenceBuild") {
      const chunks = arrayStrings(block, "chunks")
      if (chunks.length < 2) fail(`lesson practice step ${stepId} sentenceBuild needs at least two chunks`)
      requiredString(block, "lesson practice step", stepId, "meaning")
    }
  }

  if (checked) pass(`lesson practice metadata checked (${checked})`)
  else fail("lesson practice metadata did not find any practice steps")
}

function validatePwaManifest() {
  const manifestPath = "public/manifest.webmanifest"
  requireFile(manifestPath, "PWA manifest")

  if (!exists(manifestPath)) return

  let manifest
  try {
    manifest = JSON.parse(read(manifestPath))
  } catch (error) {
    fail(`PWA manifest is invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
    return
  }

  const icons = Array.isArray(manifest.icons) ? manifest.icons : []
  const iconSizes = new Set(icons.map((icon) => icon?.sizes).filter(Boolean))
  for (const size of ["192x192", "512x512"]) {
    if (!iconSizes.has(size)) fail(`PWA manifest is missing ${size} icon`)
  }

  for (const icon of icons) {
    if (!icon?.src || typeof icon.src !== "string") {
      fail("PWA manifest contains an icon without src")
      continue
    }
    const relPath = `public/${icon.src.replace(/^\//, "")}`
    requireFile(relPath, `PWA icon ${icon.src}`)
  }
}

function validateServiceWorkerAssets() {
  const swPath = "public/sw.js"
  requireFile(swPath, "PWA service worker")
  if (!exists(swPath)) return

  const swText = read(swPath)
  const assetsMatch = swText.match(/const\s+STATIC_ASSETS\s*=\s*\[([\s\S]*?)\];/)
  if (!assetsMatch) {
    fail("PWA service worker is missing STATIC_ASSETS")
    return
  }

  const assets = matches(assetsMatch[1], /["']([^"']+)["']/g)
  if (!assets.length) fail("PWA service worker STATIC_ASSETS is empty")

  for (const asset of assets) {
    if (asset === "/") continue
    if (!asset.startsWith("/")) {
      fail(`PWA service worker asset must be root-relative: ${asset}`)
      continue
    }
    requireFile(`public/${asset.slice(1)}`, `PWA cached asset ${asset}`)
  }
}

function walkFiles(dir, predicate, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, out)
    } else if (predicate(fullPath)) {
      out.push(fullPath)
    }
  }
  return out
}

function validateNoMojibakeMarkers() {
  const sourceFiles = walkFiles(srcDir, (file) => /\.(ts|tsx|js|jsx|mjs)$/.test(file))
  const markdownFiles = [
    "README.md",
  ]
    .map((relPath) => path.join(root, relPath))
    .filter((file) => fs.existsSync(file))
  const files = [...sourceFiles, ...markdownFiles]
  const markerPattern = /[\u9287\u9288\u9289\u934b\u9354\u95ab\u9435\u704f]/
  const markerFragments = [
    "绗旈",
    "寰楀",
    "褰撳",
    "瀛︿",
    "澶囦",
    "鏃犳",
    "娓呯",
    "閿欓",
    "瀵煎",
    "鏈",
    "杩涘",
    "銇裤",
  ]
  const replacementPattern = /\?{4,}/
  const failures = []

  for (const file of files) {
    const relPath = path.relative(root, file).replace(/\\/g, "/")
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/)
    lines.forEach((line, index) => {
      if (markerPattern.test(line)) failures.push(`${relPath}:${index + 1}`)
      if (markerFragments.some((marker) => line.includes(marker))) failures.push(`${relPath}:${index + 1}`)
      if (replacementPattern.test(line)) failures.push(`${relPath}:${index + 1}`)
    })
  }

  if (failures.length) fail(`source/docs text contains likely mojibake markers: ${failures.join(", ")}`)
  else pass("source/docs text has no known mojibake markers")
}

const kanaText = read("src/data/kana-data.ts")
const kanaRomaji = matches(kanaText, /romaji:\s*['"]([^'"]+)['"]/g)
const kanaHiragana = matches(kanaText, /hiragana:\s*['"]([^'"]+)['"]/g)
const kanaKatakana = matches(kanaText, /katakana:\s*['"]([^'"]+)['"]/g)
unique("kana romaji", kanaRomaji)
unique("kana hiragana", kanaHiragana)
unique("kana katakana", kanaKatakana)

const animDir = path.join(root, "public", "animcjk", "kana")
const smallKanaMap = new Map([
  ["っ", "つ"],
  ["ゃ", "や"],
  ["ゅ", "ゆ"],
  ["ょ", "よ"],
  ["ッ", "ツ"],
  ["ャ", "ヤ"],
  ["ュ", "ユ"],
  ["ョ", "ヨ"],
])

const missingAnim = new Set()
for (const char of [...kanaHiragana, ...kanaKatakana].flatMap((value) => Array.from(value))) {
  const normalized = smallKanaMap.get(char) ?? char
  const codePoint = normalized.codePointAt(0)
  if (codePoint == null) continue
  const file = path.join(animDir, `${codePoint}.svg`)
  if (!fs.existsSync(file)) missingAnim.add(`${char} -> ${codePoint}.svg`)
}

if (missingAnim.size) {
  fail(`missing AnimCJK SVGs: ${Array.from(missingAnim).join(", ")}`)
} else {
  pass("AnimCJK SVG coverage is complete")
}

const vocabFiles = [
  { file: "src/data/vocabulary/survival.ts", defaultLevel: "survival" },
  { file: "src/data/vocabulary/daily.ts", defaultLevel: "daily" },
  { file: "src/data/vocabulary/fluent.ts", defaultLevel: "fluent" },
]

const vocabIds = []
const vocabCategories = new Set([
  "greetings",
  "verbs",
  "adjectives",
  "people",
  "food",
  "time",
  "nature",
  "daily",
  "body",
  "directions",
  "transport",
  "colors",
  "numbers",
  "furniture",
  "city",
  "grammar_words",
  "business",
  "emotion",
  "abstract",
  "society",
  "culture",
])
const vocabLevels = new Set(["survival", "daily", "fluent"])
for (const { file, defaultLevel } of vocabFiles) {
  const text = read(file)
  const ids = matches(text, /id:\s*['"]([^'"]+)['"]/g)
  vocabIds.push(...ids)
  pass(`${file} has ${ids.length} vocabulary entries`)

  for (const block of objectBlocks(text).filter((b) => /id:\s*['"]/.test(b))) {
    const id = requiredString(block, file, "(unknown)", "id")
    requiredString(block, file, id, "kana")
    requiredString(block, file, id, "romaji")
    requiredString(block, file, id, "meaning")
    const category = requiredString(block, file, id, "category")
    const level = prop(block, "level") ?? defaultLevel
    if (category && !vocabCategories.has(category)) fail(`${file} ${id} has unknown category: ${category}`)
    if (level && !vocabLevels.has(level)) fail(`${file} ${id} has unknown level: ${level}`)
  }
}
unique("vocabulary id", vocabIds)

const vocabIdSet = new Set(vocabIds)
const kanaIdSet = new Set(kanaRomaji)

let grammarIds = []
for (const file of [
  "src/data/grammar-data.ts",
  "src/data/semantics-data.ts",
  "src/data/pragmatics-data.ts",
  "src/data/glossary.ts",
]) {
  const ids = matches(read(file), /id:\s*['"]([^'"]+)['"]/g)
  if (file === "src/data/grammar-data.ts") grammarIds = ids
  unique(`${file} id`, ids)
}

const grammarIdSet = new Set(grammarIds)

const lessonText = read("src/data/lessons.ts")
const lessonIds = matches(lessonText, /id:\s*["'](day-\d+[^"']*)["']/g)
unique("lesson id", lessonIds)
validateLessonPracticeMetadata(lessonText, { kanaIdSet, vocabIdSet, grammarIdSet })

const lessonIdSet = new Set(lessonIds)
const prereqIds = matches(lessonText, /prerequisites:\s*\[([^\]]*)\]/g)
  .flatMap((chunk) => matches(chunk, /["']([^"']+)["']/g))
  .filter((id) => id.startsWith("day-"))
for (const id of prereqIds) {
  if (!lessonIdSet.has(id)) fail(`lesson prerequisite is missing: ${id}`)
}

const lessonItemRefs = Array.from(
  lessonText.matchAll(/\{\s*type:\s*["'](kana|vocab|grammar|sentence)["'],\s*id:\s*["']([^"']+)["']\s*\}/g),
  (m) => ({ type: m[1], id: m[2] })
)
for (const ref of lessonItemRefs) {
  if (ref.type === "kana" && !kanaIdSet.has(ref.id)) fail(`lesson references missing kana id: ${ref.id}`)
  if (ref.type === "vocab" && !vocabIdSet.has(ref.id)) fail(`lesson references missing vocabulary id: ${ref.id}`)
  if (ref.type === "grammar" && !grammarIdSet.has(ref.id)) fail(`lesson references missing grammar id: ${ref.id}`)
}
pass(`lesson item references checked (${lessonItemRefs.length})`)

const emptyLessonAnswers = Array.from(
  lessonText.matchAll(/type:\s*["'](multipleChoice|typing|dictation|sentenceBuild)["'][\s\S]*?answer:\s*["']\s*["']/g)
)
if (emptyLessonAnswers.length) fail(`lesson steps contain ${emptyLessonAnswers.length} empty answers`)
else pass("lesson practice answers are non-empty")

const lessonBlocks = lessonText.split(/\n\s*\{\n\s*id:\s*"day-/).slice(1)
for (const block of lessonBlocks) {
  const id = `day-${(block.match(/^([^"]+)/)?.[1] ?? "unknown")}`
  const newItemChunk = block.match(/newItemIds:\s*\[([\s\S]*?)\],\n\s*steps:/)?.[1] ?? ""
  const count = Array.from(newItemChunk.matchAll(/\{\s*type:/g)).length
  if (count > 8) fail(`${id} introduces too many new items (${count}; max 8)`)
}
pass("lesson new-item counts are within limits")

if (!fs.existsSync(path.join(srcDir, "lib", "storage-keys.ts"))) {
  fail("storage key registry is missing")
}

for (const relPath of [
  "src/data/vocab-data.ts",
  "src/data/kanaHira.json",
  "src/data/kanaKata.json",
]) {
  if (exists(relPath)) fail(`legacy data source should be removed: ${relPath}`)
}

validatePwaManifest()
validateServiceWorkerAssets()
requireFile("public/offline.html", "PWA offline fallback")
requireFile("public/favicon.ico", "favicon")
requireFile("public/apple-touch-icon.png", "apple touch icon")
validateNoMojibakeMarkers()

if (failed) {
  process.exitCode = 1
} else {
  console.log("\nData validation passed.")
}
