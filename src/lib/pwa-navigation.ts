export type OfflineNavigationCandidate = {
  href: string | null
  absoluteHref: string
  origin: string
  pathname: string
  search: string
  hash: string
  target: string
  hasDownload: boolean
}

export type OfflineNavigationEventLike = {
  defaultPrevented: boolean
  button: number
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
}

export type CurrentLocationLike = {
  href: string
  origin: string
  pathname: string
  search: string
}

export function shouldUseDocumentNavigationOffline({
  event,
  anchor,
  currentLocation,
}: {
  event: OfflineNavigationEventLike
  anchor: OfflineNavigationCandidate | null
  currentLocation: CurrentLocationLike
}) {
  if (event.defaultPrevented) return false
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  if (!anchor) return false
  if (anchor.hasDownload) return false
  if (anchor.target && anchor.target !== "_self") return false
  if (!anchor.href || anchor.href.startsWith("#")) return false

  const url = new URL(anchor.absoluteHref, currentLocation.href)
  if (url.origin !== currentLocation.origin) return false
  if (url.pathname === currentLocation.pathname && url.search === currentLocation.search && url.hash) return false

  return true
}
