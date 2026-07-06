interface ReferenceRouteItem {
  id: string
}

export function getReferenceIndex<T extends ReferenceRouteItem>(
  items: readonly T[],
  itemId: string | undefined
) {
  if (!itemId) return null
  const index = items.findIndex((item) => item.id === itemId)
  return index >= 0 ? index : null
}

export function makeReferenceItemHref(basePath: string, itemId: string) {
  return `${basePath}/${encodeURIComponent(itemId)}`
}

export function getReferenceNavigation<T extends ReferenceRouteItem>(
  items: readonly T[],
  basePath: string,
  selectedIndex: number | null
) {
  if (selectedIndex === null || items.length === 0) {
    return {
      selectedItem: null as T | null,
      prevHref: basePath,
      nextHref: basePath,
    }
  }

  const previousIndex = (selectedIndex - 1 + items.length) % items.length
  const nextIndex = (selectedIndex + 1) % items.length

  return {
    selectedItem: items[selectedIndex],
    prevHref: makeReferenceItemHref(basePath, items[previousIndex].id),
    nextHref: makeReferenceItemHref(basePath, items[nextIndex].id),
  }
}
