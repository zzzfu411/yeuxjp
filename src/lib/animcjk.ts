export const SMALL_KANA_MAP: Record<string, string> = {
  "ぁ": "あ",
  "ぃ": "い",
  "ぅ": "う",
  "ぇ": "え",
  "ぉ": "お",
  "っ": "つ",
  "ゃ": "や",
  "ゅ": "ゆ",
  "ょ": "よ",
  "ァ": "ア",
  "ィ": "イ",
  "ゥ": "ウ",
  "ェ": "エ",
  "ォ": "オ",
  "ッ": "ツ",
  "ャ": "ヤ",
  "ュ": "ユ",
  "ョ": "ヨ",
}

export interface ParsedStroke {
  startX: number
  startY: number
  index: number
}

interface ParsedPathStroke {
  index: number
  length: number
  startX?: number
  startY?: number
  isFirstInGroup: boolean
}

export interface ParsedAnimCjkSvg {
  html: string
  strokeCount: number
  starts: ParsedStroke[]
  viewBox: string
}

export const ANIMCJK_SPEEDS = [
  { label: "慢", value: 1.6 },
  { label: "正常", value: 1 },
  { label: "快", value: 0.6 },
] as const

export type AnimCjkSpeedValue = (typeof ANIMCJK_SPEEDS)[number]["value"]

export function normalizeKanaChar(char: string) {
  return SMALL_KANA_MAP[char] ?? char
}

export function getAnimCjkKanaUrl(char: string) {
  const normalized = normalizeKanaChar(char)
  const codePoint = normalized.codePointAt(0)
  return codePoint == null ? null : `/animcjk/kana/${codePoint}.svg`
}

export function getAnimCjkKanaUrls(text: string) {
  const urls: string[] = []
  for (const char of Array.from(text)) {
    const url = getAnimCjkKanaUrl(char)
    if (url) urls.push(url)
  }
  return urls
}

export function parseAnimCJK(rawSvg: string): ParsedAnimCjkSvg {
  let svg = rawSvg.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
  svg = svg.replace(/<style[\s\S]*?<\/style>/gi, "")

  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/)
  const viewBox = viewBoxMatch?.[1] ?? "0 0 1024 1024"

  const pathRegex = /<path\b([^>]*?)\bclip-path="([^"]+)"([^>]*)>/gi
  const groupByDelay = new Map<string, number>()
  const perPathStroke: ParsedPathStroke[] = []
  let unnamedBucket = 0
  let match: RegExpExecArray | null

  while ((match = pathRegex.exec(svg)) !== null) {
    const attrs = `${match[1]} ${match[3]}`
    const delayMatch = attrs.match(/--d\s*:\s*([0-9.]+)s/i)
    const key = delayMatch ? `d:${delayMatch[1]}` : `u:${unnamedBucket++}`
    const lengthMatch = attrs.match(/\bpathLength="([0-9.]+)"/i)
    const strokeLength = lengthMatch ? Number(lengthMatch[1]) : 3333

    let strokeIdx = groupByDelay.get(key)
    const isFirstInGroup = strokeIdx === undefined
    if (isFirstInGroup) {
      strokeIdx = groupByDelay.size + 1
      groupByDelay.set(key, strokeIdx)
    }

    let startX: number | undefined
    let startY: number | undefined
    if (isFirstInGroup) {
      const dMatch = attrs.match(/\bd="([^"]+)"/)
      const moveTo = dMatch?.[1].match(/M\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/i)
      if (moveTo) {
        startX = parseFloat(moveTo[1])
        startY = parseFloat(moveTo[2])
      }
    }

    perPathStroke.push({ index: strokeIdx!, length: strokeLength, startX, startY, isFirstInGroup })
  }

  const totalStrokes = groupByDelay.size
  let pathCursor = 0
  svg = svg.replace(/<path\b([^>]*?)\bclip-path="([^"]+)"([^>]*)>/gi, (_match, before, clip, after) => {
    const info = perPathStroke[pathCursor++]
    const cleaned = `${before} ${after}`
      .replace(/\bstyle="[^"]*"/gi, "")
      .replace(/\s*\/\s*$/g, "")
      .replace(/\s+/g, " ")
      .trim()
    return `<path ${cleaned} clip-path="${clip}" data-stroke-index="${info.index}" style="--stroke-len:${info.length};--stroke-off:${info.length + 2};">`
  })

  const starts: ParsedStroke[] = []
  for (const stroke of perPathStroke) {
    if (stroke.isFirstInGroup && stroke.startX !== undefined && stroke.startY !== undefined) {
      starts.push({ index: stroke.index, startX: stroke.startX, startY: stroke.startY })
    }
  }

  return { html: svg, strokeCount: totalStrokes, starts, viewBox }
}

