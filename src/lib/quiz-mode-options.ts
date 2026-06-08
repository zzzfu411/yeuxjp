import type { QuizMode } from "@/lib/quiz-types"

export type QuizModeIcon = "type" | "ear" | "refresh" | "volume" | "languages"

export type QuizModeOption = {
  mode: QuizMode
  title: string
  description: string
  icon: QuizModeIcon
  testId: `quiz-mode-${QuizMode}`
}

export const QUIZ_MODE_OPTIONS = [
  {
    mode: "hiragana-romaji",
    title: "基础假名",
    description: "看假名，选罗马音",
    icon: "type",
    testId: "quiz-mode-hiragana-romaji",
  },
  {
    mode: "audio-kana",
    title: "听音辨字",
    description: "听发音，选假名",
    icon: "ear",
    testId: "quiz-mode-audio-kana",
  },
  {
    mode: "particle",
    title: "助词道场",
    description: "填空选择助词",
    icon: "type",
    testId: "quiz-mode-particle",
  },
  {
    mode: "verb-conjugation",
    title: "动词活用",
    description: "ます/ない/て形选择题",
    icon: "refresh",
    testId: "quiz-mode-verb-conjugation",
  },
  {
    mode: "audio-sokuon",
    title: "促音听辨",
    description: "区分有没有小っ",
    icon: "volume",
    testId: "quiz-mode-audio-sokuon",
  },
  {
    mode: "audio-longvowel",
    title: "长音听辨",
    description: "区分长音/短音",
    icon: "volume",
    testId: "quiz-mode-audio-longvowel",
  },
  {
    mode: "meaning-vocab",
    title: "单词释义",
    description: "看单词，选意思",
    icon: "languages",
    testId: "quiz-mode-meaning-vocab",
  },
] as const satisfies readonly QuizModeOption[]
