import assert from "node:assert/strict"
import fs from "node:fs"
import { spawnSync } from "node:child_process"
import path from "node:path"
import test from "node:test"
import { pathToFileURL } from "node:url"

const root = path.resolve(import.meta.dirname, "..", "..")
const workspaceRoot = path.resolve(root, "..")

test("data validation script passes for the current repository", () => {
  const result = spawnSync("node", ["scripts/validate-data.mjs"], {
    cwd: root,
    encoding: "utf8",
  })

  assert.equal(result.status, 0, result.stderr || result.stdout)
  assert.match(result.stdout, /Data validation passed/)
})

test("data validation scans source, scripts, tests, public text assets, and docs for common mojibake fragments", () => {
  const source = fs.readFileSync(path.join(root, "scripts/validate-data.mjs"), "utf8")

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
  assert.match(source, /replacementCharPattern/)
  assert.match(source, /\\uFFFD/)
  assert.match(source, /README\.md/)
  assert.match(source, /path\.join\(workspaceRoot, "README\.md"\)/)
  assert.match(source, /workspaceRoot/)
  assert.match(source, /CLAUDE\.md/)
  assert.match(source, /README_CODEX\.md/)
  assert.match(source, /PLAN\.md/)
  for (const marker of ["绗旈", "寰楀", "褰撳", "瀛︿", "澶囦", "鏃犳", "娓呯", "閿欓", "瀵煎", "銇裤", "璇硶", "鎼滅储", "閬撳満", "姝ｅ父", "鎱?", "蹇?"]) { // mojibake-ok detector fixture
    assert.ok(source.includes(marker), `validator should detect ${marker}`)
  }
  assert.match(source, /source\/scripts\/root-scripts\/tests\/public\/docs text contains likely mojibake markers/)
})

test("data validation checks lesson practice metadata and references", () => {
  const source = fs.readFileSync(path.join(root, "scripts/validate-data.mjs"), "utf8")

  assert.match(source, /function validateLessonPracticeMetadata/)
  assert.match(source, /lesson practice metadata checked/)
  assert.match(source, /itemType/)
  assert.match(source, /mode/)
  assert.match(source, /references missing kana itemId/)
  assert.match(source, /references missing vocabulary itemId/)
  assert.match(source, /references missing grammar itemId/)
  assert.match(source, /answer is not present in options/)
  assert.match(source, /sentence itemId must start with sentence-/)
  assert.match(source, /function collectLessonSourceText/)
  assert.match(source, /src\/data\/lessons\.ts/)
  assert.match(source, /src\/data\/lessons\/\$\{name\}/)
  assert.match(source, /max 12/)
  assert.doesNotMatch(source, /max 8/)
})

test("data validation makes course grammar coverage and intentional exclusions explicit", async () => {
  const validator = await import(pathToFileURL(path.join(root, "scripts/validate-data.mjs")).href)

  const lessonText = `
    newItemIds: [
      { id: "n5-wa", type: "grammar", source: "course" },
      { type: "vocab", id: "sur-p-1" },
    ],
    steps: [],
    newItemIds: [{ type: "grammar", id: "n4-tara" }],
    steps: [],
  `
  const refs = validator.extractLessonNewItemRefs(lessonText)
  assert.deepEqual(refs, [
    { type: "grammar", id: "n5-wa" },
    { type: "vocab", id: "sur-p-1" },
    { type: "grammar", id: "n4-tara" },
  ])

  const grammarIdsByLevel = new Map([
    ["N5", new Set(["n5-wa"])],
    ["N4", new Set(["n4-tara", "n4-reference-only"])],
  ])
  assert.deepEqual(
    validator.findMissingCourseGrammarIds(grammarIdsByLevel, refs, new Set(["n4-reference-only"])),
    []
  )
  assert.deepEqual(
    validator.findMissingCourseGrammarIds(grammarIdsByLevel, refs, new Set()),
    ["n4-reference-only"]
  )
  assert.deepEqual([...validator.COURSE_GRAMMAR_EXCLUSIONS].sort(), ["n4-te-iru", "n4-te-kudasai"])
})

test("lesson kana validation rejects bare romaji while accepting canonical and custom phonology ids", async () => {
  const validator = await import(pathToFileURL(path.join(root, "scripts/validate-data.mjs")).href)
  const knownRomaji = new Set(["a", "sokuon"])

  assert.equal(validator.classifyLessonKanaItemId("a", knownRomaji), "bare-romaji")
  assert.equal(validator.classifyLessonKanaItemId("hiragana:a", knownRomaji), "canonical")
  assert.equal(validator.classifyLessonKanaItemId("katakana:a", knownRomaji), "canonical")
  assert.equal(validator.classifyLessonKanaItemId("hiragana:missing", knownRomaji), "unknown-canonical")
  assert.equal(validator.classifyLessonKanaItemId("sokuon:きって", knownRomaji), "custom")
  assert.equal(validator.classifyLessonKanaItemId("longvowel:おばあさん", knownRomaji), "custom")
})

test("data validation requires AnimCJK license files for distribution", () => {
  const source = fs.readFileSync(path.join(root, "scripts/validate-data.mjs"), "utf8")

  assert.match(source, /public\/animcjk\/licenses\/COPYING\.txt/)
  assert.match(source, /public\/animcjk\/licenses\/LGPL\.txt/)
})

