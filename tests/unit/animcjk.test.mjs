import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const animcjk = await loadTsModule("src/lib/animcjk.ts")

test("AnimCJK URLs normalize small kana to regular glyph SVGs", () => {
  assert.equal(animcjk.getAnimCjkKanaUrl("っ"), "/animcjk/kana/12388.svg")
  assert.deepEqual(animcjk.getAnimCjkKanaUrls("きゃ"), ["/animcjk/kana/12365.svg", "/animcjk/kana/12420.svg"])
})

test("parseAnimCJK groups subpaths with the same delay into one logical stroke", () => {
  const raw = `
    <svg class="acjk" viewBox="0 0 1024 1024">
      <style>path{animation:dash 1s}</style>
      <script>alert("x")</script>
      <path clip-path="url(#c1)" d="M 10,20 L 30,40" pathLength="100" style="--d:1s;" />
      <path clip-path="url(#c1b)" d="M -1,-1 L 0,0" pathLength="100" style="--d:1s;" />
      <path clip-path="url(#c2)" d="M 50,60 L 70,80" pathLength="200" style="--d:2s;" />
    </svg>
  `

  const parsed = animcjk.parseAnimCJK(raw)
  assert.equal(parsed.strokeCount, 2)
  assert.equal(parsed.viewBox, "0 0 1024 1024")
  assert.deepEqual(parsed.starts, [
    { index: 1, startX: 10, startY: 20 },
    { index: 2, startX: 50, startY: 60 },
  ])
  assert.match(parsed.html, /data-stroke-index="1"/)
  assert.doesNotMatch(parsed.html, /<script|<style/)
})

test("generateActiveStrokeCss exposes current and finished stroke states", () => {
  const css = animcjk.generateActiveStrokeCss(2, "scope")

  assert.match(css, /data-active-stroke="1"/)
  assert.match(css, /data-active-stroke="3"/)
  assert.match(css, /hsl\(var\(--primary\)\)/)
})
