export type VerbConjForm = "masu" | "nai" | "te" | "ta" | "potential" | "causative"
export type VerbKind = "ichidan" | "godan" | "suru" | "kuru"

export interface VerbEntry {
  dict: string
  kanji?: string
  meaning: string
  kind: VerbKind
}

export const VERB_CONJ_FORMS: { id: VerbConjForm; label: string }[] = [
  { id: "masu", label: "ます形" },
  { id: "nai", label: "ない形" },
  { id: "te", label: "て形" },
  { id: "ta", label: "た形" },
  { id: "potential", label: "可能形" },
  { id: "causative", label: "使役形" },
]

export const VERB_CONJ_N5_FORMS = VERB_CONJ_FORMS.filter((form) => form.id === "masu" || form.id === "nai" || form.id === "te" || form.id === "ta")

// できる already expresses ability and is not normally further inflected
// into a potential or causative form in learner-facing questions.
export function isVerbConjFormSupported(verb: Pick<VerbEntry, "dict">, form: VerbConjForm) {
  return !(verb.dict === "できる" && (form === "potential" || form === "causative"))
}

export function getVerbConjFormsForVerb(verb: Pick<VerbEntry, "dict">) {
  return VERB_CONJ_FORMS.filter((form) => isVerbConjFormSupported(verb, form.id))
}

export function verbConjFormsForCourse(nextTrack?: string | null, allLessonsDone = false) {
  if (allLessonsDone || nextTrack === "n4-core" || nextTrack === "n3-core" || nextTrack === "n2-core") {
    return VERB_CONJ_FORMS
  }
  return VERB_CONJ_N5_FORMS
}

// Curated beginner set: focus on common N5 verbs + a few "る-verb" exceptions.
export const VERB_CONJ_VERBS: VerbEntry[] = [
  { dict: "たべる", kanji: "食べる", meaning: "吃", kind: "ichidan" },
  { dict: "みる", kanji: "見る", meaning: "看", kind: "ichidan" },
  { dict: "おきる", kanji: "起きる", meaning: "起床", kind: "ichidan" },
  { dict: "ねる", kanji: "寝る", meaning: "睡觉", kind: "ichidan" },

  { dict: "いく", kanji: "行く", meaning: "去", kind: "godan" }, // いく => いって/いった
  { dict: "のむ", kanji: "飲む", meaning: "喝", kind: "godan" },
  { dict: "よむ", kanji: "読む", meaning: "读", kind: "godan" },
  { dict: "かく", kanji: "書く", meaning: "写", kind: "godan" },
  { dict: "きく", kanji: "聞く", meaning: "听/问", kind: "godan" },
  { dict: "はなす", kanji: "話す", meaning: "说", kind: "godan" },
  { dict: "まつ", kanji: "待つ", meaning: "等", kind: "godan" },
  { dict: "あそぶ", kanji: "遊ぶ", meaning: "玩", kind: "godan" },
  { dict: "かえる", kanji: "帰る", meaning: "回家", kind: "godan" }, // godan-ru
  { dict: "はしる", kanji: "走る", meaning: "跑", kind: "godan" }, // godan-ru
  { dict: "およぐ", kanji: "泳ぐ", meaning: "游泳", kind: "godan" },
  { dict: "しぬ", kanji: "死ぬ", meaning: "死", kind: "godan" },
  { dict: "かう", kanji: "買う", meaning: "买", kind: "godan" },
  { dict: "あう", kanji: "会う", meaning: "见面", kind: "godan" },
  { dict: "つかう", kanji: "使う", meaning: "使用", kind: "godan" },
  { dict: "わかる", kanji: "分かる", meaning: "懂", kind: "godan" },
  { dict: "のる", kanji: "乗る", meaning: "乘坐", kind: "godan" },
  { dict: "つくる", kanji: "作る", meaning: "做/制作", kind: "godan" },
  { dict: "はたらく", kanji: "働く", meaning: "工作", kind: "godan" },
  { dict: "あるく", kanji: "歩く", meaning: "走路", kind: "godan" },
  { dict: "やすむ", kanji: "休む", meaning: "休息", kind: "godan" },
  { dict: "もつ", kanji: "持つ", meaning: "拿/持有", kind: "godan" },
  { dict: "でる", kanji: "出る", meaning: "出去", kind: "ichidan" },
  { dict: "できる", meaning: "会/能", kind: "ichidan" },
  { dict: "おしえる", kanji: "教える", meaning: "教", kind: "ichidan" },

  { dict: "くる", kanji: "来る", meaning: "来", kind: "kuru" },
  { dict: "する", meaning: "做", kind: "suru" },
  { dict: "べんきょうする", kanji: "勉強する", meaning: "学习", kind: "suru" },
]

function chars(str: string) {
  return Array.from(str)
}

function lastChar(str: string) {
  const c = chars(str)
  return c[c.length - 1] ?? ""
}

function dropLastChar(str: string) {
  const c = chars(str)
  c.pop()
  return c.join("")
}

function dropLastChars(str: string, count: number) {
  const c = chars(str)
  return c.slice(0, Math.max(0, c.length - count)).join("")
}

const GODAN_TO_I: Record<string, string> = {
  う: "い",
  く: "き",
  ぐ: "ぎ",
  す: "し",
  つ: "ち",
  ぬ: "に",
  ぶ: "び",
  む: "み",
  る: "り",
}

