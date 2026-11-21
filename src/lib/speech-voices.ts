function isSpeechApiAvailable() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined"
  )
}

function isJapaneseVoiceEntry(voice: SpeechSynthesisVoice | null | undefined) {
  return typeof voice?.lang === "string" && (/^ja(?:-|_)/i.test(voice.lang) || voice.lang.toLowerCase() === "ja")
}

let voicesListenerBound = false
let cachedVoices: SpeechSynthesisVoice[] = []

export function readCurrentJapaneseVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechApiAvailable()) return []
  const synth = window.speechSynthesis
  if (!voicesListenerBound && typeof synth.addEventListener === "function") {
    voicesListenerBound = true
    synth.addEventListener("voiceschanged", () => {
      try {
        cachedVoices = synth.getVoices?.() ?? []
      } catch {
        // Ignore restricted synthesis voice reads.
      }
    })
  }
  try {
    const live = synth.getVoices?.() ?? []
    if (live.length > 0) cachedVoices = live
    return live.length > 0 ? live : cachedVoices
  } catch {
    return cachedVoices
  }
}

export function hasJapaneseVoice(): boolean {
  return readCurrentJapaneseVoices().some(isJapaneseVoiceEntry)
}

export function ensureJapaneseVoicesReady(timeoutMs = 1500): Promise<boolean> {
  if (!isSpeechApiAvailable()) return Promise.resolve(false)
  if (hasJapaneseVoice()) return Promise.resolve(true)
  const synth = window.speechSynthesis
  if (typeof synth.addEventListener !== "function") {
    return Promise.resolve(hasJapaneseVoice())
  }
  return new Promise((resolve) => {
    let settled = false
    const finish = (ready: boolean) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      synth.removeEventListener("voiceschanged", check)
      resolve(ready)
    }
    const check = () => {
      if (hasJapaneseVoice()) finish(true)
    }
    const timer = window.setTimeout(() => finish(hasJapaneseVoice()), timeoutMs)
    synth.addEventListener("voiceschanged", check)
    check()
  })
}
