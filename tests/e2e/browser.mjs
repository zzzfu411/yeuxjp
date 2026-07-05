import {
  createPageIssueCollector,
  createServerController,
  importPlaywrightOrSkip,
  isExpectedBrowserRequestAbort,
  isE2ERequired,
  reuseOrStartDevServer,
  skipOptionalPlaywrightRuntimeError,
  startProductionServer,
} from "./harness.mjs"
import {
  verifyConfirmDialogKeyboardFlow,
  verifyDueReviewFlow,
  verifyInitialReviewEmptyState,
  verifyKanaAndVocabularyFlow,
  verifyLearningDataFlow,
  verifyLessonFlow,
  verifyMobileSmoke,
  verifyPwaUpdateBannerFlow,
  verifyProfileSaveFailureFlow,
  verifyQuizAndMistakeFlow,
  verifyPracticeSaveFailureFlow,
  verifyProgressSaveFailureFlow,
  verifyReferenceKeyboardFlow,
  verifySpeechPreferenceSaveFailureFlow,
  verifyVocabularyLoadRetryFlow,
} from "./browser-flows.mjs"

const port = Number(process.env.E2E_PORT ?? 3210)
let baseUrl = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${port}`
const browserE2ERequired = isE2ERequired("E2E_BROWSER_REQUIRED")
const serverController = createServerController()

async function ensureServer() {
  const serverStarter = browserE2ERequired ? startProductionServer : reuseOrStartDevServer
  baseUrl = await serverStarter({
    baseUrl,
    port,
    controller: serverController,
    label: "browser production e2e",
  })
}

let browser = null
let context = null
let failure = null
let issueCollector = null

try {
  const { chromium } = await importPlaywrightOrSkip({
    required: browserE2ERequired,
    label: "Browser E2E",
    skipMessage: "Browser E2E skipped: Playwright is not installed. Run `npm ci --prefix web`, then `npm run e2e:install --prefix web` before the required browser E2E.",
    errorMessage: "Browser E2E requires Playwright. Run `npm ci --prefix web`, then `npm run e2e:install --prefix web`, or set E2E_BASE_URL and run in an environment with Playwright available.",
  })
  await ensureServer()
  browser = await chromium.launch({ headless: true })
  issueCollector = createPageIssueCollector({
    label: "Browser E2E",
    allowRequestFailure: isExpectedBrowserRequestAbort,
  })
  context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } })
  issueCollector.attachContext(context)
  const page = await context.newPage()
  issueCollector.attachPage(page)

  await verifyLessonFlow(page, baseUrl)
  await verifyInitialReviewEmptyState(page, baseUrl)
  await verifyConfirmDialogKeyboardFlow(page, baseUrl)
  await verifyVocabularyLoadRetryFlow(page, baseUrl)
  await verifyKanaAndVocabularyFlow(page, baseUrl)
  await verifyReferenceKeyboardFlow(page, baseUrl)
  await verifyQuizAndMistakeFlow(page, baseUrl)
  await verifyDueReviewFlow(page, baseUrl)
  await verifyProfileSaveFailureFlow(page, baseUrl)
  await verifyPracticeSaveFailureFlow(page, baseUrl)
  await verifyProgressSaveFailureFlow(page, baseUrl)
  await verifySpeechPreferenceSaveFailureFlow(page, baseUrl)
  await verifyLearningDataFlow(page, baseUrl)
  await verifyPwaUpdateBannerFlow(page, baseUrl)
  await verifyMobileSmoke(browser, baseUrl, issueCollector)
  issueCollector.assertNoIssues()

  console.log(`Browser E2E checks passed at ${baseUrl}`)
} catch (error) {
  if (
    skipOptionalPlaywrightRuntimeError({
      error,
      required: browserE2ERequired,
      skipMessage:
        "Browser E2E skipped: Playwright browser binaries are not installed. Run `npm run e2e:install --prefix web` or use `npm run e2e:browser:required --prefix web` in a provisioned environment.",
    })
  ) {
    failure = null
  } else {
    console.error(serverController.output)
    failure = issueCollector?.appendToError(error) ?? error
  }
} finally {
  await context?.close()
  await browser?.close()
  await serverController.stop()
}

if (failure) {
  console.error(failure)
  process.exit(1)
} else {
  process.exit(0)
}
