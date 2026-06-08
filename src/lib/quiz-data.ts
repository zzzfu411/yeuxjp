export const SOKUON_MINIMAL_PAIRS = [
  { plain: "きて", special: "きって" },
  { plain: "かた", special: "かった" },
  { plain: "いて", special: "いって" },
  { plain: "さか", special: "さっか" },
] as const

export const LONG_VOWEL_MINIMAL_PAIRS = [
  { plain: "おばさん", special: "おばあさん" },
  { plain: "おじさん", special: "おじいさん" },
  { plain: "ゆき", special: "ゆうき" },
  { plain: "ビル", special: "ビール" },
] as const

export const PARTICLE_QUESTIONS = [
  {
    sentence: "わたし＿がくせいです。",
    full: "わたしはがくせいです。",
    answer: "は",
    options: ["は", "が", "を", "に"],
    explanation: "「は」标记主题（Topic）。句子在说明“关于我”的信息。",
  },
  {
    sentence: "ねこ＿います。",
    full: "ねこがいます。",
    answer: "が",
    options: ["は", "が", "を", "に"],
    explanation: "「いる/ある」表示“存在”时，常用「が」来引入主语（有什么/谁在）。",
  },
  {
    sentence: "パン＿たべます。",
    full: "パンをたべます。",
    answer: "を",
    options: ["は", "が", "を", "に"],
    explanation: "「を」标记直接宾语（吃“什么”）。",
  },
  {
    sentence: "いえ＿います。",
    full: "いえにいます。",
    answer: "に",
    options: ["に", "で", "を", "が"],
    explanation: "「いる/ある」的“所在地点”用「に」（在哪里“存在/待着”）。",
  },
  {
    sentence: "がっこう＿べんきょうします。",
    full: "がっこうでべんきょうします。",
    answer: "で",
    options: ["に", "で", "を", "と"],
    explanation: "动作发生的场所用「で」（在哪里“做事”）。",
  },
  {
    sentence: "バス＿いきます。",
    full: "バスでいきます。",
    answer: "で",
    options: ["で", "に", "へ", "を"],
    explanation: "交通工具/手段常用「で」（用巴士去）。",
  },
  {
    sentence: "ともだち＿はなします。",
    full: "ともだちとはなします。",
    answer: "と",
    options: ["と", "に", "で", "を"],
    explanation: "和谁一起做（对话对象）常用「と」（和朋友说话）。",
  },
  {
    sentence: "すし＿すきです。",
    full: "すしがすきです。",
    answer: "が",
    options: ["は", "が", "を", "に"],
    explanation: "「すき/きらい/ほしい」常用「が」标记对象（喜欢“什么”）。",
  },
  {
    sentence: "8じ＿おきます。",
    full: "8じにおきます。",
    answer: "に",
    options: ["に", "で", "を", "が"],
    explanation: "具体时间点常用「に」（在8点起床）。",
  },
  {
    sentence: "きょう＿さむいです。",
    full: "きょうはさむいです。",
    answer: "は",
    options: ["は", "が", "を", "に"],
    explanation: "时间作为话题时常用「は」（今天“就…而言”很冷）。",
  },
  {
    sentence: "わたし＿いきます。",
    full: "わたしもいきます。",
    answer: "も",
    options: ["は", "が", "も", "に"],
    explanation: "「も」表示“也/同样”。",
  },
] as const
