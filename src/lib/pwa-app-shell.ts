export const PWA_WARM_CURRENT_PAGE_MESSAGE = "WARM_CURRENT_PAGE"
export const PWA_CURRENT_PAGE_WARMED_MESSAGE = "CURRENT_PAGE_WARMED"

type WarmCurrentPageResponse = {
  type?: string
  cachedUrls?: string[]
  failedUrls?: string[]
}

const WARMABLE_EXACT_PATHS = new Set([
  "/apple-touch-icon.png",
  "/favicon.ico",
  "/manifest.webmanifest",
])

const WARMABLE_PATH_PREFIXES = [
  "/_next/image",
  "/_next/static/",
  "/animcjk/",
  "/assets/",
  "/brand/",
  "/icons/",
  "/fonts/",
]

function isWarmableUrl(url: URL, origin: string) {
  return url.origin === origin && (
    WARMABLE_EXACT_PATHS.has(url.pathname) ||
    WARMABLE_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
  )
}

export function collectCurrentPagePwaUrls(document: Document) {
  const candidates = new Set<string>()

  for (const script of document.querySelectorAll<HTMLScriptElement>("script[src]")) {
    candidates.add(script.src)
  }

  for (const link of document.querySelectorAll<HTMLLinkElement>("link[href]")) {
    const shouldWarm = link.relList.contains("stylesheet") ||
      link.relList.contains("modulepreload") ||
      (link.relList.contains("preload") && ["font", "image", "script", "style"].includes(link.as))
    if (shouldWarm) candidates.add(link.href)
  }

  for (const image of document.images) {
    candidates.add(image.currentSrc || image.src)
  }

  const origin = new URL(document.baseURI).origin
  return Array.from(candidates)
    .filter(Boolean)
    .map((candidate) => new URL(candidate, document.baseURI))
    .filter((url) => isWarmableUrl(url, origin))
    .map((url) => url.href)
}

export function warmCurrentPwaPage(
  worker: ServiceWorker,
  document: Document,
  timeoutMs = 15_000
) {
  const urls = collectCurrentPagePwaUrls(document)

  return new Promise<WarmCurrentPageResponse>((resolve, reject) => {
    const channel = new MessageChannel()
    const timeout = window.setTimeout(() => {
      channel.port1.close()
      reject(new Error("Timed out while warming the current PWA page"))
    }, timeoutMs)

    channel.port1.onmessage = (event: MessageEvent<WarmCurrentPageResponse>) => {
      if (event.data?.type !== PWA_CURRENT_PAGE_WARMED_MESSAGE) return

      window.clearTimeout(timeout)
      channel.port1.close()
      if (event.data.failedUrls?.length) {
        reject(new Error(`Failed to warm ${event.data.failedUrls.length} current-page resource(s)`))
        return
      }
      resolve(event.data)
    }

    worker.postMessage({ type: PWA_WARM_CURRENT_PAGE_MESSAGE, urls }, [channel.port2])
  })
}
