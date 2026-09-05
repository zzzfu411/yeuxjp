import assert from "node:assert/strict"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

export async function verifyAccessibility(browser, baseUrl) {
  const { AxeBuilder } = await import("@axe-core/playwright")
  const results = []
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: theme, serviceWorkers: "block" })
    const page = await context.newPage()
    try {
      const cases = ["/", "/path", "/kana", "/vocabulary", "/grammar", "/semantics", "/pragmatics", "/quiz", "/review", "/settings", "/learn/day-1-a-row-hello",
        "/vocabulary?level=survival&item=sur-g-1", "/grammar?level=N5&item=n5-wa", "/kana?item=hiragana%3Aa"]
      for (const route of cases) {
        await page.goto(baseUrl + route, { waitUntil: "networkidle" })
        if (route.includes("?")) await page.getByRole("dialog").waitFor()
        const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
        results.push({ theme, route, violations: result.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description,
          nodes: v.nodes.map(n => ({ target: n.target, html: n.html, failureSummary: n.failureSummary })) })),
          incomplete: result.incomplete.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })) })
      }
      for (const control of ["学习设置", "打开导航菜单"]) {
        await page.goto(baseUrl, { waitUntil: "networkidle" })
        await page.getByRole("button", { name: control, exact: true }).click()
        await page.getByRole("dialog").waitFor()
        await page.waitForFunction(() => {
          const layer = document.querySelector("[data-modal-layer]")
          return layer && layer.getAnimations({ subtree: true }).every(animation => animation.playState === "finished")
        })
        const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
        results.push({ theme, route: `/#${control}`, violations: result.violations.map(v => ({ id: v.id, impact: v.impact, description: v.description,
          nodes: v.nodes.map(n => ({ target: n.target, html: n.html, failureSummary: n.failureSummary })) })),
          incomplete: result.incomplete.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })) })
      }
    } finally { await context.close() }
  }
  const out = process.env.UI_EVIDENCE_DIR ?? "output/playwright/maturity-20260905"
  fs.mkdirSync(out, { recursive: true })
  fs.writeFileSync(`${out}/accessibility.json`, JSON.stringify(results, null, 2))
  const failures = results.filter(result => result.violations.length).map(result => ({ theme: result.theme, route: result.route,
    violations: result.violations.map(v => `${v.id}: ${v.nodes.length}`) }))
  assert.deepEqual(failures, [], "WCAG automatic checks must pass; review the accessibility evidence for affected elements")
  console.log(`Accessibility validation passed for ${results.length} light/dark page and dialog states`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { chromium } = await import("playwright")
  const browser = await chromium.launch({ headless: true })
  try { await verifyAccessibility(browser, process.env.E2E_BASE_URL ?? "http://127.0.0.1:3217") }
  finally { await browser.close() }
}
