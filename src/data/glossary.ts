export type GlossaryCategory = "kana" | "pronunciation" | "grammar" | "levels"

export interface GlossaryExample {
  jp: string
  note?: string
}

export interface GlossaryEntry {
  id: string
  term: string
  category: GlossaryCategory
  short: string
  detail?: string
  examples?: GlossaryExample[]
}

export const GLOSSARY_CATEGORY_LABEL: Record<GlossaryCategory, string> = {
  kana: "文字与记法",
  pronunciation: "读音与发音",
  grammar: "语法术语",
  levels: "等级与体系",
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: "kana",
    term: "假名（かな）",
    category: "kana",
    short: "日语的表音文字总称（平假名 + 片假名）。",
    examples: [{ jp: "あ / ア", note: "同一个音在平/片假名各写一套" }],
  },
  {
    id: "hiragana",
    term: "平假名（ひらがな）",
    category: "kana",
    short: "多用于原生词、助词与活用结尾（更“日文感”）。",
    examples: [
      { jp: "わたしは がくせいです。", note: "助词「は」常用平假名写" },
      { jp: "たべる → たべます", note: "活用结尾通常用平假名" },
    ],
  },
  {
    id: "katakana",
    term: "片假名（カタカナ）",
    category: "kana",
    short: "多用于外来语、拟声拟态、强调；长音常写「ー」。",
    examples: [
      { jp: "コーヒー", note: "外来语 + 长音符号「ー」" },
      { jp: "パン", note: "外来语（面包）" },
    ],
  },
  {
    id: "gojuon",
    term: "五十音（ごじゅうおん）",
    category: "kana",
    short: "按“行/段”整理的假名表，是入门学习顺序的骨架。",
    examples: [{ jp: "あ行 / か行 / さ行…", note: "按行学习更稳" }],
  },
  {
    id: "romaji",
    term: "罗马音（ローマ字）",
    category: "kana",
    short: "用拉丁字母标注读音（入门辅助），建议熟悉后逐步隐藏。",
    examples: [{ jp: "さ = sa", note: "能读假名后尽量少依赖" }],
  },

  {
    id: "seion",
    term: "清音（せいおん）",
    category: "pronunciation",
    short: "不带「゛/゜」的基础音（最先掌握）。",
    examples: [{ jp: "か / さ / た / は", note: "基础系列" }],
  },
  {
    id: "dakuon",
    term: "浊音（だくおん）",
    category: "pronunciation",
    short: "加濁点「゛」后变成更“有声”的音（k→g 等）。",
    examples: [{ jp: "か → が、さ → ざ、は → ば", note: "看见「゛」就想到浊化" }],
  },
  {
    id: "handakuon",
    term: "半浊音（はんだくおん）",
    category: "pronunciation",
    short: "加半濁点「゜」后变成 p 音（只在 は行）。",
    examples: [{ jp: "は → ぱ、ひ → ぴ、ふ → ぷ", note: "小圆点「゜」" }],
  },
  {
    id: "yoon",
    term: "拗音（ようおん）",
    category: "pronunciation",
    short: "由「い段 + 小ゃ/ゅ/ょ」组成，读音会“收缩”。",
    examples: [{ jp: "きゃ / しゅ / ちょ", note: "小ゃゅょ 不占完整一拍" }],
  },
  {
    id: "sokuon",
    term: "促音（そくおん）",
    category: "pronunciation",
    short: "用小写「っ/ッ」表示，不单独发音，表示后续子音加倍。",
    examples: [
      { jp: "きて vs きって", note: "听感与意义都可能不同" },
      { jp: "がっこう", note: "常见词" },
    ],
  },
  {
    id: "chouon",
    term: "长音（ちょうおん）",
    category: "pronunciation",
    short: "把元音拉长；长短不同可能变成不同词义。片假名常用「ー」。",
    examples: [
      { jp: "おばさん vs おばあさん", note: "长音会改变词义" },
      { jp: "ビル vs ビール", note: "片假名里常用「ー」" },
    ],
  },

  {
    id: "particle",
    term: "助词（じょし）",
    category: "grammar",
    short: "用来标记句子成分/关系的小词（は/が/を/に/で/と…）。",
    examples: [
      { jp: "わたしは がくせいです。", note: "「は」：主题" },
      { jp: "パンを たべます。", note: "「を」：宾语" },
    ],
  },
  {
    id: "conjugation",
    term: "活用（かつよう）",
    category: "grammar",
    short: "动词/形容词为表达礼貌、否定、过去等而变形。",
    examples: [{ jp: "たべる → たべます/たべない/たべて/たべた", note: "同一个动词有多种形" }],
  },
  {
    id: "jishokei",
    term: "辞书形（じしょけい）",
    category: "grammar",
    short: "词典里收录的基本形（如 たべる/いく/する）。",
    examples: [{ jp: "たべる（辞书形）", note: "做活用题时的“起点”" }],
  },
  {
    id: "masu-kei",
    term: "ます形（ますけい）",
    category: "grammar",
    short: "礼貌体常用形（…ます/…ません/…ました）。",
    examples: [{ jp: "たべます / いきます", note: "对初学者最实用" }],
  },
  {
    id: "nai-kei",
    term: "ない形（ないけい）",
    category: "grammar",
    short: "否定常用形（…ない）。",
    examples: [{ jp: "たべない / いかない", note: "注意 いく→いかない" }],
  },
  {
    id: "te-kei",
    term: "て形（てけい）",
    category: "grammar",
    short: "连接、请求、进行等多用途的关键形态（…て）。",
    examples: [{ jp: "たべて / のんで / いって", note: "变化多但使用频率极高" }],
  },
  {
    id: "ta-kei",
    term: "た形（たけい）",
    category: "grammar",
    short: "过去/完成常用形（…た）。",
    examples: [{ jp: "たべた / のんだ / いった", note: "经常和 て形 成对学习" }],
  },

  {
    id: "jlpt",
    term: "JLPT（日本语能力测试）",
    category: "levels",
    short: "日语能力考试难度分级：N5 最基础，N1 最难。",
    examples: [{ jp: "N5 → N4 → N3 → N2 → N1", note: "由易到难" }],
  },
  {
    id: "anime-level",
    term: "Anime（作品口语）",
    category: "levels",
    short: "本项目里指“作品/口语表达”，不等同于 JLPT 难度分级。",
    examples: [{ jp: "～じゃん / ～っす", note: "口语/角色语气常见" }],
  },
]

export const GLOSSARY_BY_ID: Record<string, GlossaryEntry> = Object.fromEntries(
  GLOSSARY.map((entry) => [entry.id, entry])
)

