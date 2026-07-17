"use client"

import { warnInDevelopment } from "@/lib/dev-log"

export type JsonStorageReadStatus = "valid" | "missing" | "invalid" | "unavailable"

export type JsonStorageReadResult<T> = {
  ok: boolean
  status: JsonStorageReadStatus
  value: T
  raw: string | null
}

export type JsonStorageDecodeResult<T> =
  | { ok: true; value: T }
  | { ok: false }

export type JsonStorageWriteOptions = {
  replaceInvalid?: boolean
  expectedRaw?: string | null
}

export function validJsonStorageValue<T>(value: T): JsonStorageDecodeResult<T> {
  return { ok: true, value }
}

export function invalidJsonStorageValue<T>(): JsonStorageDecodeResult<T> {
  return { ok: false }
}

export function canWriteJsonStorage<T>(
  current: JsonStorageReadResult<T>,
  options: JsonStorageWriteOptions = {}
) {
  if (!options.replaceInvalid && !current.ok) return false
  if (Object.prototype.hasOwnProperty.call(options, "expectedRaw") && current.raw !== options.expectedRaw) {
    return false
  }
  return true
}

export function readJsonStorage<T>(
  storageKey: string,
  fallback: T,
  decode: (input: unknown) => JsonStorageDecodeResult<T>,
  label: string
): JsonStorageReadResult<T> {
  if (typeof window === "undefined") {
    return { ok: false, status: "unavailable", value: fallback, raw: null }
  }

  let raw: string | null
  try {
    raw = window.localStorage.getItem(storageKey)
  } catch (error) {
    warnInDevelopment(`[${label}] Failed to read ${storageKey}:`, error)
    return { ok: false, status: "unavailable", value: fallback, raw: null }
  }

  if (raw === null) {
    return { ok: true, status: "missing", value: fallback, raw }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch (error) {
    warnInDevelopment(`[${label}] Invalid JSON in ${storageKey}:`, error)
    return { ok: false, status: "invalid", value: fallback, raw }
  }

  const decoded = decode(parsed)
  if (!decoded.ok) {
    warnInDevelopment(`[${label}] Invalid value in ${storageKey}`)
    return { ok: false, status: "invalid", value: fallback, raw }
  }

  return { ok: true, status: "valid", value: decoded.value, raw }
}
