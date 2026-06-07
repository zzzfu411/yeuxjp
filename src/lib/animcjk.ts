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
