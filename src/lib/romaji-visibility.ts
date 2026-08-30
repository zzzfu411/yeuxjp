import type { RomajiMode } from "@/lib/learning-progress-model"

export function defaultShowRomaji(mode: RomajiMode | null | undefined) {
  return mode !== "hidden"
}

export function defaultShowStudyRomaji(mode: RomajiMode | null | undefined) {
  if (mode === "hidden" || mode === "practice") return false
  return true
}

export function nextRomajiVisibility(
  current: boolean | null | undefined,
  mode: RomajiMode | null | undefined,
  defaultFn: (value: RomajiMode | null | undefined) => boolean = defaultShowRomaji
) {
  return !(current ?? defaultFn(mode))
}
