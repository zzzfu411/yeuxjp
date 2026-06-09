import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const root = path.resolve(import.meta.dirname, "..", "..")

test("KanaStrokeAnimCJK delegates timeline math to animcjk helpers", () => {
  const source = fs.readFileSync(path.join(root, "src/components/kana/kana-stroke-animcjk.tsx"), "utf8")

  assert.match(source, /from "@\/components\/kana\/kana-stroke-controls"/)
  assert.match(source, /from "@\/components\/kana\/use-animcjk-svgs"/)
  assert.match(source, /useAnimCjkSvgs\(char\)/)
  assert.match(source, /<KanaStrokeControls\b/)
  assert.match(source, /activeStroke=\{activeStroke\}/)
  assert.match(source, /onTogglePause=\{handleTogglePause\}/)
  assert.match(source, /getAnimCjkTotalStrokes\(svgs\)/)
  assert.match(source, /getAnimCjkStrokeOffsets\(svgs\)/)
  assert.match(source, /getAnimCjkTimelineEvents\(\{ startFrom, totalStrokes, speed \}\)/)
  assert.match(source, /getAnimCjkPlaybackStartStroke\(\{ activeStroke, totalStrokes \}\)/)
  assert.match(source, /getAnimCjkLocalActiveStroke\(\{/)
  assert.match(source, /getNextAnimCjkSpeed\(cur\)/)
  assert.match(source, /getAnimCjkSpeedLabel\(speed\)/)
  assert.doesNotMatch(source, /const SPEEDS =/)
  assert.doesNotMatch(source, /Math\.max\(0, Math\.min\(svg\.strokeCount \+ 1, activeStroke - offset\)\)/)
  assert.doesNotMatch(source, /Math\.max\(1, activeStroke \+ 1\)/)
  assert.doesNotMatch(source, /const baseMs = 800 \* speed/)
  assert.doesNotMatch(source, /await fetch\(/)
  assert.doesNotMatch(source, /parseAnimCJK\(text\)/)
  assert.doesNotMatch(source, /<ControlBtn/)
  assert.doesNotMatch(source, /from "lucide-react"/)
})

test("useAnimCjkSvgs owns AnimCJK resource loading and stale-key guard", () => {
  const source = fs.readFileSync(path.join(root, "src/components/kana/use-animcjk-svgs.ts"), "utf8")

  assert.match(source, /export function useAnimCjkSvgs\(char: string\)/)
  assert.match(source, /Array\.from\(char\)/)
  assert.match(source, /getAnimCjkKanaUrl\(part\)/)
  assert.match(source, /await fetch\(url\)/)
  assert.match(source, /parseAnimCJK\(text\)/)
  assert.match(source, /cancelled = true/)
  assert.match(source, /parsed\?\.key === cacheKey \? parsed\.svgs \?\? null : null/)
  assert.match(source, /parsed\?\.key === cacheKey \? parsed\.error \?\? null : null/)
})

test("KanaStrokeControls owns playback control buttons and labels", () => {
  const source = fs.readFileSync(path.join(root, "src/components/kana/kana-stroke-controls.tsx"), "utf8")

  assert.match(source, /export function KanaStrokeControls/)
  assert.match(source, /from "lucide-react"/)
  assert.match(source, /<ControlBtn onClick=\{onPrev\}/)
  assert.match(source, /aria-label="上一笔"/)
  assert.match(source, /aria-label=\{isPaused \|\| isFinished \? "播放" : "暂停"\}/)
  assert.match(source, /<ControlBtn onClick=\{onNext\}/)
  assert.match(source, /aria-label="下一笔"/)
  assert.match(source, /<ControlBtn onClick=\{onReplay\}/)
  assert.match(source, /aria-label="重播"/)
  assert.match(source, /aria-label=\{`速度：\$\{speedLabel\}`\}/)
  assert.match(source, /\{Math\.min\(activeStroke, totalStrokes\)\} \/ \{totalStrokes\}/)
})