export function generateActiveStrokeCss(strokeCount: number, scopeId: string): string {
  if (strokeCount <= 0) return ""

  const rules: string[] = []
  const selector = (active: number, stroke: number) =>
    `.kana-glyph-svg[data-stroke-scope="${scopeId}"][data-active-stroke="${active}"] svg.acjk path[data-stroke-index="${stroke}"]`

  for (let active = 1; active <= strokeCount; active++) {
    if (active > 1) {
      const finished = Array.from({ length: active - 1 }, (_, i) => selector(active, i + 1)).join(",")
      rules.push(`${finished}{stroke-dashoffset:0;stroke:hsl(var(--foreground));}`)
    }
    rules.push(`${selector(active, active)}{stroke-dashoffset:0;stroke:hsl(var(--primary));}`)
  }

  const allDone = Array.from({ length: strokeCount }, (_, i) => selector(strokeCount + 1, i + 1)).join(",")
  rules.push(`${allDone}{stroke-dashoffset:0;stroke:hsl(var(--foreground));}`)
  return rules.join("\n")
}

export function getAnimCjkTotalStrokes(svgs: Pick<ParsedAnimCjkSvg, "strokeCount">[]) {
  return svgs.reduce((total, svg) => total + svg.strokeCount, 0)
}

export function getAnimCjkStrokeOffsets(svgs: Pick<ParsedAnimCjkSvg, "strokeCount">[]) {
  const offsets: number[] = []
  let total = 0
  for (const svg of svgs) {
    offsets.push(total)
    total += svg.strokeCount
  }
  return offsets
}

export function getAnimCjkLocalActiveStroke({
  activeStroke,
  strokeCount,
  offset,
}: {
  activeStroke: number
  strokeCount: number
  offset: number
}) {
  return Math.max(0, Math.min(strokeCount + 1, activeStroke - offset))
}

export function getAnimCjkTimelineEvents({
  startFrom,
  totalStrokes,
  speed,
}: {
  startFrom: number
  totalStrokes: number
  speed: AnimCjkSpeedValue
}) {
  if (totalStrokes <= 0 || startFrom > totalStrokes) return []

  const baseMs = 800 * speed
  const initialDelay = startFrom === 1 ? 150 : 0
  const events: Array<{ stroke: number; delayMs: number }> = []

  for (let stroke = startFrom; stroke <= totalStrokes; stroke++) {
    events.push({
      stroke,
      delayMs: initialDelay + (stroke - startFrom) * baseMs,
    })
  }

  events.push({
    stroke: totalStrokes + 1,
    delayMs: initialDelay + (totalStrokes - startFrom + 1) * baseMs,
  })

  return events
}

export function getNextAnimCjkSpeed(current: AnimCjkSpeedValue) {
  const index = ANIMCJK_SPEEDS.findIndex((speed) => speed.value === current)
  return ANIMCJK_SPEEDS[(index + 1) % ANIMCJK_SPEEDS.length].value
}

export function getAnimCjkSpeedLabel(current: AnimCjkSpeedValue) {
  return ANIMCJK_SPEEDS.find((speed) => speed.value === current)?.label ?? "正常"
}
