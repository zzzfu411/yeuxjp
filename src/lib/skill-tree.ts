export type SkillCategory = "foundation" | "sound" | "sentence" | "verbs" | "vocab" | "nuance"

export type SkillId =
  | "kana-seion"
  | "kana-dakuon"
  | "kana-yoon"
  | "kana-sokuon"
  | "listen-kana"
  | "listen-sokuon"
  | "listen-chouon"
  | "particles-basic"
  | "verbs-conjugation"
  | "vocab-survival"
  | "grammar-n5"
  | "pragmatics"
  | "semantics"

export interface SkillNode {
  id: SkillId
  category: SkillCategory
  title: string
  short: string
  href: string
  prerequisites?: SkillId[]
  glossary?: string[]
}

export const SKILL_CATEGORY_LABEL: Record<SkillCategory, string> = {
  foundation: "基础：文字与读音",
  sound: "听辨：节奏与对比",
  sentence: "句子骨架：助词",
  verbs: "动词系统：活用",
  vocab: "词汇：可用表达",
  nuance: "语感：语用与语义",
}

export const SKILL_TREE: SkillNode[] = [
  {
    id: "kana-seion",
    category: "foundation",
    title: "清音（五十音基础）",
    short: "先把不带「゛/゜」的基础音读写熟。",
    href: "/kana?set=seion",
    glossary: ["seion", "gojuon", "kana"],
  },
  {
    id: "kana-dakuon",
    category: "foundation",
    title: "浊音 / 半浊音",
    short: "掌握「゛/゜」带来的发音变化：か→が、は→ぱ。",
    href: "/kana?set=dakuon",
    prerequisites: ["kana-seion"],
    glossary: ["dakuon", "handakuon"],
  },
  {
    id: "kana-yoon",
    category: "foundation",
    title: "拗音（きゃ/しゅ/ちょ）",
    short: "学习「い段 + 小ゃ/ゅ/ょ」的收缩音。",
    href: "/kana?set=yoon",
    prerequisites: ["kana-seion"],
    glossary: ["yoon"],
  },
  {
    id: "kana-sokuon",
    category: "foundation",
    title: "促音（っ / ッ）",
    short: "小「っ」不单独发音，表示后续子音加倍。",
    href: "/kana?set=special",
    prerequisites: ["kana-seion"],
    glossary: ["sokuon"],
  },

  {
    id: "listen-kana",
    category: "sound",
    title: "听音辨字（假名）",
    short: "把“看得懂”升级为“听得出”。",
    href: "/quiz?mode=audio-kana",
    prerequisites: ["kana-seion"],
    glossary: ["kana"],
  },
  {
    id: "listen-sokuon",
    category: "sound",
    title: "促音听辨（有无 っ）",
    short: "练节奏感：有没有“促住/停顿”。",
    href: "/quiz?mode=audio-sokuon",
    prerequisites: ["kana-sokuon"],
    glossary: ["sokuon"],
  },
  {
    id: "listen-chouon",
    category: "sound",
    title: "长音听辨（长/短）",
    short: "练元音长度对比：ビル/ビール。",
    href: "/quiz?mode=audio-longvowel",
    prerequisites: ["kana-seion"],
    glossary: ["chouon"],
  },

  {
    id: "particles-basic",
    category: "sentence",
    title: "助词道场（は/が/を/に/で/と）",
    short: "掌握“句子骨架”：谁/什么、在哪里、做什么。",
    href: "/quiz?mode=particle",
    prerequisites: ["kana-seion"],
    glossary: ["particle"],
  },
  {
    id: "grammar-n5",
    category: "sentence",
    title: "N5 核心语法（最常用句型）",
    short: "把助词放到句型里理解：です/ます/て形等。",
    href: "/grammar?level=N5",
    prerequisites: ["kana-seion"],
    glossary: ["jlpt"],
  },

  {
    id: "verbs-conjugation",
    category: "verbs",
    title: "动词活用（ます/ない/て/た）",
    short: "用少量常用动词练活用，快速上手日常表达。",
    href: "/quiz?mode=verb-conjugation",
    prerequisites: ["kana-seion"],
    glossary: ["conjugation", "masu-kei", "nai-kei", "te-kei", "ta-kei", "jishokei"],
  },

  {
    id: "vocab-survival",
    category: "vocab",
    title: "生存词汇（能用的词）",
    short: "优先学“立刻能开口/能看懂”的词汇。",
    href: "/vocabulary?level=survival",
    prerequisites: ["kana-seion"],
    glossary: ["jlpt"],
  },

  {
    id: "pragmatics",
    category: "nuance",
    title: "情境表达（语用）",
    short: "同一句话在不同场合怎么说才“得体”。",
    href: "/pragmatics",
    prerequisites: ["particles-basic"],
  },
  {
    id: "semantics",
    category: "nuance",
    title: "近义细微差别（语义）",
    short: "更精确地表达：意思相近但语感不同。",
    href: "/semantics",
    prerequisites: ["vocab-survival"],
  },
]

export const SKILL_TREE_BY_CATEGORY: Record<SkillCategory, SkillNode[]> = SKILL_TREE.reduce(
  (acc, node) => {
    acc[node.category].push(node)
    return acc
  },
  {
    foundation: [],
    sound: [],
    sentence: [],
    verbs: [],
    vocab: [],
    nuance: [],
  } as Record<SkillCategory, SkillNode[]>
)
