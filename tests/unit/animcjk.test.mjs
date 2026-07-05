import assert from "node:assert/strict"
import test from "node:test"
import { loadTsModule } from "./load-ts-module.mjs"

const animcjk = await loadTsModule("src/lib/animcjk.ts")

test("AnimCJK URLs normalize small kana to regular glyph SVGs", () => {
  assert.equal(animcjk.getAnimCjkKanaUrl("ぁ"), "/animcjk/kana/12354.svg")
  assert.equal(animcjk.getAnimCjkKanaUrl("ォ"), "/animcjk/kana/12458.svg")
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

test("parseAnimCJK falls back when SVG numeric attributes are malformed", () => {
  const raw = `
    <svg class="acjk">
      <path clip-path="url(#c1)" d="M .,20 L 30,40" pathLength="." style="--d:1s;" />
      <path clip-path="url(#c2)" d="M 50,60 L 70,80" pathLength="0" style="--d:2s;" />
    </svg>
  `

  const parsed = animcjk.parseAnimCJK(raw)

  assert.equal(parsed.strokeCount, 2)
  assert.deepEqual(parsed.starts, [{ index: 2, startX: 50, startY: 60 }])
  assert.match(parsed.html, /--stroke-len:3333;--stroke-off:3335/)
})

test("AnimCJK sanitizer removes executable SVG surfaces while preserving local defs", () => {
  const raw = `
    <svg class="acjk" viewBox="0 0 1024 1024" onload="alert(1)">
      <script>alert("x")</script>
      <style>path{stroke:red}</style>
      <foreignObject><div onclick="alert(2)">x</div></foreignObject>
      <image href="https://example.com/pixel.png" />
      <path id="d1" onclick="alert(3)" d="M 10,20 L 30,40" />
      <defs><clipPath id="c1"><use href="#d1"/></clipPath></defs>
      <path style="--d:1s;" pathLength="100" clip-path="url(#c1)" d="M 10,20 L 30,40" href="javascript:alert(4)" />
    </svg>
  `

  const sanitized = animcjk.sanitizeAnimCjkSvg(raw)
  assert.doesNotMatch(sanitized, /<script|<style|foreignObject|<image/i)
  assert.doesNotMatch(sanitized, /onload|onclick|javascript:|https:\/\//i)
  assert.match(sanitized, /<use href="#d1"/)

  const parsed = animcjk.parseAnimCJK(raw)
  assert.equal(parsed.strokeCount, 1)
  assert.match(parsed.html, /data-stroke-index="1"/)
  assert.doesNotMatch(parsed.html, /onload|onclick|javascript:|https:\/\//i)
})

test("generateActiveStrokeCss exposes current and finished stroke states", () => {
  const css = animcjk.generateActiveStrokeCss(2, "scope")

  assert.match(css, /data-active-stroke="1"/)
  assert.match(css, /data-active-stroke="3"/)
  assert.match(css, /hsl\(var\(--primary\)\)/)
  assert.equal(animcjk.generateActiveStrokeCss(Number.POSITIVE_INFINITY, "scope"), "")
  assert.equal(animcjk.generateActiveStrokeCss(Number.NaN, "scope"), "")
})

test("AnimCJK timeline helpers map combo kana global strokes to local glyph states", () => {
  const svgs = [{ strokeCount: 3 }, { strokeCount: 2 }]

  assert.equal(animcjk.getAnimCjkTotalStrokes(svgs), 5)
  assert.deepEqual(animcjk.getAnimCjkStrokeOffsets(svgs), [0, 3])
  assert.equal(animcjk.getAnimCjkTotalStrokes([{ strokeCount: Number.NaN }, { strokeCount: Number.POSITIVE_INFINITY }, { strokeCount: 2 }]), 2)
  assert.deepEqual(animcjk.getAnimCjkStrokeOffsets([{ strokeCount: Number.NaN }, { strokeCount: 2 }]), [0, 0])

  assert.equal(animcjk.getAnimCjkLocalActiveStroke({ activeStroke: 0, strokeCount: 3, offset: 0 }), 0)
  assert.equal(animcjk.getAnimCjkLocalActiveStroke({ activeStroke: 3, strokeCount: 3, offset: 0 }), 3)
  assert.equal(animcjk.getAnimCjkLocalActiveStroke({ activeStroke: 4, strokeCount: 3, offset: 0 }), 4)
  assert.equal(animcjk.getAnimCjkLocalActiveStroke({ activeStroke: 4, strokeCount: 2, offset: 3 }), 1)
  assert.equal(animcjk.getAnimCjkLocalActiveStroke({ activeStroke: 6, strokeCount: 2, offset: 3 }), 3)
  assert.equal(animcjk.getAnimCjkLocalActiveStroke({ activeStroke: Number.NaN, strokeCount: 2, offset: Number.POSITIVE_INFINITY }), 0)
})

test("AnimCJK timeline helpers schedule draw and finished sentinel events", () => {
  assert.deepEqual(animcjk.getAnimCjkTimelineEvents({ startFrom: 1, totalStrokes: 3, speed: 1 }), [
    { stroke: 1, delayMs: 150 },
    { stroke: 2, delayMs: 950 },
    { stroke: 3, delayMs: 1750 },
    { stroke: 4, delayMs: 2550 },
  ])

  assert.deepEqual(animcjk.getAnimCjkTimelineEvents({ startFrom: 2, totalStrokes: 3, speed: 0.6 }), [
    { stroke: 2, delayMs: 0 },
    { stroke: 3, delayMs: 480 },
    { stroke: 4, delayMs: 960 },
  ])

  assert.deepEqual(animcjk.getAnimCjkTimelineEvents({ startFrom: 4, totalStrokes: 3, speed: 1 }), [])
  assert.deepEqual(animcjk.getAnimCjkTimelineEvents({ startFrom: Number.NaN, totalStrokes: 2, speed: Number.NaN }), [
    { stroke: 1, delayMs: 150 },
    { stroke: 2, delayMs: 950 },
    { stroke: 3, delayMs: 1750 },
  ])
  assert.deepEqual(animcjk.getAnimCjkTimelineEvents({ startFrom: 1, totalStrokes: Number.POSITIVE_INFINITY, speed: 1 }), [])
  assert.equal(animcjk.getNextAnimCjkSpeed(1.6), 1)
  assert.equal(animcjk.getNextAnimCjkSpeed(1), 0.6)
  assert.equal(animcjk.getNextAnimCjkSpeed(0.6), 1.6)
  assert.equal(animcjk.getAnimCjkSpeedLabel(0.6), "快")
})

test("AnimCJK playback start helper resumes from safe stroke positions", () => {
  assert.equal(animcjk.getAnimCjkPlaybackStartStroke({ activeStroke: 0, totalStrokes: 3 }), 1)
  assert.equal(animcjk.getAnimCjkPlaybackStartStroke({ activeStroke: 1, totalStrokes: 3 }), 2)
  assert.equal(animcjk.getAnimCjkPlaybackStartStroke({ activeStroke: 3, totalStrokes: 3 }), 3)
  assert.equal(animcjk.getAnimCjkPlaybackStartStroke({ activeStroke: 4, totalStrokes: 3 }), null)
  assert.equal(animcjk.getAnimCjkPlaybackStartStroke({ activeStroke: 0, totalStrokes: 0 }), null)
  assert.equal(animcjk.getAnimCjkPlaybackStartStroke({ activeStroke: Number.NaN, totalStrokes: 3 }), 1)
  assert.equal(animcjk.getAnimCjkPlaybackStartStroke({ activeStroke: 1, totalStrokes: Number.POSITIVE_INFINITY }), null)
})
