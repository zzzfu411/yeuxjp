export interface AnimCjkBasePath {
  id: string
  d: string
}

export interface AnimCjkClipPath {
  id: string
  href: string
}

export interface AnimCjkStrokePath {
  index: number
  clipPathId: string
  d: string
  length: number
}

export interface AnimCjkGeometry {
  basePaths: AnimCjkBasePath[]
  clipPaths: AnimCjkClipPath[]
  strokes: AnimCjkStrokePath[]
}

function positiveLength(value: string | undefined, fallback: number) {
  const parsed = value ? Number(value) : Number.NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function extractAnimCjkGeometry(sanitizedSvg: string): AnimCjkGeometry {
  const basePaths: AnimCjkBasePath[] = []
  const basePathRe = /<path\b([^>]*?)\bid="([^"]+)"([^>]*)\/?>/gi
  let match: RegExpExecArray | null
  while ((match = basePathRe.exec(sanitizedSvg)) !== null) {
    const attrs = `${match[1]} ${match[3]}`
    if (/\bclip-path=/i.test(attrs)) continue
    const dMatch = attrs.match(/\bd="([^"]+)"/)
    if (dMatch?.[1]) {
      basePaths.push({ id: match[2], d: dMatch[1] })
    }
  }

  const clipPaths: AnimCjkClipPath[] = []
  const clipRe = /<clipPath\b[^>]*\bid="([^"]+)"[^>]*>[\s\S]*?<use\b[^>]*\b(?:xlink:)?href="#([^"]+)"[^>]*\/?>[\s\S]*?<\/clipPath>/gi
  while ((match = clipRe.exec(sanitizedSvg)) !== null) {
    clipPaths.push({ id: match[1], href: match[2] })
  }

  const strokes: AnimCjkStrokePath[] = []
  const strokeRe = /<path\b([^>]*?)\bclip-path="url\(#([^)]+)\)"([^>]*)\/?>/gi
  const groupByDelay = new Map<string, number>()
  let unnamed = 0
  while ((match = strokeRe.exec(sanitizedSvg)) !== null) {
    const attrs = `${match[1]} ${match[3]}`
    const dMatch = attrs.match(/\bd="([^"]+)"/)
    if (!dMatch?.[1]) continue
    const delayMatch = attrs.match(/--d\s*:\s*([0-9.]+)s/i)
    const key = delayMatch ? `d:${delayMatch[1]}` : `u:${unnamed++}`
    let index = groupByDelay.get(key)
    if (index === undefined) {
      index = groupByDelay.size + 1
      groupByDelay.set(key, index)
    }
    const lenMatch = attrs.match(/\bpathLength="([0-9.]+)"/i)
    strokes.push({
      index,
      clipPathId: match[2],
      d: dMatch[1],
      length: positiveLength(lenMatch?.[1], 3333),
    })
  }

  return { basePaths, clipPaths, strokes }
}
