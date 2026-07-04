import assert from "node:assert/strict"
import fs from "node:fs"
import { spawnSync } from "node:child_process"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..", "..")

test("data validation script passes for the current repository", () => {
  const result = spawnSync("node", ["scripts/validate-data.mjs"], {
    cwd: path.join(root, "web"),
    encoding: "utf8",
  })

  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, /Data validation passed/)
})

test("data validation scans source, scripts, tests, public text assets, and docs for common mojibake fragments", () => {
  const source = fs.readFileSync(path.join(root, "web/scripts/validate-data.mjs"), "utf8")

  assert.match(source, /function validateNoMojibakeMarkers/)
  assert.match(source, /walkFiles\(srcDir/)
  assert.match(source, /path\.join\(root, "scripts"\)/)
  assert.match(source, /rootScriptDir/)
  assert.match(source, /path\.join\(workspaceRoot, "scripts"\)/)
  assert.match(source, /rootScriptFiles/)
  assert.match(source, /path\.join\(root, "tests"\)/)
  assert.match(source, /path\.join\(root, "public"\)/)
  assert.match(source, /html\|webmanifest\|json\|txt\|svg\|js\|css/)
  assert.match(source, /mojibake-ok/)
  assert.match(source, /README\.md/)
  assert.match(source, /workspaceRoot/)
  assert.match(source, /CLAUDE\.md/)
  assert.match(source, /README_CODEX\.md/)
  assert.match(source, /PLAN\.md/)
  for (const marker of ["绗旈", "寰楀", "褰撳", "瀛︿", "澶囦", "鏃犳", "娓呯", "閿欓", "瀵煎", "銇裤"]) { // mojibake-ok detector fixture
    assert.ok(source.includes(marker), `validator should detect ${marker}`)
  }
  assert.match(source, /source\/scripts\/root-scripts\/tests\/public\/docs text contains likely mojibake markers/)
})

test("data validation checks lesson practice metadata and references", () => {
  const source = fs.readFileSync(path.join(root, "web/scripts/validate-data.mjs"), "utf8")

  assert.match(source, /function validateLessonPracticeMetadata/)
  assert.match(source, /lesson practice metadata checked/)
  assert.match(source, /itemType/)
  assert.match(source, /mode/)
  assert.match(source, /references missing kana itemId/)
  assert.match(source, /references missing vocabulary itemId/)
  assert.match(source, /references missing grammar itemId/)
  assert.match(source, /answer is not present in options/)
  assert.match(source, /sentence itemId must start with sentence-/)
})

test("data validation requires AnimCJK license files for distribution", () => {
  const source = fs.readFileSync(path.join(root, "web/scripts/validate-data.mjs"), "utf8")

  assert.match(source, /public\/animcjk\/licenses\/COPYING\.txt/)
  assert.match(source, /public\/animcjk\/licenses\/LGPL\.txt/)
})

test("data validation normalizes every small kana variant before checking AnimCJK coverage", () => {
  const source = fs.readFileSync(path.join(root, "web/scripts/validate-data.mjs"), "utf8")
  const rootDownloaderPath = path.join(root, "scripts/download-animcjk-kana.mjs")
  const rootDownloader = fs.existsSync(rootDownloaderPath)
    ? fs.readFileSync(rootDownloaderPath, "utf8")
    : null

  for (const pair of [
    '["ぁ", "あ"]',
    '["ぃ", "い"]',
    '["ぅ", "う"]',
    '["ぇ", "え"]',
    '["ぉ", "お"]',
    '["っ", "つ"]',
    '["ゃ", "や"]',
    '["ゅ", "ゆ"]',
    '["ょ", "よ"]',
    '["ァ", "ア"]',
    '["ィ", "イ"]',
    '["ゥ", "ウ"]',
    '["ェ", "エ"]',
    '["ォ", "オ"]',
    '["ッ", "ツ"]',
    '["ャ", "ヤ"]',
    '["ュ", "ユ"]',
    '["ョ", "ヨ"]',
  ]) {
    assert.ok(source.includes(pair), `validator should normalize ${pair}`)
  }

  if (rootDownloader) {
    for (const pair of [
      '"ぁ": "あ"',
      '"ぃ": "い"',
      '"ぅ": "う"',
      '"ぇ": "え"',
      '"ぉ": "お"',
      '"っ": "つ"',
      '"ゃ": "や"',
      '"ゅ": "ゆ"',
      '"ょ": "よ"',
      '"ァ": "ア"',
      '"ィ": "イ"',
      '"ゥ": "ウ"',
      '"ェ": "エ"',
      '"ォ": "オ"',
      '"ッ": "ツ"',
      '"ャ": "ヤ"',
      '"ュ": "ユ"',
      '"ョ": "ヨ"',
    ]) {
      assert.ok(rootDownloader.includes(pair), `root AnimCJK downloader should normalize ${pair}`)
    }
  }
})

test("data validation verifies the offline fallback copy and learning-state boundary", () => {
  const source = fs.readFileSync(path.join(root, "web/scripts/validate-data.mjs"), "utf8")

  assert.match(source, /function validateOfflineFallback/)
  assert.match(source, /public\/offline\.html/)
  assert.match(source, /当前离线/)
  assert.match(source, /已缓存的页面和笔顺资源仍可使用/)
  assert.match(source, /学习进度不会被 service worker 缓存或覆盖/)
  assert.match(source, /PWA offline fallback must not run scripts/)
  assert.match(source, /localStorage\|sessionStorage\|indexedDB\|caches\\\./)
  assert.match(source, /validateOfflineFallback\(\)/)
})

test("data validation verifies PWA manifest install metadata and PNG dimensions", () => {
  const source = fs.readFileSync(path.join(root, "web/scripts/validate-data.mjs"), "utf8")

  assert.match(source, /function validatePwaManifest/)
  assert.match(source, /function readPngDimensions/)
  assert.match(source, /readUInt32BE\(16\)/)
  assert.match(source, /readUInt32BE\(20\)/)
  assert.match(source, /\["start_url", "\/"\]/)
  assert.match(source, /\["scope", "\/"\]/)
  assert.match(source, /\["display", "standalone"\]/)
  assert.match(source, /\["background_color", "#fdfbf7"\]/)
  assert.match(source, /\["theme_color", "#ffb7b2"\]/)
  assert.match(source, /PWA manifest icon src must be root-relative/)
  assert.match(source, /for \(const field of \["sizes", "type", "purpose"\]\)/)
  assert.match(source, /PWA manifest icon \$\{icon\.src\} \$\{field\} must be/)
  assert.match(source, /PWA manifest icon .* must be a valid PNG/)
  assert.match(source, /expected \$\{sizeToken\}/)
  assert.match(source, /"\/icons\/icon-192\.png"/)
  assert.match(source, /"\/icons\/icon-512\.png"/)
  assert.match(source, /"\/apple-touch-icon\.png"/)
})

test("data validation guards PWA static asset cache drift", () => {
  const source = fs.readFileSync(path.join(root, "web/scripts/validate-data.mjs"), "utf8")

  assert.match(source, /const PWA_STATIC_ASSET_BUDGET_BYTES = 3 \* 1024 \* 1024/)
  assert.match(source, /function serviceWorkerStaticAssets/)
  assert.match(source, /function cacheWorthyPublicAssets/)
  assert.match(source, /function isCacheWorthyPublicAsset/)
  assert.match(source, /function formatBytes/)
  assert.match(source, /cachedAssetBytes \+= fileSize\(relPath\)/)
  assert.match(source, /PWA service worker STATIC_ASSETS total size is/)
  assert.match(source, /serviceWorkerArrayBody\(swText, "STATIC_ASSETS"\)/)
  assert.match(source, /relPath\.startsWith\("\/assets\/"\)/)
  assert.match(source, /relPath\.startsWith\("\/brand\/"\)/)
  assert.match(source, /relPath\.startsWith\("\/icons\/"\)/)
  assert.match(source, /PWA service worker STATIC_ASSETS is missing cache-worthy public assets/)
  assert.match(source, /PWA service worker caches cache-worthy public assets/)
})

test("data validation requires explicit vocabulary fields and matching levels", () => {
  const source = fs.readFileSync(path.join(root, "web/scripts/validate-data.mjs"), "utf8")

  assert.match(source, /const vocabLevelPrefixes = new Map/)
  assert.match(source, /requiredString\(block, file, id, "kana"\)/)
  assert.match(source, /requiredString\(block, file, id, "romaji"\)/)
  assert.match(source, /requiredString\(block, file, id, "meaning"\)/)
  assert.match(source, /requiredString\(block, file, id, "category"\)/)
  assert.match(source, /requiredString\(block, file, id, "level"\)/)
  assert.match(source, /level must match file level/)
  assert.match(source, /id must start with/)
  assert.match(source, /id\.startsWith\(expectedPrefix\)/)
  assert.doesNotMatch(source, /prop\(block, "level"\) \?\? defaultLevel/)
})

test("data validation requires reference data fields and enum values", () => {
  const source = fs.readFileSync(path.join(root, "web/scripts/validate-data.mjs"), "utf8")

  assert.match(source, /function topLevelObjectBlocks/)
  assert.match(source, /function validateGrammarData/)
  assert.match(source, /level must match containing grammar bucket/)
  assert.match(source, /validateObjectArrayFields\(block, file, id, "examples", \["japanese", "romaji", "meaning"\]\)/)
  assert.match(source, /function validateSemanticsData/)
  assert.match(source, /pair[\s\S]*exactly two non-empty strings/)
  assert.match(source, /meaning[\s\S]*exactly two non-empty strings/)
  assert.match(source, /validateObjectArrayFields\(block, file, id, "examples", \["sentence", "translation", "nuance"\]\)/)
  assert.match(source, /function validatePragmaticsData/)
  assert.match(source, /new Set\(\["Good", "Bad", "Native", "Anime"\]\)/)
  assert.match(source, /has unknown response type/)
  assert.match(source, /function validateGlossaryData/)
  assert.match(source, /new Set\(\["kana", "pronunciation", "grammar", "levels"\]\)/)
  assert.match(source, /grammar entries checked/)
  assert.match(source, /semantics entries checked/)
  assert.match(source, /pragmatics entries checked/)
  assert.match(source, /glossary entries checked/)
})
