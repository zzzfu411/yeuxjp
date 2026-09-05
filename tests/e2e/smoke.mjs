import assert from "node:assert/strict"
import {
  appHealthRoutes,
  appNotFoundRoutes,
  pageLooksLikeYasashi,
} from "./app-health.mjs"
import { createServerController, startBuiltProductionServer } from "./harness.mjs"
import { verifyReleaseSurfaces } from "../../scripts/verify-release-surfaces.mjs"

const port = Number(process.env.E2E_PORT ?? 3210)
let baseUrl = `http://127.0.0.1:${port}`
const routes = appHealthRoutes
const serverController = createServerController()

let failure = null

try {
  baseUrl = await startBuiltProductionServer({
    port,
    controller: serverController,
    label: "HTTP production smoke",
  })

  for (const route of routes) {
    const response = await fetch(`${baseUrl}${route}`)
    assert.equal(response.status, 200, `${route} should return 200`)
    const html = await response.text()
    assert.equal(pageLooksLikeYasashi(html, route), true, `${route} should return the expected Yasashi page content`)
  }

  for (const route of appNotFoundRoutes) {
    const response = await fetch(`${baseUrl}${route}`)
    assert.equal(response.status, 404, `${route} should return 404`)
  }

  await verifyReleaseSurfaces(baseUrl, routes)
  const notFoundLabel = appNotFoundRoutes.length === 1 ? "404 route" : "404 routes"
  console.log(`HTTP smoke checks passed for ${routes.length} routes and ${appNotFoundRoutes.length} ${notFoundLabel} at ${baseUrl}`)
} catch (error) {
  console.error(serverController.output)
  failure = error
} finally {
  await serverController.stop()
}

if (failure) {
  console.error(failure)
  process.exit(1)
} else {
  process.exit(0)
}
