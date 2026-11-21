import assert from "node:assert/strict"
import fs from "node:fs"
import { chromium } from "playwright"
import { AxeBuilder } from "@axe-core/playwright"

const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3218"
const out = "output/playwright/original-corridor-20260909"
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []
try {
  for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ colorScheme: theme, reducedMotion: "reduce", serviceWorkers: "block" })
    const page = await context.newPage()
    const errors = []
    page.on("pageerror", e => errors.push(String(e)))
    try {
      for (const width of [320, 390, 768, 1440]) {
        await page.setViewportSize({ width, height: 960 })
        await page.goto(base, { waitUntil: "networkidle" })
        await page.locator(".corridor-illustration").evaluate(img => img.decode())
        const layout = await page.evaluate(() => {
          const title = document.querySelector("#home-cover-title").getBoundingClientRect()
          const nav = document.querySelector(".paper-nav").getBoundingClientRect()
          const artwork = document.querySelector(".corridor-illustration")
          const runner = artwork.getBoundingClientRect()
          const cta = document.querySelector('[data-testid="home-start-learning"]').getBoundingClientRect()
          return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
            titleTop: title.top, navBottom: nav.bottom, runnerWidth: runner.width,
            ctaWidth: cta.width, ctaHeight: cta.height,
            imageRatio: runner.width / runner.height,
            naturalRatio: artwork.naturalWidth / artwork.naturalHeight,
            svgCount: document.querySelectorAll(".corridor-world svg").length,
            reducedAnimation: getComputedStyle(artwork).animationName }
        })
        assert.ok(layout.scrollWidth <= width + 1, `${theme}/${width} overflow`)
        assert.ok(layout.titleTop >= layout.navBottom, `${theme}/${width} title covered`)
        assert.ok(layout.ctaWidth >= 44 && layout.ctaHeight >= 44)
        assert.equal(layout.reducedAnimation, "none")
        assert.ok(Math.abs(layout.imageRatio - layout.naturalRatio) < 0.01, "complete image keeps its aspect ratio")
        assert.equal(layout.svgCount, 0)
        await page.screenshot({ path: `${out}/${theme}-${width}.png`, fullPage: true })
        if (width === 390 || width === 1440) {
          const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()
          assert.deepEqual(axe.violations.map(v => v.id), [], `${theme}/${width} accessibility`)
        }
        results.push({ theme, ...layout })
      }
      await page.getByTestId("home-start-learning").click()
      await page.getByRole("region", { name: "课程内容" }).waitFor()
      assert.ok(page.url().includes("/learn/"))
      assert.deepEqual(errors, [])
    } finally { await context.close() }
  }
} finally {
  fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2))
  await browser.close()
}
console.log(`Word corridor passed: ${results.length} responsive/theme views, reduced motion, accessibility and course entry.`)