const GODAN_TO_A: Record<string, string> = {
  う: "わ",
  く: "か",
  ぐ: "が",
  す: "さ",
  つ: "た",
  ぬ: "な",
  ぶ: "ば",
  む: "ま",
  る: "ら",
}

const GODAN_TO_E: Record<string, string> = {
  う: "え",
  く: "け",
  ぐ: "げ",
  す: "せ",
  つ: "て",
  ぬ: "ね",
  ぶ: "べ",
  む: "め",
  る: "れ",
}

function godanTeOrTa(dict: string, form: "te" | "ta") {
  const last = lastChar(dict)
  const root = dropLastChar(dict)
  const isTa = form === "ta"

  // 行く is an exception: いく => いって/いった
  if (dict === "いく") return root + (isTa ? "った" : "って")

  if (last === "う" || last === "つ" || last === "る") return root + (isTa ? "った" : "って")
  if (last === "む" || last === "ぶ" || last === "ぬ") return root + (isTa ? "んだ" : "んで")
  if (last === "く") return root + (isTa ? "いた" : "いて")
  if (last === "ぐ") return root + (isTa ? "いだ" : "いで")
  if (last === "す") return root + (isTa ? "した" : "して")

  return dict
}

const KURU_FORMS: Record<VerbConjForm, string> = {
  masu: "きます",
  nai: "こない",
  te: "きて",
  ta: "きた",
  potential: "こられる",
  causative: "こさせる",
}

export function conjugateVerb(dict: string, kind: VerbKind, form: VerbConjForm) {
  if (!dict) return dict

  if (kind === "kuru") return KURU_FORMS[form] ?? dict

  if (kind === "suru") {
    const base = dict.endsWith("する") ? dropLastChars(dict, 2) : dict === "する" ? "" : dict
    if (form === "masu") return `${base}します`
    if (form === "nai") return `${base}しない`
    if (form === "te") return `${base}して`
    if (form === "ta") return `${base}した`
    if (form === "potential") return `${base}できる`
    return `${base}させる`
  }

  if (kind === "ichidan") {
    const stem = dropLastChar(dict)
    if (form === "masu") return `${stem}ます`
    if (form === "nai") return `${stem}ない`
    if (form === "te") return `${stem}て`
    if (form === "ta") return `${stem}た`
    if (form === "potential") return `${stem}られる`
    return `${stem}させる`
  }

  const last = lastChar(dict)
  const root = dropLastChar(dict)

  if (form === "masu") {
    const i = GODAN_TO_I[last]
    return i ? `${root}${i}ます` : dict
  }

  if (form === "nai") {
    const a = GODAN_TO_A[last]
    return a ? `${root}${a}ない` : dict
  }

  if (form === "te") return godanTeOrTa(dict, "te")
  if (form === "ta") return godanTeOrTa(dict, "ta")

  if (form === "potential") {
    const e = GODAN_TO_E[last]
    return e ? `${root}${e}る` : dict
  }

  const a = GODAN_TO_A[last]
  return a ? `${root}${a}せる` : dict
}

export function explainConjugation(verb: VerbEntry, form: VerbConjForm) {
  const label = VERB_CONJ_FORMS.find((item) => item.id === form)?.label ?? form
  const baseName = verb.kanji ? `${verb.kanji}（${verb.dict}）` : verb.dict
  const answer = conjugateVerb(verb.dict, verb.kind, form)
  const head = `「${baseName}」（${verb.meaning}）的 ${label} 是「${answer}」。`

  if (form === "potential") {
    if (verb.kind === "ichidan") return `${head}一段动词：去掉「る」再接「られる」。`
    if (verb.kind === "suru") return `${head}する动词：可能形是「できる」。`
    if (verb.kind === "kuru") return `${head}くる：こられる（不规则）。`
    const last = lastChar(verb.dict)
    return `${head}五段动词：末尾「${last}」→「${GODAN_TO_E[last] ?? "?"}」再接「る」。`
  }

  if (form === "causative") {
    if (verb.kind === "ichidan") return `${head}一段动词：去掉「る」再接「させる」。`
    if (verb.kind === "suru") return `${head}する动词：使役形是「させる」。`
    if (verb.kind === "kuru") return `${head}くる：こさせる（不规则）。`
    const last = lastChar(verb.dict)
    return `${head}五段动词：末尾「${last}」→「${GODAN_TO_A[last] ?? "?"}」再接「せる」（う→わ）。`
  }

  if (verb.kind === "ichidan") {
    return `${head}一段动词：去掉「る」再接「ます/ない/て/た」。`
  }

  if (verb.kind === "suru") {
    return `${head}する动词：～します／～しない／～して／～した。`
  }

  if (verb.kind === "kuru") {
    return `${head}くる：きます／こない／きて／きた（不规则）。`
  }

  const last = lastChar(verb.dict)
  if (form === "masu") {
    return `${head}五段动词：末尾「${last}」→「${GODAN_TO_I[last] ?? "?"}」再接「ます」。`
  }

  if (form === "nai") {
    return `${head}五段动词：末尾「${last}」→「${GODAN_TO_A[last] ?? "?"}」再接「ない」（う→わ）。`
  }

  if (verb.dict === "いく") {
    return `${head}注意例外：いく → いって／いった（不是 いて／いた）。`
  }

  return `${head}五段动词：て形/た形按词尾分组变化（う/つ/る→って/った，む/ぶ/ぬ→んで/んだ，く→いて/いた，ぐ→いで/いだ，す→して/した）。`
}
