export const appHealthRoutes = [
  "/",
  "/kana",
  "/vocabulary",
  "/quiz",
  "/review",
  "/path",
  "/grammar",
  "/semantics",
  "/pragmatics",
  "/learn/day-1-a-row-hello",
]

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function pageLooksLikeYasashi(html) {
  return /Yasashi|__next/.test(html)
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
    return pageLooksLikeYasashi(html)
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
