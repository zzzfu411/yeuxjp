export const SOKUON_MINIMAL_PAIRS = [
  { plain: "きて", special: "きって" },
  { plain: "かた", special: "かった" },
  { plain: "いて", special: "いって" },
  { plain: "さか", special: "さっか" },
  { plain: "もと", special: "もっと" },
  { plain: "いた", special: "いった" },
  { plain: "きた", special: "きった" },
  { plain: "かこ", special: "かっこ" },
  { plain: "ぶか", special: "ぶっか" },
  { plain: "おと", special: "おっと" },
  { plain: "さき", special: "さっき" },
  { plain: "はか", special: "はっか" },
] as const

export const LONG_VOWEL_MINIMAL_PAIRS = [
  { plain: "おばさん", special: "おばあさん" },
  { plain: "おじさん", special: "おじいさん" },
  { plain: "ゆき", special: "ゆうき" },
  { plain: "ビル", special: "ビール" },
  { plain: "くろ", special: "くろう" },
  { plain: "とり", special: "とおり" },
  { plain: "すじ", special: "すうじ" },
  { plain: "いえ", special: "いいえ" },
  { plain: "おい", special: "おおい" },
  { plain: "めし", special: "めいし" },
  { plain: "へや", special: "へいや" },
  { plain: "くき", special: "くうき" },
] as const

import { PARTICLE_QUESTIONS as PARTICLE_QUESTIONS_CORE } from "@/lib/quiz-particle-questions"
import { PARTICLE_QUESTIONS_EXTRA } from "@/lib/quiz-particle-questions-extra"

export const PARTICLE_QUESTIONS = [...PARTICLE_QUESTIONS_CORE, ...PARTICLE_QUESTIONS_EXTRA] as const
