import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { appDir, createServerController, startBuiltProductionServer } from "../tests/e2e/harness.mjs"

// Run every audit regression against one locked production build. Each script
// creates an isolated browser context; no existing user profile is touched.
const checks = [
  "verify-assessment-validity.mjs",
  "verify-content-updates.mjs",
  "verify-output-evidence.mjs",
  "verify-retired-mistakes.mjs",
  "verify-assessment-history.mjs",
  "verify-course-vocabulary.mjs",
  "verify-knowledge-review.mjs",
  "verify-review-prompts.mjs",
  "verify-lesson-consolidation.mjs",
  "verify-course-kana.mjs",
  "verify-goal-practice.mjs",
  "verify-written-work.mjs",
  "verify-stage-writing.mjs",
  "verify-daily-study.mjs",
  "verify-lesson-review-summary.mjs",
  "verify-knowledge-variants.mjs",
  "verify-sentence-build-audit.mjs",
  "verify-stage-diagnostics.mjs",
  "verify-kanji-readings.mjs",
  "verify-coursebook-ui.mjs",
  "verify-product-ux.mjs",
  "verify-reference-experience.mjs",
  "verify-goal-practice-navigation.mjs",
]
const outputDir = path.join(appDir, "output", "audit-release")
fs.mkdirSync(outputDir, { recursive: true })
const controller = createServerController()
const results = []
const startedAt = new Date().toISOString()
let buildId = null
let failure = null
fs.writeFileSync(path.join(outputDir, "summary.json"), JSON.stringify({
  startedAt, passed: false, expected: checks.length, completed: 0, status: "running",
}, null, 2) + "\n")

async function runCheck(script, baseUrl) {
  const started = Date.now()
  const logPath = path.join(outputDir, script.replace(/\.mjs$/, ".log"))
  const log = fs.createWriteStream(logPath)
  console.log(`\n[${results.length + 1}/${checks.length}] ${script}`)
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(appDir, "scripts", script)], {
      cwd: appDir,
      env: { ...process.env, E2E_BASE_URL: baseUrl },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      timeout: 300_000,
    })
    let spawnError = null
    child.on("error", (error) => { spawnError = error.message })
    for (const stream of [child.stdout, child.stderr]) {
      stream.on("data", (chunk) => {
        log.write(chunk)
        process.stdout.write(chunk)
      })
    }
    child.on("close", (code, signal) => {
      log.end(() => resolve({
        script, passed: code === 0 && !spawnError, code, signal,
        error: spawnError, durationMs: Date.now() - started,
        log: path.relative(appDir, logPath).replaceAll("\\", "/"),
      }))
    })
  })
}

try {
  const baseUrl = await startBuiltProductionServer({
    port: 3213, controller, label: "required audit remediation regressions",
  })
  buildId = fs.readFileSync(path.join(appDir, ".next", "BUILD_ID"), "utf8").trim()
  console.log(`Audit regressions use production build ${buildId} at ${baseUrl}`)
  for (const script of checks) results.push(await runCheck(script, baseUrl))
  const failed = results.filter((result) => !result.passed)
  if (failed.length) throw new Error(`${failed.length}/${checks.length} audit checks failed: ${failed.map((result) => result.script).join(", ")}`)
  console.log(`All ${checks.length} required audit browser regressions passed.`)
} catch (error) {
  failure = error instanceof Error ? error.message : String(error)
  console.error(failure)
} finally {
  fs.writeFileSync(path.join(outputDir, "server.log"), controller.output)
  try { await controller.stop() }
  catch (error) {
    const cleanupFailure = error instanceof Error ? error.message : String(error)
    failure = failure ? `${failure}; ${cleanupFailure}` : cleanupFailure
    console.error(cleanupFailure)
  }
  fs.writeFileSync(path.join(outputDir, "summary.json"), JSON.stringify({
    startedAt, completedAt: new Date().toISOString(), buildId,
    passed: !failure && results.length === checks.length,
    expected: checks.length, completed: results.length, status: "finished", failure, results,
  }, null, 2) + "\n")
}

process.exit(failure ? 1 : 0)
