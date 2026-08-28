import fs from "fs"
import path from "path"
import url from "url"

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const workspaceRoot = path.resolve(root, "..")
const srcDir = path.join(root, "src")
const PWA_PRECACHE_ASSET_BUDGET_BYTES = 3 * 1024 * 1024
const PWA_PRECACHE_ENTRY_BUDGET = 64

let failed = false

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8")
}

function readBuffer(relPath) {
  return fs.readFileSync(path.join(root, relPath))
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

function fileSize(relPath) {
  return fs.statSync(path.join(root, relPath)).size
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`
}

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function readPngDimensions(relPath) {
  const buffer = readBuffer(relPath)
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  if (buffer.length < 24 || !pngSignature.every((byte, index) => buffer[index] === byte)) return null
  if (buffer.toString("ascii", 12, 16) !== "IHDR") return null
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
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

function serviceWorkerConstStrings(text) {
  const constants = new Map()
  for (const match of text.matchAll(/const\s+([A-Z_][A-Z0-9_]*)\s*=\s*(["'])(.*?)\2\s*;/g)) {
    constants.set(match[1], match[3])
  }
  return constants
}

function serviceWorkerArrayBody(text, name) {
  const match = new RegExp(`const\\s+${name}\\s*=\\s*\\[`).exec(text)
  if (!match) return null
  const start = match.index + match[0].lastIndexOf("[")
  const end = findBalancedClose(text, start, "[", "]")
  if (end < 0) return null
  return text.slice(start + 1, end)
}

function serviceWorkerAssets(text, arrayName) {
  const constants = serviceWorkerConstStrings(text)

  function readArray(name, trail = new Set()) {
    if (trail.has(name)) return []
    const body = serviceWorkerArrayBody(text, name)
    if (body == null) return []

    const nextTrail = new Set(trail)
    nextTrail.add(name)
    const assets = []
    for (const match of body.matchAll(/\.\.\.([A-Z_][A-Z0-9_]*)|(["'])(.*?)\2|\b([A-Z_][A-Z0-9_]*)\b/g)) {
      const spreadName = match[1]
      const literal = match[3]
      const constName = match[4]
      if (spreadName) {
        assets.push(...readArray(spreadName, nextTrail))
      } else if (literal != null) {
        assets.push(literal)
      } else if (constName && constants.has(constName)) {
        assets.push(constants.get(constName))
      }
    }
    return assets
  }

  return Array.from(new Set(readArray(arrayName)))
}

function serviceWorkerAssetGroups(text) {
  return {
    shell: serviceWorkerAssets(text, "CORE_SHELL_ASSETS"),
    runtime: serviceWorkerAssets(text, "RUNTIME_ASSETS"),
  }
}

function serviceWorkerNumericConst(text, name) {
  const match = new RegExp(`const\\s+${name}\\s*=\\s*([\\d_]+)\\s*;`).exec(text)
  return match ? Number(match[1].replaceAll("_", "")) : null
}

function publicRootRelPath(file) {
  return `/${path.relative(path.join(root, "public"), file).replace(/\\/g, "/")}`
}

function isCacheWorthyPublicAsset(file) {
  const relPath = publicRootRelPath(file)
  if (!/\.(ico|png|webp|jpe?g|svg)$/i.test(relPath)) return false
  return relPath === "/favicon.ico" ||
    relPath === "/apple-touch-icon.png" ||
    relPath.startsWith("/assets/") ||
    relPath.startsWith("/brand/") ||
    relPath.startsWith("/icons/")
}

function cacheWorthyPublicAssets() {
  return walkFiles(path.join(root, "public"), isCacheWorthyPublicAsset)
    .map(publicRootRelPath)
    .sort()
}

function objectBlocks(text) {
  return Array.from(text.matchAll(/\{[^{}]*\}/g), (m) => m[0])
}

function findBalancedClose(text, start, openChar, closeChar) {
  let depth = 0
  let quote = null
  let escaped = false

  for (let i = start; i < text.length; i += 1) {
    const char = text[i]

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

    if (char === openChar) depth += 1
    if (char === closeChar) {
      depth -= 1
      if (depth === 0) return i
    }
  }

  return -1
}

function topLevelObjectBlocks(text) {
  const blocks = []
  let start = -1
  let depth = 0
  let quote = null
  let escaped = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]

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

    if (char === "{") {
      if (depth === 0) start = i
      depth += 1
    } else if (char === "}") {
      depth -= 1
      if (depth === 0 && start >= 0) {
        blocks.push(text.slice(start, i + 1))
        start = -1
      }
    }
  }

  return blocks
}

function arrayBody(block, name) {
  const match = new RegExp(`${name}:\\s*\\[`).exec(block)
  if (!match) return null
  const start = match.index + match[0].lastIndexOf("[")
  const end = findBalancedClose(block, start, "[", "]")
  if (end < 0) return null
  return block.slice(start + 1, end)
}

function prop(block, name) {
  const match = block.match(new RegExp(`${name}:\\s*(["'])([\\s\\S]*?)\\1`))
  return match?.[2]
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

function validateObjectArrayFields(block, file, id, arrayName, fieldNames) {
  const body = arrayBody(block, arrayName)
  const items = body ? topLevelObjectBlocks(body) : []
  if (!items.length) {
    fail(`${file} ${id} needs at least one ${arrayName} item`)
    return
  }

  for (const item of items) {
    for (const field of fieldNames) {
      requiredString(item, file, id, field)
    }
  }
}

function validateGrammarPracticeTemplates(block, file, grammarId) {
  const body = arrayBody(block, "practiceTemplates")
  const templates = body ? topLevelObjectBlocks(body) : []
  if (!templates.length) {
    fail(`${file} ${grammarId} needs at least one practiceTemplates item`)
    return
  }

  const templateIds = new Set()
  for (const template of templates) {
    const templateId = (requiredString(template, file, grammarId, "id") ?? "(unknown)").trim()
    const answer = requiredString(template, file, `${grammarId}/${templateId}`, "answer")
    requiredString(template, file, `${grammarId}/${templateId}`, "prompt")

    if (templateIds.has(templateId)) fail(`${file} ${grammarId} has duplicate practice template id: ${templateId}`)
    templateIds.add(templateId)

    const options = arrayStrings(template, "options").map((option) => option.trim()).filter(Boolean)
    if (options.length < 2) {
      fail(`${file} ${grammarId}/${templateId} practice options must contain at least two non-empty values`)
    }
    if (new Set(options).size !== options.length) {
      fail(`${file} ${grammarId}/${templateId} practice options must be unique`)
    }
    if (answer && !options.includes(answer.trim())) {
      fail(`${file} ${grammarId}/${templateId} answer must be present in practice options`)
    }
  }
}

function validateGrammarPracticeData(text, n5GrammarIds) {
  const file = "src/data/grammar-data.ts"
  const body = arrayBody(text, "n5GrammarPracticeSets")
  const sets = body ? topLevelObjectBlocks(body) : []
  const coveredGrammarIds = new Set()

  for (const block of sets) {
    const grammarId = (requiredString(block, file, "(unknown practice set)", "grammarId") ?? "(unknown)").trim()
    if (coveredGrammarIds.has(grammarId)) fail(`${file} has duplicate N5 grammar practice set: ${grammarId}`)
    coveredGrammarIds.add(grammarId)
    if (!n5GrammarIds.has(grammarId)) fail(`${file} practice set references unknown N5 grammar id: ${grammarId}`)
    validateGrammarPracticeTemplates(block, file, grammarId)
  }

  for (const grammarId of n5GrammarIds) {
    if (!coveredGrammarIds.has(grammarId)) fail(`${file} ${grammarId} is missing an N5 grammar practice set`)
  }

  if (sets.length) pass(`N5 grammar practice sets checked (${sets.length})`)
  else fail(`${file} does not define any N5 grammar practice sets`)
}

function validateGrammarData(text) {
  const file = "src/data/grammar-data.ts"
  const levels = Array.from(text.matchAll(/^\s*(N5|N4|N3|N2|N1|Anime):\s*\[/gm))
  const allowedLevels = new Set(["N5", "N4", "N3", "N2", "N1", "Anime"])
  const n5GrammarIds = new Set()
  let checked = 0

  for (let i = 0; i < levels.length; i += 1) {
    const containingLevel = levels[i][1]
    const start = levels[i].index
    const end = levels[i + 1]?.index ?? text.length
    const section = text.slice(start, end)

    for (const block of topLevelObjectBlocks(section).filter((item) => /id:\s*['"]/.test(item))) {
      checked += 1
      const id = requiredString(block, file, "(unknown)", "id") ?? "(unknown)"
      if (containingLevel === "N5") n5GrammarIds.add(id)
      requiredString(block, file, id, "title")
      requiredString(block, file, id, "structure")
      requiredString(block, file, id, "explanation")
      const level = requiredString(block, file, id, "level")
      if (level && !allowedLevels.has(level)) fail(`${file} ${id} has unknown level: ${level}`)
      if (level && level !== containingLevel) {
        fail(`${file} ${id} level must match containing grammar bucket: expected ${containingLevel}, got ${level}`)
      }
      validateObjectArrayFields(block, file, id, "examples", ["japanese", "romaji", "meaning"])
    }
  }

  validateGrammarPracticeData(text, n5GrammarIds)

  if (checked) pass(`grammar entries checked (${checked})`)
  else fail("grammar data validation did not find any entries")
}

function validateSemanticsData(text) {
  const file = "src/data/semantics-data.ts"
  let checked = 0

  for (const block of topLevelObjectBlocks(text).filter((item) => /id:\s*['"]/.test(item))) {
    checked += 1
    const id = requiredString(block, file, "(unknown)", "id") ?? "(unknown)"
    requiredString(block, file, id, "title")
    requiredString(block, file, id, "explanation")
    for (const name of ["pair", "meaning"]) {
      const values = arrayStrings(block, name)
      if (values.length !== 2 || values.some((value) => !value.trim())) {
        fail(`${file} ${id} ${name} must contain exactly two non-empty strings`)
      }
    }
    validateObjectArrayFields(block, file, id, "examples", ["sentence", "translation", "nuance"])
  }

  if (checked) pass(`semantics entries checked (${checked})`)
  else fail("semantics data validation did not find any entries")
}

function validatePragmaticsData(text) {
  const file = "src/data/pragmatics-data.ts"
  const responseTypes = new Set(["Good", "Bad", "Native", "Anime"])
  let checked = 0

  for (const block of topLevelObjectBlocks(text).filter((item) => /id:\s*['"]/.test(item))) {
    checked += 1
    const id = requiredString(block, file, "(unknown)", "id") ?? "(unknown)"
    requiredString(block, file, id, "title")
    requiredString(block, file, id, "situation")
    requiredString(block, file, id, "context")
    requiredString(block, file, id, "culturalNote")

    const responses = topLevelObjectBlocks(arrayBody(block, "responses") ?? "")
    if (!responses.length) fail(`${file} ${id} needs at least one responses item`)
    for (const response of responses) {
      const type = requiredString(response, file, id, "type")
      if (type && !responseTypes.has(type)) fail(`${file} ${id} has unknown response type: ${type}`)
      requiredString(response, file, id, "expression")
      requiredString(response, file, id, "explanation")
    }
  }

  if (checked) pass(`pragmatics entries checked (${checked})`)
  else fail("pragmatics data validation did not find any entries")
}

function validateGlossaryData(text) {
  const file = "src/data/glossary.ts"
  const categories = new Set(["kana", "pronunciation", "grammar", "levels"])
  let checked = 0

  for (const block of topLevelObjectBlocks(text).filter((item) => /id:\s*['"]/.test(item))) {
    checked += 1
    const id = requiredString(block, file, "(unknown)", "id") ?? "(unknown)"
    requiredString(block, file, id, "term")
    requiredString(block, file, id, "short")
    const category = requiredString(block, file, id, "category")
    if (category && !categories.has(category)) fail(`${file} ${id} has unknown category: ${category}`)
  }

  if (checked) pass(`glossary entries checked (${checked})`)
  else fail("glossary data validation did not find any entries")
}

export function classifyLessonKanaItemId(itemId, kanaRomajiSet) {
  if (kanaRomajiSet.has(itemId)) return "bare-romaji"

  const canonical = /^(hiragana|katakana):([^:]+)$/.exec(itemId)
  if (canonical) return kanaRomajiSet.has(canonical[2]) ? "canonical" : "unknown-canonical"
  if (/^(hiragana|katakana):/.test(itemId)) return "unknown-canonical"

  return "custom"
}

function validateLessonKanaItemId(itemId, label, kanaRomajiSet) {
  const classification = classifyLessonKanaItemId(itemId, kanaRomajiSet)
  if (classification === "bare-romaji") {
    fail(`${label} uses bare known romaji kana itemId: ${itemId}`)
  } else if (classification === "unknown-canonical") {
    fail(`${label} references missing kana itemId: ${itemId}`)
  }
}

function validateLessonPracticeMetadata(lessonText, { kanaRomajiSet, vocabIdSet, grammarIdSet }) {
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

    if (itemId && itemType === "kana") validateLessonKanaItemId(itemId, `lesson practice step ${stepId}`, kanaRomajiSet)
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

  if (!isObject(manifest)) {
    fail("PWA manifest root must be an object")
    return
  }

  const requiredFields = new Map([
    ["id", "/"],
    ["start_url", "/"],
    ["scope", "/"],
    ["display", "standalone"],
    ["background_color", "#fdf6e3"],
    ["theme_color", "#facc15"],
  ])

  for (const [field, expected] of requiredFields) {
    if (manifest[field] !== expected) fail(`PWA manifest ${field} must be ${expected}`)
    else pass(`PWA manifest ${field} is ${expected}`)
  }

  const icons = Array.isArray(manifest.icons) ? manifest.icons : []
  if (!icons.length) fail("PWA manifest icons must be a non-empty array")

  const iconSizes = new Set(icons.map((icon) => icon?.sizes).filter(Boolean))
  for (const size of ["192x192", "512x512"]) {
    if (!iconSizes.has(size)) fail(`PWA manifest is missing ${size} icon`)
  }

  const requiredIcons = new Map([
    ["/icons/icon-192.png", { sizes: "192x192", type: "image/png", purpose: "any maskable" }],
    ["/icons/icon-512.png", { sizes: "512x512", type: "image/png", purpose: "any maskable" }],
    ["/apple-touch-icon.png", { sizes: "180x180", type: "image/png", purpose: "any" }],
  ])

  for (const icon of icons) {
    if (!isObject(icon) || typeof icon.src !== "string" || !icon.src) {
      fail("PWA manifest contains an icon without src")
      continue
    }

    if (!icon.src.startsWith("/")) fail(`PWA manifest icon src must be root-relative: ${icon.src}`)

    const relPath = `public/${icon.src.replace(/^\//, "")}`
    requireFile(relPath, `PWA icon ${icon.src}`)

    const required = requiredIcons.get(icon.src)
    if (required) {
      for (const field of ["sizes", "type", "purpose"]) {
        if (icon[field] !== required[field]) {
          fail(`PWA manifest icon ${icon.src} ${field} must be ${required[field]}`)
        }
      }
    }

    if (icon.type === "image/png" && exists(relPath)) {
      const dimensions = readPngDimensions(relPath)
      if (!dimensions) {
        fail(`PWA manifest icon ${icon.src} must be a valid PNG`)
        continue
      }

      const sizeTokens = typeof icon.sizes === "string" ? icon.sizes.split(/\s+/).filter(Boolean) : []
      for (const sizeToken of sizeTokens) {
        const match = sizeToken.match(/^(\d+)x(\d+)$/)
        if (!match) {
          fail(`PWA manifest icon ${icon.src} has invalid size token: ${sizeToken}`)
          continue
        }

        const expectedWidth = Number(match[1])
        const expectedHeight = Number(match[2])
        if (dimensions.width !== expectedWidth || dimensions.height !== expectedHeight) {
          fail(`PWA manifest icon ${icon.src} is ${dimensions.width}x${dimensions.height}, expected ${sizeToken}`)
        }
      }
    }
  }
}

function validateServiceWorkerAssets() {
  const swPath = "public/sw.js"
  requireFile(swPath, "PWA service worker")
  if (!exists(swPath)) return

  const swText = read(swPath)
  const requiredArrays = ["CORE_SHELL_ASSETS", "RUNTIME_ASSETS"]
  const missingArrays = requiredArrays.filter((name) => !serviceWorkerArrayBody(swText, name))
  if (missingArrays.length) {
    fail(`PWA service worker is missing asset groups: ${missingArrays.join(", ")}`)
    return
  }

  const { shell: shellAssets, runtime: runtimeAssets } = serviceWorkerAssetGroups(swText)
  if (!shellAssets.length) fail("PWA service worker CORE_SHELL_ASSETS is empty")
  if (!runtimeAssets.length) fail("PWA service worker RUNTIME_ASSETS is empty")

  const requiredShellAssets = ["/", "/offline.html", "/manifest.webmanifest"]
  const missingShellAssets = requiredShellAssets.filter((asset) => !shellAssets.includes(asset))
  if (missingShellAssets.length) {
    fail(`PWA service worker CORE_SHELL_ASSETS is missing required shell resources: ${missingShellAssets.join(", ")}`)
  } else {
    pass(`PWA service worker keeps required shell resources together (${requiredShellAssets.length})`)
  }

  const overlappingAssets = shellAssets.filter((asset) => runtimeAssets.includes(asset))
  if (overlappingAssets.length) {
    fail(`PWA service worker shell/runtime asset groups overlap: ${overlappingAssets.join(", ")}`)
  } else {
    pass("PWA service worker shell/runtime asset groups are disjoint")
  }

  const partitionContracts = [
    [/const\s+SHELL_ASSET_PATHS\s*=\s*new Set\(CORE_SHELL_ASSETS\)/, "shell paths must derive from CORE_SHELL_ASSETS"],
    [/const\s+RUNTIME_ASSET_PATHS\s*=\s*new Set\(RUNTIME_ASSETS\)/, "runtime paths must derive from RUNTIME_ASSETS"],
    [/isNextStaticAsset\(requestUrl\)[\s\S]*?return SHELL_CACHE_NAME/, "Next static resources must use the shell cache"],
    [/isRuntimeAssetPath\(requestUrl\)[\s\S]*?return RUNTIME_CACHE_NAME/, "images and AnimCJK resources must use the runtime cache"],
    [/cacheName === RUNTIME_CACHE_NAME[\s\S]*?trimRuntimeCache\(cache\)/, "runtime eviction must be scoped to the runtime cache"],
  ]
  for (const [pattern, message] of partitionContracts) {
    if (!pattern.test(swText)) fail(`PWA service worker cache partition is invalid: ${message}`)
  }
  if (partitionContracts.every(([pattern]) => pattern.test(swText))) {
    pass("PWA service worker shell and runtime cache partition is explicit")
  }

  const assets = Array.from(new Set([...shellAssets, ...runtimeAssets]))

  let precachedAssetBytes = 0
  for (const asset of assets) {
    if (asset === "/") continue
    if (!asset.startsWith("/")) {
      fail(`PWA service worker asset must be root-relative: ${asset}`)
      continue
    }
    const relPath = `public/${asset.slice(1)}`
    requireFile(relPath, `PWA cached asset ${asset}`)
    if (exists(relPath)) precachedAssetBytes += fileSize(relPath)
  }

  const cacheWorthyAssets = cacheWorthyPublicAssets()
  const missingRuntimeAssets = cacheWorthyAssets.filter((asset) => !runtimeAssets.includes(asset))
  if (missingRuntimeAssets.length) {
    fail(`PWA service worker RUNTIME_ASSETS is missing cache-worthy public assets: ${missingRuntimeAssets.join(", ")}`)
  } else {
    pass(`PWA service worker runtime cache owns cache-worthy public assets (${cacheWorthyAssets.length})`)
  }

  const shellMediaAssets = shellAssets.filter((asset) => cacheWorthyAssets.includes(asset))
  if (shellMediaAssets.length) {
    fail(`PWA service worker CORE_SHELL_ASSETS must not contain runtime media: ${shellMediaAssets.join(", ")}`)
  }

  if (assets.length > PWA_PRECACHE_ENTRY_BUDGET) {
    fail(`PWA service worker precache entry count is ${assets.length}, above ${PWA_PRECACHE_ENTRY_BUDGET}`)
  } else {
    pass(`PWA service worker precache entry count is ${assets.length} / ${PWA_PRECACHE_ENTRY_BUDGET}`)
  }

  const runtimeEntryLimit = serviceWorkerNumericConst(swText, "RUNTIME_CACHE_MAX_ENTRIES")
  if (runtimeEntryLimit == null) {
    fail("PWA service worker is missing numeric RUNTIME_CACHE_MAX_ENTRIES")
  } else if (runtimeAssets.length > runtimeEntryLimit) {
    fail(`PWA service worker RUNTIME_ASSETS count is ${runtimeAssets.length}, above runtime limit ${runtimeEntryLimit}`)
  } else {
    pass(`PWA service worker RUNTIME_ASSETS fit the runtime limit (${runtimeAssets.length} / ${runtimeEntryLimit})`)
  }

  if (precachedAssetBytes > PWA_PRECACHE_ASSET_BUDGET_BYTES) {
    fail(
      `PWA service worker precache total size is ${formatBytes(precachedAssetBytes)}, above ${formatBytes(PWA_PRECACHE_ASSET_BUDGET_BYTES)}`
    )
  } else {
    pass(
      `PWA service worker precache total size is ${formatBytes(precachedAssetBytes)} / ${formatBytes(PWA_PRECACHE_ASSET_BUDGET_BYTES)}`
    )
  }
}

function validateOfflineFallback() {
  const offlinePath = "public/offline.html"
  requireFile(offlinePath, "PWA offline fallback")
  if (!exists(offlinePath)) return

  const offlineText = read(offlinePath)
  const requiredSnippets = [
    "lang=\"zh-CN\"",
    "当前离线",
    "已缓存的页面和笔顺资源仍可使用",
    "学习进度不会被 service worker 缓存或覆盖",
    "回到首页",
  ]

  for (const snippet of requiredSnippets) {
    if (!offlineText.includes(snippet)) fail(`PWA offline fallback is missing required copy: ${snippet}`)
  }

  if (/<script\b/i.test(offlineText)) fail("PWA offline fallback must not run scripts")
  if (/localStorage|sessionStorage|indexedDB|caches\./.test(offlineText)) {
    fail("PWA offline fallback must not read or mutate browser learning state")
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
  const scriptFiles = walkFiles(path.join(root, "scripts"), (file) => /\.(js|mjs|ts)$/.test(file))
  const rootScriptDir = path.join(workspaceRoot, "scripts")
  const rootScriptFiles = fs.existsSync(rootScriptDir)
    ? walkFiles(rootScriptDir, (file) => /\.(js|mjs|ts)$/.test(file))
    : []
  const testFiles = walkFiles(path.join(root, "tests"), (file) => /\.(js|mjs|ts|tsx)$/.test(file))
  const publicTextFiles = walkFiles(path.join(root, "public"), (file) => /\.(html|webmanifest|json|txt|svg|js|css)$/.test(file))
  const markdownFiles = [
    path.join(root, "README.md"),
    path.join(workspaceRoot, "README.md"),
    path.join(workspaceRoot, "CLAUDE.md"),
    path.join(workspaceRoot, "README_CODEX.md"),
    path.join(workspaceRoot, "PLAN.md"),
  ]
    .filter((file) => fs.existsSync(file))
  const files = [...sourceFiles, ...scriptFiles, ...rootScriptFiles, ...testFiles, ...publicTextFiles, ...markdownFiles]
  const markerPattern = /[\u9287\u9288\u9289\u934b\u9354\u95ab\u9435\u704f]/
  const markerFragments = [
    "绗旈", // mojibake-ok detector fixture
    "寰楀", // mojibake-ok detector fixture
    "褰撳", // mojibake-ok detector fixture
    "瀛︿", // mojibake-ok detector fixture
    "澶囦", // mojibake-ok detector fixture
    "鏃犳", // mojibake-ok detector fixture
    "娓呯", // mojibake-ok detector fixture
    "閿欓", // mojibake-ok detector fixture
    "瀵煎", // mojibake-ok detector fixture
    "鏈", // mojibake-ok detector fixture
    "杩涘", // mojibake-ok detector fixture
    "銇裤", // mojibake-ok detector fixture
    "璇硶", // mojibake-ok detector fixture
    "鎼滅储", // mojibake-ok detector fixture
    "閬撳満", // mojibake-ok detector fixture
    "姝ｅ父", // mojibake-ok detector fixture
    "鎱?", // mojibake-ok detector fixture
    "蹇?", // mojibake-ok detector fixture
  ]
  const replacementCharPattern = /\uFFFD/
  const replacementPattern = /\?{4,}/
  const failures = []

  for (const file of files) {
    const relPath = path.relative(workspaceRoot, file).replace(/\\/g, "/")
    const lines = fs.readFileSync(file, "utf8").split(/\r?\n/)
    lines.forEach((line, index) => {
      if (line.includes("mojibake-ok")) return
      if (markerPattern.test(line)) failures.push(`${relPath}:${index + 1}`)
      if (markerFragments.some((marker) => line.includes(marker))) failures.push(`${relPath}:${index + 1}`)
      if (replacementCharPattern.test(line)) failures.push(`${relPath}:${index + 1}`)
      if (replacementPattern.test(line)) failures.push(`${relPath}:${index + 1}`)
    })
  }

  if (failures.length) fail(`source/scripts/root-scripts/tests/public/docs text contains likely mojibake markers: ${failures.join(", ")}`)
  else pass("source/scripts/root-scripts/tests/public/docs text has no known mojibake markers")
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
  ["ぁ", "あ"],
  ["ぃ", "い"],
  ["ぅ", "う"],
  ["ぇ", "え"],
  ["ぉ", "お"],
  ["っ", "つ"],
  ["ゃ", "や"],
  ["ゅ", "ゆ"],
  ["ょ", "よ"],
  ["ァ", "ア"],
  ["ィ", "イ"],
  ["ゥ", "ウ"],
  ["ェ", "エ"],
  ["ォ", "オ"],
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
const vocabLevelPrefixes = new Map([
  ["survival", "sur-"],
  ["daily", "day-"],
  ["fluent", "flu-"],
])
for (const { file, defaultLevel } of vocabFiles) {
  const text = read(file)
  const ids = matches(text, /id:\s*['"]([^'"]+)['"]/g)
  vocabIds.push(...ids)
  pass(`${file} has ${ids.length} vocabulary entries`)

  for (const block of objectBlocks(text).filter((b) => /id:\s*['"]/.test(b))) {
    const id = requiredString(block, file, "(unknown)", "id")
    const kana = requiredString(block, file, id, "kana")
    if (kana && /\p{Script=Han}/u.test(kana)) {
      fail(`${file} ${id} kana must contain the reading, not kanji: ${kana}`)
    }
    requiredString(block, file, id, "romaji")
    requiredString(block, file, id, "meaning")
    const category = requiredString(block, file, id, "category")
    const level = requiredString(block, file, id, "level")
    if (category && !vocabCategories.has(category)) fail(`${file} ${id} has unknown category: ${category}`)
    if (level && !vocabLevels.has(level)) fail(`${file} ${id} has unknown level: ${level}`)
    if (level && level !== defaultLevel) fail(`${file} ${id} level must match file level: expected ${defaultLevel}, got ${level}`)
    const expectedPrefix = vocabLevelPrefixes.get(level)
    if (id && expectedPrefix && !id.startsWith(expectedPrefix)) {
      fail(`${file} ${id} id must start with ${expectedPrefix} for ${level} level`)
    }
  }
}
unique("vocabulary id", vocabIds)
const vocabIdSet = new Set(vocabIds)

const vocabRegistryText = read("src/data/vocabulary/id-registry.ts")
if (!vocabRegistryText.includes("VOCAB_ID_RANGES")) {
  fail("vocabulary id registry is missing range definitions")
}
if (!vocabRegistryText.includes("EXACT_VOCAB_IDS")) {
  fail("vocabulary id registry is missing exact id definitions")
}

const rangeMatches = Array.from(
  vocabRegistryText.matchAll(/\{\s*level:\s*["']([^"']+)["'],\s*prefix:\s*["']([^"']+)["'],\s*from:\s*(\d+),\s*to:\s*(\d+)\s*\}/g),
  (match) => ({
    level: match[1],
    prefix: match[2],
    from: Number(match[3]),
    to: Number(match[4]),
  })
)
const exactMatches = Array.from(
  vocabRegistryText.matchAll(/\[\s*["']([^"']+)["'],\s*["']([^"']+)["']\s*\]/g),
  (match) => ({ id: match[1], level: match[2] })
)

function registryLevelForVocabId(id) {
  const exact = exactMatches.find((entry) => entry.id === id)
  if (exact) return exact.level
  for (const range of rangeMatches) {
    if (!id.startsWith(range.prefix)) continue
    const suffix = id.slice(range.prefix.length)
    if (!/^[1-9]\d*$/.test(suffix)) continue
    const n = Number(suffix)
    if (n >= range.from && n <= range.to) return range.level
  }
  return null
}

const registryCoveredIds = new Set()
for (const { id, level } of exactMatches) {
  if (!vocabIdSet.has(id)) fail(`vocabulary id registry exact id is not in vocabulary data: ${id}`)
  if (!vocabLevels.has(level)) fail(`vocabulary id registry exact id ${id} has unknown level: ${level}`)
  registryCoveredIds.add(id)
}

for (const range of rangeMatches) {
  if (!vocabLevels.has(range.level)) fail(`vocabulary id registry range ${range.prefix} has unknown level: ${range.level}`)
  if (!Number.isInteger(range.from) || !Number.isInteger(range.to) || range.from > range.to) {
    fail(`vocabulary id registry range ${range.prefix} has invalid bounds`)
    continue
  }
  for (let n = range.from; n <= range.to; n += 1) {
    const id = `${range.prefix}${n}`
    if (!vocabIdSet.has(id)) fail(`vocabulary id registry range includes missing vocabulary id: ${id}`)
    registryCoveredIds.add(id)
  }
}

for (const id of vocabIds) {
  const level = registryLevelForVocabId(id)
  if (!level) fail(`vocabulary id registry does not cover vocabulary id: ${id}`)
  const expectedPrefix = vocabLevelPrefixes.get(level)
  if (expectedPrefix && !id.startsWith(expectedPrefix)) {
    fail(`vocabulary id registry maps ${id} to ${level}, but its id prefix is not ${expectedPrefix}`)
  }
}

if (registryCoveredIds.size === vocabIdSet.size) {
  pass(`vocabulary id registry covers current ids (${registryCoveredIds.size})`)
}

const kanaRomajiSet = new Set(kanaRomaji)

let grammarIds = []
const grammarText = read("src/data/grammar-data.ts")
const semanticsText = read("src/data/semantics-data.ts")
const pragmaticsText = read("src/data/pragmatics-data.ts")
const glossaryText = read("src/data/glossary.ts")
for (const [file, text] of [
  ["src/data/grammar-data.ts", grammarText],
  ["src/data/semantics-data.ts", semanticsText],
  ["src/data/pragmatics-data.ts", pragmaticsText],
  ["src/data/glossary.ts", glossaryText],
]) {
  const ids = matches(text, /id:\s*['"]([^'"]+)['"]/g)
  if (file === "src/data/grammar-data.ts") grammarIds = ids
  unique(`${file} id`, ids)
}
validateGrammarData(grammarText)
validateSemanticsData(semanticsText)
validatePragmaticsData(pragmaticsText)
validateGlossaryData(glossaryText)

const grammarIdSet = new Set(grammarIds)

const lessonText = read("src/data/lessons.ts")
const lessonIds = matches(lessonText, /id:\s*["'](day-\d+[^"']*)["']/g)
unique("lesson id", lessonIds)
validateLessonPracticeMetadata(lessonText, { kanaRomajiSet, vocabIdSet, grammarIdSet })

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
  if (ref.type === "kana") validateLessonKanaItemId(ref.id, "lesson item reference", kanaRomajiSet)
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
validateOfflineFallback()
requireFile("public/favicon.ico", "favicon")
requireFile("public/apple-touch-icon.png", "apple touch icon")
requireFile("public/animcjk/licenses/COPYING.txt", "AnimCJK COPYING license")
requireFile("public/animcjk/licenses/LGPL.txt", "AnimCJK LGPL license")
validateNoMojibakeMarkers()

if (failed) {
  process.exitCode = 1
} else {
  console.log("\nData validation passed.")
}
