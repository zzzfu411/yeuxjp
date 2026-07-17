import assert from "node:assert/strict"
import net from "node:net"
import test from "node:test"
import {
  appHealthRoutes,
  appHealthRouteSentinels,
  appNotFoundRoutes,
  canReach,
  canServeRoutes,
  getRouteHealthSentinels,
  pageLooksLikeYasashi,
  routeLooksHealthy,
} from "../e2e/app-health.mjs"
import { findAvailablePort } from "../e2e/harness.mjs"

function fakeResponse(status, html = "") {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => html,
  }
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(port, "127.0.0.1", () => {
      server.off("error", reject)
      resolve()
    })
  })
}

function close(server) {
  return new Promise((resolve) => {
    if (!server.listening) {
      resolve()
      return
    }
    server.close(resolve)
  })
}

async function canListen(port) {
  const server = net.createServer()
  try {
    await listen(server, port)
    return true
  } catch {
    return false
  } finally {
    await close(server)
  }
}

async function createOccupiedPortWithBindableFallback() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const server = net.createServer()
    await listen(server, 0)
    const address = server.address()
    const occupiedPort = typeof address === "object" && address ? address.port : 0
    const fallbackPort = occupiedPort + 1

    if (occupiedPort > 0 && fallbackPort <= 65_535 && await canListen(fallbackPort)) {
      return { server, occupiedPort, fallbackPort }
    }

    await close(server)
  }

  throw new Error("Could not find a deterministic fallback port fixture")
}

test("E2E app health recognizes current app pages", () => {
  assert.deepEqual(appHealthRoutes, [
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
  ])
  assert.deepEqual(Object.keys(appHealthRouteSentinels), appHealthRoutes)
  assert.equal(getRouteHealthSentinels("/kana").some((sentinel) => sentinel.test('data-route-shell="kana"')), true)
  assert.equal(pageLooksLikeYasashi("<html>Yasashi Japanese</html>"), true)
  assert.equal(pageLooksLikeYasashi("<html><body><div id=\"__next\"></div></body></html>"), true)
  assert.equal(pageLooksLikeYasashi("<html>home-start-learning</html>", "/"), true)
  assert.equal(pageLooksLikeYasashi("<html>Yasashi Japanese</html>", "/kana"), false)
  assert.equal(pageLooksLikeYasashi('<html data-route-shell="kana"></html>', "/kana"), true)
  assert.equal(pageLooksLikeYasashi('<html data-route-shell="quiz"></html>', "/quiz"), true)
  assert.equal(pageLooksLikeYasashi("<html>path-next-learning</html>", "/path"), true)
  assert.equal(pageLooksLikeYasashi("<html>Grammar Dojo</html>", "/grammar"), false)
  assert.equal(pageLooksLikeYasashi('<html data-route-shell="grammar"></html>', "/grammar"), true)
  assert.equal(pageLooksLikeYasashi("<html>learning-data-panel</html>", "/review"), false)
  assert.equal(pageLooksLikeYasashi("<html>learning-data-panel review-empty-state</html>", "/review"), true)
  assert.equal(pageLooksLikeYasashi("<html>Different local app</html>"), false)
})

test("E2E app health declares expected not-found routes", () => {
  assert.deepEqual(appNotFoundRoutes, [
    "/learn/__missing__",
    "/semantics/__missing__",
    "/pragmatics/__missing__",
  ])
})

test("E2E app health checks every candidate route before reusing a server", async () => {
  const seen = []
  const fetchImpl = async (url) => {
    seen.push(url)
    if (url.endsWith("/kana")) return fakeResponse(404, "not found")
    if (url.endsWith("/quiz")) return fakeResponse(200, '<div data-route-shell="quiz"></div>')
    return fakeResponse(200, "home-start-learning")
  }

  assert.equal(await routeLooksHealthy("http://local.test", "/", fetchImpl), true)
  assert.equal(await routeLooksHealthy("http://local.test", "/quiz", fetchImpl), true)
  assert.equal(await routeLooksHealthy("http://local.test", "/kana", fetchImpl), false)
  assert.equal(await canServeRoutes("http://local.test", ["/", "/kana", "/quiz"], fetchImpl), false)
  assert.deepEqual(seen, [
    "http://local.test/",
    "http://local.test/quiz",
    "http://local.test/kana",
    "http://local.test/",
    "http://local.test/kana",
  ])
})

test("E2E app health treats unreachable candidates as unavailable", async () => {
  assert.equal(await canReach("http://local.test", async () => fakeResponse(200)), true)
  assert.equal(await canReach("http://local.test", async () => fakeResponse(500)), false)
  assert.equal(
    await canReach("http://local.test", async () => {
      throw new Error("offline")
    }),
    false
  )
})

test("E2E harness can choose a fallback port when the preferred port is occupied", async () => {
  const { server, occupiedPort, fallbackPort } = await createOccupiedPortWithBindableFallback()

  try {
    assert.equal(await findAvailablePort(occupiedPort, { maxAttempts: 2 }), fallbackPort)
  } finally {
    await close(server)
  }
})
