import assert from "node:assert/strict"
import net from "node:net"
import test from "node:test"
import {
  appHealthRoutes,
  appNotFoundRoutes,
  canReach,
  canServeRoutes,
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
  assert.equal(pageLooksLikeYasashi("<html>Yasashi Japanese</html>"), true)
  assert.equal(pageLooksLikeYasashi("<html><body><div id=\"__next\"></div></body></html>"), true)
  assert.equal(pageLooksLikeYasashi("<html>Different local app</html>"), false)
})

test("E2E app health declares expected not-found routes", () => {
  assert.deepEqual(appNotFoundRoutes, [
    "/learn/__missing__",
  ])
})

test("E2E app health checks every candidate route before reusing a server", async () => {
  const seen = []
  const fetchImpl = async (url) => {
    seen.push(url)
    if (url.endsWith("/kana")) return fakeResponse(404, "not found")
    return fakeResponse(200, "Yasashi")
  }

  assert.equal(await routeLooksHealthy("http://local.test", "/", fetchImpl), true)
  assert.equal(await routeLooksHealthy("http://local.test", "/kana", fetchImpl), false)
  assert.equal(await canServeRoutes("http://local.test", ["/", "/kana", "/quiz"], fetchImpl), false)
  assert.deepEqual(seen, [
    "http://local.test/",
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
  const server = net.createServer()
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve))
  const occupiedPort = server.address().port

  try {
    const availablePort = await findAvailablePort(occupiedPort, { maxAttempts: 5 })
    assert.notEqual(availablePort, occupiedPort)
    assert.equal(Number.isInteger(availablePort), true)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
})
