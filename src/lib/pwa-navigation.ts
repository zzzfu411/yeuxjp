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

export type PwaDocumentNavigationRuntime = {
  isOnline: boolean
  hasServiceWorkerController: boolean
}

function shouldPromoteToDocumentNavigation({
  isOnline,
  hasServiceWorkerController,
}: PwaDocumentNavigationRuntime) {
  return !isOnline || hasServiceWorkerController
}

export function isSameOriginDocumentNavigation({
  href,
  currentLocation,
}: {
  href: string | null
  currentLocation: CurrentLocationLike
}) {
  if (!href || href.startsWith("#")) return false

  const url = new URL(href, currentLocation.href)
  if (url.origin !== currentLocation.origin) return false
  if (url.pathname === currentLocation.pathname && url.search === currentLocation.search && url.hash) return false

  return true
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

  return isSameOriginDocumentNavigation({
    href: anchor.absoluteHref,
    currentLocation,
  })
}

export function shouldUsePwaDocumentNavigation({
  event,
  anchor,
  currentLocation,
  isOnline,
  hasServiceWorkerController,
}: {
  event: OfflineNavigationEventLike
  anchor: OfflineNavigationCandidate | null
  currentLocation: CurrentLocationLike
} & PwaDocumentNavigationRuntime) {
  if (!shouldPromoteToDocumentNavigation({ isOnline, hasServiceWorkerController })) return false

  return shouldUseDocumentNavigationOffline({
    event,
    anchor,
    currentLocation,
  })
}

export function shouldUsePwaDocumentNavigationForHref({
  href,
  currentLocation,
  isOnline,
  hasServiceWorkerController,
}: {
  href: string
  currentLocation: CurrentLocationLike
} & PwaDocumentNavigationRuntime) {
  if (!shouldPromoteToDocumentNavigation({ isOnline, hasServiceWorkerController })) return false

  return isSameOriginDocumentNavigation({
    href,
    currentLocation,
  })
}
