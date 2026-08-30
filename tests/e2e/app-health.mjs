export const appHealthRoutes = [
  "/",
  "/kana",
  "/vocabulary",
  "/quiz",
  "/review",
  "/path",
  "/grammar",
  "/semantics",
  "/semantics/s-shiru-wakaru",
  "/pragmatics",
  "/pragmatics/p-aisatsu-morning",
  "/learn/day-1-a-row-hello",
]

export const appNotFoundRoutes = [
  "/learn/__missing__",
  "/semantics/__missing__",
  "/pragmatics/__missing__",
]

const OHAYOU_GOZAIMASU = String.fromCodePoint(0x304a, 0x306f, 0x3088, 0x3046, 0x3054, 0x3056, 0x3044, 0x307e, 0x3059)

const defaultPageSentinelGroups = { any: [/Yasashi Japanese/, /__next/] }

export const appHealthRouteSentinels = {
  "/": { all: [/课 程 路 径/] },
  "/kana": { all: [/data-route-shell="kana"/] },
  "/vocabulary": { all: [/data-route-shell="vocabulary"/] },
  "/quiz": { all: [/data-route-shell="quiz"/] },
  "/review": { all: [/learning-data-panel/], any: [/review-empty-state/, /review-scheduled-empty-state/] },
  "/path": { all: [/path-next-learning/] },
  "/grammar": { all: [/data-route-shell="grammar"/] },
  "/semantics": { all: [/Nuance Lab/, /s-shiru-wakaru/] },
  "/semantics/s-shiru-wakaru": { all: [/Nuance Lab/, /s-shiru-wakaru/] },
  "/pragmatics": { all: [/p-aisatsu-morning/] },
  "/pragmatics/p-aisatsu-morning": { all: [new RegExp(OHAYOU_GOZAIMASU), /p-aisatsu-morning/] },
  "/learn/day-1-a-row-hello": { all: [/lesson-next/, /day-1-a-row-hello/] },
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function getRouteHealthSentinels(route) {
  const groups = appHealthRouteSentinels[route] ?? defaultPageSentinelGroups
  return [...(groups.all ?? []), ...(groups.any ?? [])]
}

function matchesSentinel(html, sentinel) {
  return sentinel.test(html)
}

export function pageLooksLikeYasashi(html, route = null) {
  const groups = route ? appHealthRouteSentinels[route] ?? defaultPageSentinelGroups : defaultPageSentinelGroups
  const required = groups.all ?? []
  const alternatives = groups.any ?? []
  return (
    required.every((sentinel) => matchesSentinel(html, sentinel)) &&
    (!alternatives.length || alternatives.some((sentinel) => matchesSentinel(html, sentinel)))
  )
}

export async function canReach(url, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(url)
    return response.ok
  } catch {
    return false
  }
}

export async function routeLooksHealthy(url, route, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(`${url}${route}`)
    if (response.status !== 200) return false
    const html = await response.text()
    return pageLooksLikeYasashi(html, route)
  } catch {
    return false
  }
}

export async function canServeRoutes(url, routes = appHealthRoutes, fetchImpl = fetch) {
  for (const route of routes) {
    if (!(await routeLooksHealthy(url, route, fetchImpl))) return false
  }
  return true
}

export async function waitForServer(
  url,
  { timeoutMs = 60_000, intervalMs = 500, fetchImpl = fetch } = {}
) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await canReach(url, fetchImpl)) return
    await wait(intervalMs)
  }
  throw new Error(`Timed out waiting for ${url}`)
}