test("data validation normalizes every small kana variant before checking AnimCJK coverage", () => {
  const source = fs.readFileSync(path.join(root, "scripts/validate-data.mjs"), "utf8")
  const rootDownloaderPath = path.join(workspaceRoot, "scripts/download-animcjk-kana.mjs")
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
  const source = fs.readFileSync(path.join(root, "scripts/validate-data.mjs"), "utf8")

  assert.match(source, /function validateOfflineFallback/)
  assert.match(source, /public\/offline\.html/)
  assert.match(source, /当前离线/)
  assert.match(source, /已缓存的页面和笔顺资源仍可使用/)
  assert.match(source, /已保存的学习进度仍保存在当前浏览器/)
  assert.match(source, /PWA offline fallback must not run scripts/)
  assert.match(source, /localStorage\|sessionStorage\|indexedDB\|caches\\\./)
  assert.match(source, /validateOfflineFallback\(\)/)
})

test("data validation verifies PWA manifest install metadata and PNG dimensions", () => {
  const source = fs.readFileSync(path.join(root, "scripts/validate-data.mjs"), "utf8")

  assert.match(source, /function validatePwaManifest/)
  assert.match(source, /function readPngDimensions/)
  assert.match(source, /readUInt32BE\(16\)/)
  assert.match(source, /readUInt32BE\(20\)/)
  assert.match(source, /\["id", "\/"\]/)
  assert.match(source, /\["start_url", "\/"\]/)
  assert.match(source, /\["scope", "\/"\]/)
  assert.match(source, /\["display", "standalone"\]/)
  assert.match(source, /\["background_color", "#fffdf9"\]/)
  assert.match(source, /\["theme_color", "#fffdf9"\]/)
  assert.match(source, /PWA manifest icon src must be root-relative/)
  assert.match(source, /for \(const field of \["sizes", "type", "purpose"\]\)/)
  assert.match(source, /PWA manifest icon \$\{icon\.src\} \$\{field\} must be/)
  assert.match(source, /PWA manifest icon .* must be a valid PNG/)
  assert.match(source, /expected \$\{sizeToken\}/)
  assert.match(source, /"\/icons\/icon-192\.png"/)
  assert.match(source, /"\/icons\/icon-512\.png"/)
  assert.match(source, /"\/apple-touch-icon\.png"/)
})

test("data validation guards partitioned PWA precache drift and budgets", () => {
  const source = fs.readFileSync(path.join(root, "scripts/validate-data.mjs"), "utf8")

  assert.match(source, /const PWA_PRECACHE_ASSET_BUDGET_BYTES = 256 \* 1024/)
  assert.match(source, /const PWA_PRECACHE_ENTRY_BUDGET = 64/)
  assert.match(source, /function serviceWorkerAssets/)
  assert.match(source, /function serviceWorkerAssetGroups/)
  assert.match(source, /serviceWorkerAssets\(text, "CORE_SHELL_ASSETS"\)/)
  assert.match(source, /serviceWorkerAssets\(text, "RUNTIME_ASSETS"\)/)
  assert.match(source, /function serviceWorkerNumericConst/)
  assert.match(source, /function cacheWorthyPublicAssets/)
  assert.match(source, /function isCacheWorthyPublicAsset/)
  assert.match(source, /function formatBytes/)
  assert.match(source, /precachedAssetBytes \+= fileSize\(relPath\)/)
  assert.match(source, /PWA service worker precache total size is/)
  assert.match(source, /const requiredArrays = \["CORE_SHELL_ASSETS", "RUNTIME_ASSETS"\]/)
  assert.match(source, /shell\/runtime asset groups are disjoint/)
  assert.match(source, /shell and runtime cache partition is explicit/)
  assert.match(source, /RUNTIME_CACHE_MAX_ENTRIES/)
  assert.match(source, /precache entry count is/)
  assert.match(source, /relPath\.startsWith\("\/assets\/"\)/)
  assert.match(source, /relPath\.startsWith\("\/brand\/"\)/)
  assert.match(source, /relPath\.startsWith\("\/icons\/"\)/)
  assert.match(source, /PWA service worker RUNTIME_ASSETS is missing installation assets/)
  assert.match(source, /PWA service worker runtime cache covers installation assets/)
  assert.match(source, /CORE_SHELL_ASSETS must not contain runtime media/)
  assert.doesNotMatch(source, /serviceWorkerAssets\(text, "STATIC_ASSETS"\)/)
})

test("data validation requires explicit vocabulary fields and matching levels", () => {
  const source = fs.readFileSync(path.join(root, "scripts/validate-data.mjs"), "utf8")

  assert.match(source, /const vocabLevelPrefixes = new Map/)
  assert.match(source, /requiredString\(block, file, id, "kana"\)/)
  assert.match(source, /\\p\{Script=Han\}/)
  assert.match(source, /kana must contain the reading, not kanji/)
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
  const source = fs.readFileSync(path.join(root, "scripts/validate-data.mjs"), "utf8")

  assert.match(source, /function topLevelObjectBlocks/)
  assert.match(source, /function validateGrammarData/)
  assert.match(source, /level must match containing grammar bucket/)
  assert.match(source, /validateObjectArrayFields\(block, file, id, "examples", \["japanese", "romaji", "meaning"\]\)/)
  assert.match(source, /function collectGrammarSourceText/)
  assert.match(source, /src\/data\/grammar-practice-n4\.ts/)
  assert.match(source, /src\/data\/grammar-practice-n3\.ts/)
  assert.match(source, /src\/data\/grammar-practice-n2\.ts/)
  assert.match(source, /function validateGrammarPracticeTemplates/)
  assert.match(source, /function validateGrammarPracticeData/)
  assert.match(source, /n5GrammarPracticeSets/)
  assert.match(source, /n4GrammarPracticeSets/)
  assert.match(source, /n3GrammarPracticeSets/)
  assert.match(source, /n2GrammarPracticeSets/)
  assert.match(source, /duplicate practice template id/)
  assert.match(source, /practice options must contain at least two non-empty values/)
  assert.match(source, /practice options must be unique/)
  assert.match(source, /answer must be present in practice options/)
  assert.match(source, /is missing an \$\{level\} grammar practice set/)
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
