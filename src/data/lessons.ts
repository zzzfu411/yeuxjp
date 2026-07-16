export type LessonTrack = "starter-14"
export type LessonItemType = "kana" | "vocab" | "grammar" | "sentence"
export type LessonPracticeMode = "recognition" | "listening" | "meaning" | "recall" | "production"

export interface LessonItemRef {
  type: LessonItemType
  id: string
}

interface LessonStepBase {
  id: string
  title: string
}

export interface ExplainStep extends LessonStepBase {
  type: "explain"
  body: string
  bullets?: string[]
}

export interface ExampleStep extends LessonStepBase {
  type: "example"
  japanese: string
  romaji?: string
  meaning: string
  note?: string
  audioText?: string
}

export interface ChoiceStep extends LessonStepBase {
  type: "multipleChoice"
  prompt: string
  options: string[]
  answer: string
  acceptedAnswers?: string[]
  explanation?: string
  audioText?: string
  itemId: string
  itemType: LessonItemType
  mode: LessonPracticeMode
}

export interface TypingStep extends LessonStepBase {
  type: "typing"
  prompt: string
  answer: string
  acceptedAnswers?: string[]
  hint?: string
  audioText?: string
  itemId: string
  itemType: LessonItemType
  mode: LessonPracticeMode
}

export interface DictationStep extends LessonStepBase {
  type: "dictation"
  prompt: string
  audioText: string
  answer: string
  acceptedAnswers?: string[]
  hint?: string
  itemId: string
  itemType: LessonItemType
  mode: LessonPracticeMode
}

export interface SentenceBuildStep extends LessonStepBase {
  type: "sentenceBuild"
  prompt: string
  chunks: string[]
  answer: string
  meaning: string
  itemId: string
  itemType: LessonItemType
  mode: LessonPracticeMode
}

export interface SummaryStep extends LessonStepBase {
  type: "summary"
  body: string
  reviewItems: string[]
  next?: string
}

export type LessonStep =
  | ExplainStep
  | ExampleStep
  | ChoiceStep
  | TypingStep
  | DictationStep
  | SentenceBuildStep
  | SummaryStep

export interface Lesson {
  id: string
  title: string
  subtitle: string
  track: LessonTrack
  order: number
  estimatedMinutes: number
  prerequisites: string[]
  skillIds: string[]
  newItemIds: LessonItemRef[]
  steps: LessonStep[]
}

export const STARTER_LESSONS: Lesson[] = [
  {
    id: "day-1-a-row-hello",
    title: "Day 1：あ行和第一句问候",
    subtitle: "先认识最常用的 5 个元音，再开口说 こんにちは。",
    track: "starter-14",
    order: 1,
    estimatedMinutes: 10,
    prerequisites: [],
    skillIds: ["kana-seion", "listen-kana", "vocab-survival"],
    newItemIds: [
      { type: "kana", id: "a" },
      { type: "kana", id: "i" },
      { type: "kana", id: "u" },
      { type: "kana", id: "e" },
      { type: "kana", id: "o" },
      { type: "vocab", id: "sur-g-1" },
    ],
    steps: [
      {
        id: "why-a-row",
        type: "explain",
        title: "先抓住日语的元音",
        body: "あ、い、う、え、お是日语声音的地基。今天只练这 5 个，不急着背完整五十音。",
        bullets: ["あ 像张口的 a", "い 像中文“衣”的短音", "う 嘴唇不要太圆", "え 接近 e", "お 接近 o"],
      },
      { id: "hello-example", type: "example", title: "今天可用的一句话", japanese: "こんにちは。", romaji: "Konnichiwa.", meaning: "你好。", audioText: "こんにちは" },
      {
        id: "recognize-a",
        type: "multipleChoice",
        title: "看假名选读音",
        prompt: "あ 的读音是？",
        options: ["a", "i", "u", "e"],
        answer: "a",
        itemId: "a",
        itemType: "kana",
        mode: "recognition",
      },
      {
        id: "listen-o",
        type: "multipleChoice",
        title: "听音辨字",
        prompt: "听发音，选择对应假名。",
        audioText: "お",
        options: ["あ", "い", "え", "お"],
        answer: "お",
        itemId: "o",
        itemType: "kana",
        mode: "listening",
      },
      {
        id: "type-hello",
        type: "typing",
        title: "主动回忆",
        prompt: "输入“你好”的日语假名。",
        answer: "こんにちは",
        acceptedAnswers: ["こんにちは。", "こんにちは"],
        hint: "こ ん に ち は",
        itemId: "sur-g-1",
        itemType: "vocab",
        mode: "recall",
      },
      {
        id: "summary",
        type: "summary",
        title: "今天完成",
        body: "你已经认识あ行，并能用 こんにちは 开始一次对话。",
        reviewItems: ["あ/い/う/え/お", "こんにちは"],
        next: "明天加入か行，并学会说谢谢。",
      },
    ],
  },
  {
    id: "day-2-ka-row-thanks",
    title: "Day 2：か行和谢谢",
    subtitle: "加入かきくけこ，把问候变成礼貌互动。",
    track: "starter-14",
    order: 2,
    estimatedMinutes: 10,
    prerequisites: ["day-1-a-row-hello"],
    skillIds: ["kana-seion", "listen-kana", "vocab-survival"],
    newItemIds: [
      { type: "kana", id: "ka" },
      { type: "kana", id: "ki" },
      { type: "kana", id: "ku" },
      { type: "kana", id: "ke" },
      { type: "kana", id: "ko" },
      { type: "vocab", id: "sur-g-5" },
    ],
    steps: [
      { id: "ka-row", type: "explain", title: "か行的感觉", body: "か行是在元音前加一个清晰的 k 音：ka、ki、ku、ke、ko。先把它们和あ行对照起来。" },
      { id: "thanks-example", type: "example", title: "今天可用的一句话", japanese: "ありがとう。", romaji: "Arigatou.", meaning: "谢谢。", audioText: "ありがとう" },
      { id: "recognize-ku", type: "multipleChoice", title: "看假名选读音", prompt: "く 的读音是？", options: ["ka", "ki", "ku", "ko"], answer: "ku", itemId: "ku", itemType: "kana", mode: "recognition" },
      { id: "dictation-ko", type: "dictation", title: "听写一个音", prompt: "听发音，输入对应平假名。", audioText: "こ", answer: "こ", itemId: "ko", itemType: "kana", mode: "listening" },
      { id: "thanks-meaning", type: "multipleChoice", title: "词义确认", prompt: "ありがとう 的意思是？", options: ["谢谢", "你好", "再见", "没关系"], answer: "谢谢", itemId: "sur-g-5", itemType: "vocab", mode: "meaning" },
      { id: "summary", type: "summary", title: "今天完成", body: "你现在能识别あ行、か行，并能说你好和谢谢。", reviewItems: ["か/き/く/け/こ", "ありがとう"], next: "明天会加入さ行和道歉/劳驾表达。" },
    ],
  },
  {
    id: "day-3-sa-ta-row-sumimasen",
    title: "Day 3：さ行、た行和すみません",
    subtitle: "把“劳驾/抱歉”作为第一个高频万能表达。",
    track: "starter-14",
    order: 3,
    estimatedMinutes: 12,
    prerequisites: ["day-2-ka-row-thanks"],
    skillIds: ["kana-seion", "listen-kana", "vocab-survival"],
    newItemIds: [
      { type: "kana", id: "sa" },
      { type: "kana", id: "shi" },
      { type: "kana", id: "su" },
      { type: "kana", id: "ta" },
      { type: "kana", id: "chi" },
      { type: "kana", id: "tsu" },
      { type: "vocab", id: "sur-g-6" },
    ],
    steps: [
      { id: "irregular-sounds", type: "explain", title: "注意两个特殊读音", body: "さ行和た行里有几个不按直觉走的音：し是 shi，ち是 chi，つ是 tsu。先接受它们，不必急着解释历史原因。" },
      { id: "sumimasen-example", type: "example", title: "今天可用的一句话", japanese: "すみません。", romaji: "Sumimasen.", meaning: "对不起 / 劳驾。", audioText: "すみません" },
      { id: "recognize-shi", type: "multipleChoice", title: "看假名选读音", prompt: "し 的读音是？", options: ["sa", "shi", "su", "chi"], answer: "shi", itemId: "shi", itemType: "kana", mode: "recognition" },
      { id: "recognize-ta", type: "multipleChoice", title: "再认一个", prompt: "た 的读音是？", options: ["ta", "da", "na", "ha"], answer: "ta", itemId: "ta", itemType: "kana", mode: "recognition" },
      { id: "listen-tsu", type: "multipleChoice", title: "听音辨字", prompt: "听发音，选择对应假名。", audioText: "つ", options: ["す", "つ", "し", "ち"], answer: "つ", itemId: "tsu", itemType: "kana", mode: "listening" },
      { id: "type-sumimasen", type: "typing", title: "主动回忆", prompt: "输入“劳驾/抱歉”的日语假名。", answer: "すみません", hint: "す み ま せ ん", itemId: "sur-g-6", itemType: "vocab", mode: "recall" },
      { id: "summary", type: "summary", title: "今天完成", body: "すみません 能用于道歉、叫住店员、请别人让路，是非常值得优先掌握的表达。", reviewItems: ["し/ち/つ", "すみません"], next: "明天补完清音并第一次造句。" },
    ],
  },
  {
    id: "day-4-na-ha-ma-intro-sentence",
    title: "Day 4：补足清音，第一次造句",
    subtitle: "用 は 和 です 说出“我是……”。",
    track: "starter-14",
    order: 4,
    estimatedMinutes: 12,
    prerequisites: ["day-3-sa-ta-row-sumimasen"],
    skillIds: ["kana-seion", "particles-basic", "grammar-n5"],
    newItemIds: [
      { type: "kana", id: "na" },
      { type: "kana", id: "ha" },
      { type: "kana", id: "ma" },
      { type: "kana", id: "ya" },
      { type: "kana", id: "ra" },
      { type: "grammar", id: "n5-wa" },
      { type: "grammar", id: "n5-desu" },
    ],
    steps: [
      { id: "sentence-frame", type: "explain", title: "第一条句子骨架", body: "日语常用「A は B です」介绍身份或状态。这里的 は 写作 ha，但作助词时读 wa。" },
      { id: "sentence-example", type: "example", title: "看一个真实入门句", japanese: "わたしはがくせいです。", romaji: "Watashi wa gakusei desu.", meaning: "我是学生。", audioText: "わたしはがくせいです" },
      { id: "particle-wa", type: "multipleChoice", title: "助词识别", prompt: "在「わたし＿がくせいです」里应该填什么？", options: ["は", "が", "を", "に"], answer: "は", explanation: "は标记这句话要说明的主题。", itemId: "n5-wa", itemType: "grammar", mode: "recognition" },
      { id: "recognize-ra", type: "multipleChoice", title: "再认一个", prompt: "ら 的读音是？", options: ["ra", "na", "ma", "wa"], answer: "ra", itemId: "ra", itemType: "kana", mode: "recognition" },
      { id: "build-intro", type: "sentenceBuild", title: "组句", prompt: "组出“我是学生”。", chunks: ["です", "わたし", "がくせい", "は"], answer: "わたしはがくせいです", meaning: "我是学生。", itemId: "sentence-intro-student", itemType: "sentence", mode: "production" },
      { id: "dictation-ha", type: "dictation", title: "听写一个音", prompt: "听发音，输入对应平假名。", audioText: "は", answer: "は", itemId: "ha", itemType: "kana", mode: "listening" },
      { id: "summary", type: "summary", title: "今天完成", body: "你已经不只是认假名，而是开始用假名组成句子。", reviewItems: ["は 作助词读 wa", "A は B です"], next: "明天进入浊音：か 会变成 が。" },
    ],
  },
  {
    id: "day-5-dakuon-yes-no",
    title: "Day 5：浊音和はい/いいえ",
    subtitle: "理解小点点「゛」如何改变声音。",
    track: "starter-14",
    order: 5,
    estimatedMinutes: 10,
    prerequisites: ["day-4-na-ha-ma-intro-sentence"],
    skillIds: ["kana-dakuon", "listen-kana", "vocab-survival"],
    newItemIds: [
      { type: "kana", id: "ga" },
      { type: "kana", id: "gi" },
      { type: "kana", id: "gu" },
      { type: "kana", id: "ge" },
      { type: "kana", id: "go" },
      { type: "vocab", id: "sur-g-15" },
      { type: "vocab", id: "sur-g-16" },
    ],
    steps: [
      { id: "dakuon-rule", type: "explain", title: "浊音不是新的一套字母", body: "在假名右上角加「゛」会让声音变浊：か→が、き→ぎ。今天只先练が行。" },
      { id: "yes-no-example", type: "example", title: "今天可用的两个回答", japanese: "はい。いいえ。", romaji: "Hai. Iie.", meaning: "是。不是。", audioText: "はい。いいえ。" },
      { id: "recognize-ga", type: "multipleChoice", title: "看假名选读音", prompt: "が 的读音是？", options: ["ka", "ga", "ki", "gi"], answer: "ga", itemId: "ga", itemType: "kana", mode: "recognition" },
      { id: "listen-gi", type: "multipleChoice", title: "听音辨字", prompt: "听发音，选择对应假名。", audioText: "ぎ", options: ["き", "ぎ", "け", "げ"], answer: "ぎ", itemId: "gi", itemType: "kana", mode: "listening" },
      { id: "meaning-hai", type: "multipleChoice", title: "词义确认", prompt: "はい 的意思是？", options: ["是", "不是", "谢谢", "抱歉"], answer: "是", itemId: "sur-g-15", itemType: "vocab", mode: "meaning" },
      { id: "summary", type: "summary", title: "今天完成", body: "你学会了が行，也拿到了最基础的应答：はい / いいえ。", reviewItems: ["が/ぎ/ぐ/げ/ご", "はい / いいえ"], next: "明天学习半浊音和促音的节奏。" },
    ],
  },
  {
    id: "day-6-handakuon-sokuon",
    title: "Day 6：半浊音和促音",
    subtitle: "听出小「っ」带来的停顿。",
    track: "starter-14",
    order: 6,
    estimatedMinutes: 12,
    prerequisites: ["day-5-dakuon-yes-no"],
    skillIds: ["kana-dakuon", "kana-sokuon", "listen-sokuon"],
    newItemIds: [
      { type: "kana", id: "pa" },
      { type: "kana", id: "pi" },
      { type: "kana", id: "pu" },
      { type: "kana", id: "pe" },
      { type: "kana", id: "po" },
      { type: "kana", id: "sokuon" },
    ],
    steps: [
      { id: "handakuon-rule", type: "explain", title: "小圆圈「゜」", body: "は行加「゜」会变成ぱ行：ぱ、ぴ、ぷ、ぺ、ぽ。小「っ」不单独发音，它让后面的子音停一下再出来。" },
      { id: "sokuon-example", type: "example", title: "听节奏差异", japanese: "きて / きって", romaji: "kite / kitte", meaning: "来 / 切手", audioText: "きて。きって。" },
      { id: "recognize-pa", type: "multipleChoice", title: "看假名选读音", prompt: "ぱ 的读音是？", options: ["ha", "ba", "pa", "po"], answer: "pa", itemId: "pa", itemType: "kana", mode: "recognition" },
      { id: "listen-sokuon", type: "multipleChoice", title: "促音听辨", prompt: "听发音，选择你听到的假名。", audioText: "きって", options: ["きて", "きって"], answer: "きって", itemId: "sokuon", itemType: "kana", mode: "listening" },
      { id: "type-sokuon", type: "typing", title: "主动回忆", prompt: "输入带促音的 きって。", answer: "きって", hint: "小 っ 在中间", itemId: "sokuon", itemType: "kana", mode: "recall" },
      { id: "summary", type: "summary", title: "今天完成", body: "你已经开始训练日语节奏，不只是字形记忆。", reviewItems: ["ぱ行", "小っ/ッ 的停顿"], next: "明天做第一周 checkpoint，整理读音和问候。" },
    ],
  },
  {
    id: "day-7-week-one-checkpoint",
    title: "Day 7：第一周 checkpoint",
    subtitle: "把假名、听辨和基础问候串起来。",
    track: "starter-14",
    order: 7,
    estimatedMinutes: 12,
    prerequisites: ["day-6-handakuon-sokuon"],
    skillIds: ["kana-seion", "listen-kana", "vocab-survival"],
    newItemIds: [
      { type: "vocab", id: "sur-g-10" },
      { type: "vocab", id: "sur-g-11" },
      { type: "vocab", id: "sur-g-12" },
      { type: "vocab", id: "sur-g-13" },
      { type: "vocab", id: "sur-g-24" },
    ],
    steps: [
      { id: "checkpoint", type: "explain", title: "今天不猛灌新知识", body: "第一周最后一天重点是把能开口的表达整理成一小组：初次见面、请多关照、抱歉、没关系、拜托了。" },
      { id: "intro-example", type: "example", title: "初次见面的组合句", japanese: "はじめまして。よろしくおねがいします。", romaji: "Hajimemashite. Yoroshiku onegaishimasu.", meaning: "初次见面，请多关照。", audioText: "はじめまして。よろしくおねがいします。" },
      { id: "meaning-yoroshiku", type: "multipleChoice", title: "词义确认", prompt: "よろしく 的常见意思是？", options: ["请多关照", "我回来了", "多少钱", "不知道"], answer: "请多关照", itemId: "sur-g-11", itemType: "vocab", mode: "meaning" },
      { id: "dictation-hajime", type: "dictation", title: "听写短语", prompt: "听发音，输入假名。", audioText: "はじめまして", answer: "はじめまして", itemId: "sur-g-10", itemType: "vocab", mode: "listening" },
      { id: "build-intro-formula", type: "sentenceBuild", title: "组句", prompt: "组出“初次见面，请多关照”。", chunks: ["よろしく", "はじめまして", "おねがいします"], answer: "はじめましてよろしくおねがいします", meaning: "初次见面，请多关照。", itemId: "sentence-first-meeting", itemType: "sentence", mode: "production" },
      { id: "summary", type: "summary", title: "第一周完成", body: "你已经有了假名基础、听辨意识和一组真实可用的礼貌表达。", reviewItems: ["はじめまして", "よろしく", "お願いします"], next: "第二周进入句子核心：助词和存在句。" },
    ],
  },
  {
    id: "day-8-particles-wa-ga",
    title: "Day 8：は 和 が",
    subtitle: "区分“我要说的主题”和“出现的新信息”。",
    track: "starter-14",
    order: 8,
    estimatedMinutes: 12,
    prerequisites: ["day-7-week-one-checkpoint"],
    skillIds: ["particles-basic", "grammar-n5"],
    newItemIds: [
      { type: "grammar", id: "n5-ga" },
      { type: "vocab", id: "sur-p-1" },
      { type: "vocab", id: "sur-p-14" },
      { type: "vocab", id: "sur-p-16" },
      { type: "vocab", id: "sur-p-13" },
    ],
    steps: [
      { id: "wa-ga-core", type: "explain", title: "先用很实用的判断", body: "は像把话题放到桌上：关于A，B。が常用来指出“谁/什么出现了”或强调主语。" },
      { id: "ga-example", type: "example", title: "新信息用 が", japanese: "ともだちがいます。", romaji: "Tomodachi ga imasu.", meaning: "有朋友在。", audioText: "ともだちがいます" },
      { id: "choose-wa-ga", type: "multipleChoice", title: "助词选择", prompt: "わたし＿がくせいです。", options: ["は", "が", "を", "で"], answer: "は", explanation: "这里是在介绍“关于我”的信息。", itemId: "n5-wa", itemType: "grammar", mode: "recognition" },
      { id: "choose-ga", type: "multipleChoice", title: "助词选择", prompt: "ともだち＿います。", options: ["は", "が", "を", "で"], answer: "が", explanation: "存在句里常用 が 引入“有什么/谁在”。", itemId: "n5-ga", itemType: "grammar", mode: "recognition" },
      { id: "build-friend", type: "sentenceBuild", title: "组句", prompt: "组出“有朋友在”。", chunks: ["います", "ともだち", "が"], answer: "ともだちがいます", meaning: "有朋友在。", itemId: "sentence-friend-exists", itemType: "sentence", mode: "production" },
      { id: "summary", type: "summary", title: "今天完成", body: "你开始进入日语的句子骨架：助词决定词和词之间的关系。", reviewItems: ["は：主题", "が：主语/新信息"], next: "明天学习 を，把动作对象说清楚。" },
    ],
  },
  {
    id: "day-9-particle-wo-food",
    title: "Day 9：を 和吃喝",
    subtitle: "用“名词を动词”表达做什么。",
    track: "starter-14",
    order: 9,
    estimatedMinutes: 12,
    prerequisites: ["day-8-particles-wa-ga"],
    skillIds: ["particles-basic", "grammar-n5", "vocab-survival"],
    newItemIds: [
      { type: "grammar", id: "n5-wo" },
      { type: "vocab", id: "sur-v-22" },
      { type: "vocab", id: "sur-v-23" },
      { type: "vocab", id: "sur-f-1" },
      { type: "vocab", id: "sur-f-3" },
    ],
    steps: [
      { id: "wo-core", type: "explain", title: "を 标记动作对象", body: "当你想说“吃什么、喝什么、看什么”时，那个被动作影响的东西后面常放 を。" },
      { id: "eat-example", type: "example", title: "今天可用的一句话", japanese: "パンをたべます。", romaji: "Pan o tabemasu.", meaning: "吃面包。", audioText: "パンをたべます" },
      { id: "choose-wo", type: "multipleChoice", title: "助词选择", prompt: "パン＿たべます。", options: ["は", "が", "を", "に"], answer: "を", explanation: "パン 是“吃”的对象。", itemId: "n5-wo", itemType: "grammar", mode: "recognition" },
      { id: "meaning-tabemasu", type: "multipleChoice", title: "词义确认", prompt: "たべる 的意思是？", options: ["吃", "喝", "看", "去"], answer: "吃", itemId: "sur-v-22", itemType: "vocab", mode: "meaning" },
      { id: "build-drink", type: "sentenceBuild", title: "组句", prompt: "组出“喝水”。", chunks: ["みず", "のみます", "を"], answer: "みずをのみます", meaning: "喝水。", itemId: "sentence-drink-water", itemType: "sentence", mode: "production" },
      { id: "summary", type: "summary", title: "今天完成", body: "你可以用 を 表达动作对象，吃喝类句子已经能开口。", reviewItems: ["N を たべます", "N を のみます"], next: "明天学习 に / で，区分存在地点和动作地点。" },
    ],
  },
  {
    id: "day-10-ni-de-place",
    title: "Day 10：に 和 で",
    subtitle: "在哪里“存在”和在哪里“做事”是不一样的。",
    track: "starter-14",
    order: 10,
    estimatedMinutes: 12,
    prerequisites: ["day-9-particle-wo-food"],
    skillIds: ["particles-basic", "grammar-n5"],
    newItemIds: [
      { type: "grammar", id: "n5-ni-loc" },
      { type: "grammar", id: "n5-de-action" },
      { type: "grammar", id: "n5-arimasu" },
      { type: "grammar", id: "n5-imasu" },
      { type: "vocab", id: "sur-v-38" },
    ],
    steps: [
      { id: "ni-de-core", type: "explain", title: "地点助词的第一条规则", body: "に 常用于存在的位置：いえにいます。で 常用于动作发生的地点：がっこうでべんきょうします。" },
      { id: "place-example", type: "example", title: "对比两个句子", japanese: "いえにいます。がっこうでべんきょうします。", romaji: "Ie ni imasu. Gakkou de benkyou shimasu.", meaning: "在家。 在学校学习。", audioText: "いえにいます。がっこうでべんきょうします。" },
      { id: "choose-ni", type: "multipleChoice", title: "助词选择", prompt: "いえ＿います。", options: ["に", "で", "を", "は"], answer: "に", explanation: "いる/ある 的所在地点常用 に。", itemId: "n5-ni-loc", itemType: "grammar", mode: "recognition" },
      { id: "choose-de", type: "multipleChoice", title: "助词选择", prompt: "がっこう＿べんきょうします。", options: ["に", "で", "を", "が"], answer: "で", explanation: "动作发生的地点用 で。", itemId: "n5-de-action", itemType: "grammar", mode: "recognition" },
      { id: "build-study", type: "sentenceBuild", title: "组句", prompt: "组出“在学校学习”。", chunks: ["べんきょうします", "がっこう", "で"], answer: "がっこうでべんきょうします", meaning: "在学校学习。", itemId: "sentence-study-school", itemType: "sentence", mode: "production" },
      { id: "summary", type: "summary", title: "今天完成", body: "你已经掌握了 N5 里最常碰到的一组地点表达。", reviewItems: ["地点にいます", "地点で动作"], next: "明天开始动词礼貌形：ます。" },
    ],
  },
  {
    id: "day-11-masu-go-come",
    title: "Day 11：ます形和移动动词",
    subtitle: "用礼貌体说“去、来、回”。",
    track: "starter-14",
    order: 11,
    estimatedMinutes: 12,
    prerequisites: ["day-10-ni-de-place"],
    skillIds: ["verbs-conjugation", "grammar-n5", "vocab-survival"],
    newItemIds: [
      { type: "grammar", id: "n5-masu" },
      { type: "vocab", id: "sur-v-1" },
      { type: "vocab", id: "sur-v-2" },
      { type: "vocab", id: "sur-v-3" },
      { type: "grammar", id: "n5-e" },
    ],
    steps: [
      { id: "masu-core", type: "explain", title: "先把礼貌体当作默认开口形", body: "对初学者来说，ます形很实用。它让句子听起来礼貌、稳妥，适合旅行和课堂场景。" },
      { id: "go-example", type: "example", title: "今天可用的一句话", japanese: "えきへいきます。", romaji: "Eki e ikimasu.", meaning: "去车站。", audioText: "えきへいきます" },
      { id: "meaning-iku", type: "multipleChoice", title: "词义确认", prompt: "いく 的意思是？", options: ["去", "来", "回家", "吃"], answer: "去", itemId: "sur-v-1", itemType: "vocab", mode: "meaning" },
      { id: "type-ikimasu", type: "typing", title: "主动回忆", prompt: "输入 いく 的礼貌形。", answer: "いきます", hint: "いき + ます", itemId: "n5-masu", itemType: "grammar", mode: "recall" },
      { id: "build-station", type: "sentenceBuild", title: "组句", prompt: "组出“去车站”。", chunks: ["いきます", "えき", "へ"], answer: "えきへいきます", meaning: "去车站。", itemId: "sentence-go-station", itemType: "sentence", mode: "production" },
      { id: "summary", type: "summary", title: "今天完成", body: "你可以用 ます形表达移动：いきます、きます、かえります。", reviewItems: ["いく→いきます", "くる→きます", "かえる→かえります"], next: "明天学习否定：ません。" },
    ],
  },
  {
    id: "day-12-masen-helpful-verbs",
    title: "Day 12：ません和常用动词",
    subtitle: "学会礼貌地说“不做/不会”。",
    track: "starter-14",
    order: 12,
    estimatedMinutes: 12,
    prerequisites: ["day-11-masu-go-come"],
    skillIds: ["verbs-conjugation", "grammar-n5", "vocab-survival"],
    newItemIds: [
      { type: "grammar", id: "n5-masen" },
      { type: "vocab", id: "sur-v-60" },
      { type: "vocab", id: "sur-v-61" },
      { type: "vocab", id: "sur-v-62" },
      { type: "vocab", id: "sur-v-66" },
    ],
    steps: [
      { id: "masen-core", type: "explain", title: "ません是礼貌否定", body: "ます 表示礼貌肯定，ません 表示礼貌否定。先背少量高频动词，比一次背完整活用表更有效。" },
      { id: "wakarimasen-example", type: "example", title: "旅行高频句", japanese: "わかりません。", romaji: "Wakarimasen.", meaning: "我不明白。", audioText: "わかりません" },
      { id: "meaning-wakaru", type: "multipleChoice", title: "词义确认", prompt: "わかる 的意思是？", options: ["明白", "看", "听", "说"], answer: "明白", itemId: "sur-v-66", itemType: "vocab", mode: "meaning" },
      { id: "type-wakarimasen", type: "typing", title: "主动回忆", prompt: "输入“我不明白”的日语假名。", answer: "わかりません", hint: "わかり + ません", itemId: "n5-masen", itemType: "grammar", mode: "recall" },
      { id: "build-dont-understand", type: "sentenceBuild", title: "组句", prompt: "组出“我不明白”。", chunks: ["わたし", "わかりません", "は"], answer: "わたしはわかりません", meaning: "我不明白。", itemId: "sentence-watashi-wakarimasen", itemType: "sentence", mode: "production" },
      { id: "summary", type: "summary", title: "今天完成", body: "你学会了一个非常实用的求助前置句：わかりません。", reviewItems: ["わかります / わかりません", "みます / ききます / はなします"], next: "明天学习请求：ください。" },
    ],
  },
  {
    id: "day-13-request-kudasai",
    title: "Day 13：请求表达ください",
    subtitle: "用礼貌方式请别人帮忙。",
    track: "starter-14",
    order: 13,
    estimatedMinutes: 12,
    prerequisites: ["day-12-masen-helpful-verbs"],
    skillIds: ["grammar-n5", "vocab-survival", "pragmatics"],
    newItemIds: [
      { type: "grammar", id: "n4-te-kudasai" },
      { type: "vocab", id: "sur-g-14" },
      { type: "vocab", id: "sur-v-74" },
      { type: "vocab", id: "sur-v-52" },
      { type: "vocab", id: "sur-v-44" },
    ],
    steps: [
      { id: "request-core", type: "explain", title: "ください先当成固定礼貌请求", body: "严格来说 てください 需要动词て形，但在生存日语里可以先掌握几个整句：たすけてください、みせてください。" },
      { id: "help-example", type: "example", title: "紧急求助句", japanese: "たすけてください。", romaji: "Tasukete kudasai.", meaning: "请帮帮我。", audioText: "たすけてください" },
      { id: "meaning-tasukete", type: "multipleChoice", title: "词义确认", prompt: "たすけて 的意思是？", options: ["救命/帮忙", "谢谢", "我不明白", "请多关照"], answer: "救命/帮忙", itemId: "sur-g-14", itemType: "vocab", mode: "meaning" },
      { id: "dictation-kudasai", type: "dictation", title: "听写请求句", prompt: "听发音，输入假名。", audioText: "たすけてください", answer: "たすけてください", itemId: "n4-te-kudasai", itemType: "grammar", mode: "listening" },
      { id: "build-request", type: "sentenceBuild", title: "组句", prompt: "组出“请帮帮我”。", chunks: ["ください", "たすけて"], answer: "たすけてください", meaning: "请帮帮我。", itemId: "sentence-help-please", itemType: "sentence", mode: "production" },
      { id: "summary", type: "summary", title: "今天完成", body: "你已经能礼貌提出请求，这比只会背单词更接近真实使用。", reviewItems: ["たすけてください", "すみません + 请求"], next: "明天用点餐和问路做综合情景。" },
    ],
  },
  {
    id: "day-14-survival-scenario",
    title: "Day 14：生存场景综合课",
    subtitle: "把问候、助词、动词和请求串成一次真实互动。",
    track: "starter-14",
    order: 14,
    estimatedMinutes: 15,
    prerequisites: ["day-13-request-kudasai"],
    skillIds: ["vocab-survival", "particles-basic", "verbs-conjugation", "pragmatics"],
    newItemIds: [
      { type: "vocab", id: "sur-g-19" },
      { type: "vocab", id: "sur-g-23" },
      { type: "vocab", id: "sur-v-35" },
      { type: "vocab", id: "sur-v-13" },
      { type: "grammar", id: "n5-ka" },
    ],
    steps: [
      { id: "scenario-core", type: "explain", title: "今天练完整小场景", body: "真实使用不是单点知识，而是把礼貌开场、需求表达、确认和感谢串起来。" },
      { id: "shop-example", type: "example", title: "店铺互动", japanese: "すみません。これをください。ありがとうございます。", romaji: "Sumimasen. Kore o kudasai. Arigatou gozaimasu.", meaning: "劳驾，请给我这个。谢谢。", audioText: "すみません。これをください。ありがとうございます。" },
      { id: "question-ka", type: "multipleChoice", title: "疑问助词", prompt: "句尾加什么常表示疑问？", options: ["か", "を", "で", "も"], answer: "か", itemId: "n5-ka", itemType: "grammar", mode: "recognition" },
      { id: "dictation-sumimasen", type: "dictation", title: "听写开场", prompt: "听发音，输入假名。", audioText: "すみません", answer: "すみません", itemId: "sur-g-6", itemType: "vocab", mode: "listening" },
      { id: "build-shop", type: "sentenceBuild", title: "组句", prompt: "组出“请给我这个”。", chunks: ["これ", "ください", "を"], answer: "これをください", meaning: "请给我这个。", itemId: "sentence-kore-o-kudasai", itemType: "sentence", mode: "production" },
      { id: "final-typing", type: "typing", title: "最后主动回忆", prompt: "输入“谢谢”的日语假名。", answer: "ありがとう", acceptedAnswers: ["ありがとう", "ありがとうございます"], itemId: "sur-g-5", itemType: "vocab", mode: "recall" },
      { id: "summary", type: "summary", title: "第一阶段完成", body: "你已经拥有一条真正的学习闭环：每天新学一点、做输出练习、记录掌握度、回到复习流巩固。", reviewItems: ["すみません", "これをください", "ありがとう"], next: "从 Day 15 开始进入第二阶段：补完整张平假名表，再攻克浊音、拗音、片假名和更多 N5 句型。" },
    ],
  },
  {
    id: "day-15-sa-ta-complete",
    title: "Day 15：补完さ行、た行",
    subtitle: "把 せ・そ・て・と 收进口袋，并学会说“现在”和“明天”。",
    track: "starter-14",
    order: 15,
    estimatedMinutes: 10,
    prerequisites: ["day-14-survival-scenario"],
    skillIds: ["kana-seion", "listen-kana", "vocab-survival"],
    newItemIds: [
      { type: "kana", id: "se" },
      { type: "kana", id: "so" },
      { type: "kana", id: "te" },
      { type: "kana", id: "to" },
      { type: "vocab", id: "sur-t-1" },
      { type: "vocab", id: "sur-t-3" },
    ],
    steps: [
      { id: "sa-ta-complete", type: "explain", title: "补上前两周欠下的音", body: "第一阶段里さ行和た行只学了一半。今天补上 せ・そ・て・と，这四个音在 です、とうきょう、てんき 里天天出现。", bullets: ["せ = se", "そ = so", "て = te", "と = to"] },
      { id: "ashita-example", type: "example", title: "今天可用的一句话", japanese: "あした、とうきょうにいきます。", romaji: "Ashita, Toukyou ni ikimasu.", meaning: "明天去东京。", audioText: "あした、とうきょうにいきます" },
      { id: "recognize-se", type: "multipleChoice", title: "看假名选读音", prompt: "せ 的读音是？", options: ["se", "sa", "su", "so"], answer: "se", itemId: "se", itemType: "kana", mode: "recognition" },
      { id: "listen-te", type: "multipleChoice", title: "听音辨字", prompt: "听发音，选择对应假名。", audioText: "て", options: ["て", "と", "た", "ち"], answer: "て", itemId: "te", itemType: "kana", mode: "listening" },
      { id: "ashita-meaning", type: "multipleChoice", title: "词义确认", prompt: "あした 的意思是？", options: ["明天", "今天", "昨天", "现在"], answer: "明天", itemId: "sur-t-3", itemType: "vocab", mode: "meaning" },
      { id: "type-ima", type: "typing", title: "主动回忆", prompt: "输入“现在”的日语假名。", answer: "いま", hint: "い ま", itemId: "sur-t-1", itemType: "vocab", mode: "recall" },
      { id: "summary", type: "summary", title: "今天完成", body: "せ・そ・て・と 补完后，さ行和た行就是完整的了。", reviewItems: ["せ/そ/て/と", "いま・あした"], next: "明天补完な行，并学会从 1 数到 3。" },
    ],
  },
  {
    id: "day-16-na-row-numbers",
    title: "Day 16：补完な行，学数字 1-3",
    subtitle: "に・ぬ・ね・の 到齐，顺便开始数数。",
    track: "starter-14",
    order: 16,
    estimatedMinutes: 10,
    prerequisites: ["day-15-sa-ta-complete"],
    skillIds: ["kana-seion", "listen-kana", "vocab-survival"],
    newItemIds: [
      { type: "kana", id: "ni" },
      { type: "kana", id: "nu" },
      { type: "kana", id: "ne" },
      { type: "kana", id: "no" },
      { type: "vocab", id: "sur-num-1" },
      { type: "vocab", id: "sur-num-2" },
      { type: "vocab", id: "sur-num-3" },
    ],
    steps: [
      { id: "na-row-complete", type: "explain", title: "な行补完", body: "な 已经认识了，今天补 に・ぬ・ね・の。注意 ぬ 和 め、ね 和 れ 的形状区别，先把 ぬ/ね 记牢。", bullets: ["に = ni（也是数字 2）", "ぬ = nu", "ね = ne", "の = no（超高频助词）"] },
      { id: "count-example", type: "example", title: "开口数数", japanese: "いち、に、さん。", romaji: "Ichi, ni, san.", meaning: "一、二、三。", audioText: "いち、に、さん" },
      { id: "recognize-ne", type: "multipleChoice", title: "看假名选读音", prompt: "ね 的读音是？", options: ["ne", "nu", "no", "ni"], answer: "ne", itemId: "ne", itemType: "kana", mode: "recognition" },
      { id: "listen-no", type: "multipleChoice", title: "听音辨字", prompt: "听发音，选择对应假名。", audioText: "の", options: ["の", "ぬ", "な", "ね"], answer: "の", itemId: "no", itemType: "kana", mode: "listening" },
      { id: "ichi-meaning", type: "multipleChoice", title: "数字确认", prompt: "いち 表示数字几？", options: ["1", "2", "3", "10"], answer: "1", itemId: "sur-num-1", itemType: "vocab", mode: "meaning" },
      { id: "ni-meaning", type: "multipleChoice", title: "数字确认", prompt: "に 表示数字几？", options: ["2", "1", "3", "5"], answer: "2", itemId: "sur-num-2", itemType: "vocab", mode: "meaning" },
      { id: "type-san", type: "typing", title: "主动回忆", prompt: "输入数字 3 的日语假名。", answer: "さん", hint: "さ ん", itemId: "sur-num-3", itemType: "vocab", mode: "recall" },
      { id: "summary", type: "summary", title: "今天完成", body: "な行补完，还能从 1 数到 3。买东西数物品时还要搭配量词，例如 ひとつ・ふたつ・みっつ，后续词汇练习会继续补上。", reviewItems: ["に/ぬ/ね/の", "いち・に・さん"], next: "明天补完は行，学“昨天”和“贵”。" },
    ],
  },
  {
    id: "day-17-ha-row-complete",
    title: "Day 17：补完は行",
    subtitle: "ひ・ふ・へ・ほ 到齐，开始聊价格。",
    track: "starter-14",
    order: 17,
    estimatedMinutes: 10,
    prerequisites: ["day-16-na-row-numbers"],
    skillIds: ["kana-seion", "listen-kana", "vocab-survival"],
    newItemIds: [
      { type: "kana", id: "hi" },
      { type: "kana", id: "fu" },
      { type: "kana", id: "he" },
      { type: "kana", id: "ho" },
      { type: "vocab", id: "sur-t-4" },
      { type: "vocab", id: "sur-adj-3" },
    ],
    steps: [
      { id: "ha-row-complete", type: "explain", title: "は行补完", body: "は 已经认识了，今天补 ひ・ふ・へ・ほ。ふ 的发音介于 fu 和 hu 之间，嘴唇不要真的咬住。", bullets: ["ひ = hi", "ふ = fu（轻轻吹气）", "へ = he（作助词时读 e）", "ほ = ho"] },
      { id: "takai-example", type: "example", title: "今天可用的一句话", japanese: "このほんはたかいです。", romaji: "Kono hon wa takai desu.", meaning: "这本书很贵。", audioText: "このほんはたかいです" },
      { id: "recognize-fu", type: "multipleChoice", title: "看假名选读音", prompt: "ふ 的读音是？", options: ["fu", "hi", "he", "ho"], answer: "fu", itemId: "fu", itemType: "kana", mode: "recognition" },
      { id: "listen-hi", type: "multipleChoice", title: "听音辨字", prompt: "听发音，选择对应假名。", audioText: "ひ", options: ["ひ", "へ", "ほ", "ふ"], answer: "ひ", itemId: "hi", itemType: "kana", mode: "listening" },
      { id: "kinou-meaning", type: "multipleChoice", title: "词义确认", prompt: "きのう 的意思是？", options: ["昨天", "今天", "明天", "现在"], answer: "昨天", itemId: "sur-t-4", itemType: "vocab", mode: "meaning" },
      { id: "recall-takai", type: "multipleChoice", title: "反向回忆", prompt: "“（价格）贵”用日语怎么说？", options: ["たかい", "やすい", "おおきい", "ちいさい"], answer: "たかい", itemId: "sur-adj-3", itemType: "vocab", mode: "recall" },
      { id: "summary", type: "summary", title: "今天完成", body: "は行补完。现在你能说出“今天/明天/昨天/现在”，还能评价价格贵。", reviewItems: ["ひ/ふ/へ/ほ", "きのう・たかい"], next: "明天补完ま行和や行，学会说“便宜”。" },
    ],
  },
  {
    id: "day-18-ma-ya-complete",
    title: "Day 18：补完ま行、や行",
    subtitle: "み・む・め・も・ゆ・よ 到齐，砍价必备的“便宜”也来了。",
    track: "starter-14",
    order: 18,
    estimatedMinutes: 10,
    prerequisites: ["day-17-ha-row-complete"],
    skillIds: ["kana-seion", "listen-kana", "vocab-survival"],
    newItemIds: [
      { type: "kana", id: "mi" },
      { type: "kana", id: "mu" },
      { type: "kana", id: "me" },
      { type: "kana", id: "mo" },
      { type: "kana", id: "yu" },
      { type: "kana", id: "yo" },
      { type: "vocab", id: "sur-adj-4" },
    ],
    steps: [
      { id: "ma-ya-complete", type: "explain", title: "ま行、や行补完", body: "ま、や 已经认识了。补上 み・む・め・も 和 ゆ・よ。や行只有三个音：や・ゆ・よ，中间两个位置是空的。", bullets: ["み = mi、む = mu", "め = me（注意和 ぬ 区分）", "も = mo", "ゆ = yu、よ = yo"] },
      { id: "yasui-example", type: "example", title: "今天可用的一句话", japanese: "このパンはやすいです。", romaji: "Kono pan wa yasui desu.", meaning: "这个面包很便宜。", audioText: "このパンはやすいです" },
      { id: "recognize-mu", type: "multipleChoice", title: "看假名选读音", prompt: "む 的读音是？", options: ["mu", "mi", "mo", "me"], answer: "mu", itemId: "mu", itemType: "kana", mode: "recognition" },
      { id: "recognize-me", type: "multipleChoice", title: "形近辨认", prompt: "め 的读音是？", options: ["me", "nu", "mo", "mi"], answer: "me", itemId: "me", itemType: "kana", mode: "recognition" },
      { id: "listen-yo", type: "multipleChoice", title: "听音辨字", prompt: "听发音，选择对应假名。", audioText: "よ", options: ["よ", "ゆ", "も", "み"], answer: "よ", itemId: "yo", itemType: "kana", mode: "listening" },
      { id: "type-yasui", type: "typing", title: "主动回忆", prompt: "输入“便宜”的日语假名。", answer: "やすい", hint: "や す い", itemId: "sur-adj-4", itemType: "vocab", mode: "recall" },
      { id: "summary", type: "summary", title: "今天完成", body: "たかい 和 やすい 配成一对，逛街的核心形容词齐了。", reviewItems: ["み/む/め/も", "ゆ/よ", "やすい"], next: "明天是清音的最后一课：ら行、わ、を、ん。" },
    ],
  },
  {
    id: "day-19-ra-wa-n-complete",
    title: "Day 19：清音收官",
    subtitle: "り・る・れ・ろ・わ・を・ん——46 个清音今天全部点亮。",
    track: "starter-14",
    order: 19,
    estimatedMinutes: 12,
    prerequisites: ["day-18-ma-ya-complete"],
    skillIds: ["kana-seion", "listen-kana"],
    newItemIds: [
      { type: "kana", id: "ri" },
      { type: "kana", id: "ru" },
      { type: "kana", id: "re" },
      { type: "kana", id: "ro" },
      { type: "kana", id: "wa" },
      { type: "kana", id: "wo" },
      { type: "kana", id: "n" },
    ],
    steps: [
      { id: "last-seion", type: "explain", title: "最后一批清音", body: "ら 已经认识了，补上 り・る・れ・ろ，再加 わ・を・ん。を 在现代日语里几乎只作宾语助词使用；ん 是唯一不带元音的音。", bullets: ["り/る/れ/ろ", "わ = wa", "を = (w)o，基本只作助词", "ん = n，独占一拍"] },
      { id: "yomu-example", type: "example", title: "今天可用的一句话", japanese: "わたしはほんをよみます。", romaji: "Watashi wa hon o yomimasu.", meaning: "我读书。", audioText: "わたしはほんをよみます" },
      { id: "recognize-ri", type: "multipleChoice", title: "看假名选读音", prompt: "り 的读音是？", options: ["ri", "ru", "re", "ro"], answer: "ri", itemId: "ri", itemType: "kana", mode: "recognition" },
      { id: "listen-wa", type: "multipleChoice", title: "听音辨字", prompt: "听发音，选择对应假名。", audioText: "わ", options: ["わ", "れ", "ろ", "る"], answer: "わ", itemId: "wa", itemType: "kana", mode: "listening" },
      { id: "recognize-n", type: "multipleChoice", title: "特殊的一拍", prompt: "ん 的读音是？", options: ["n", "nu", "no", "na"], answer: "n", itemId: "n", itemType: "kana", mode: "recognition" },
      { id: "dictation-re", type: "dictation", title: "听写一个音", prompt: "听发音，输入对应平假名。", audioText: "れ", answer: "れ", itemId: "re", itemType: "kana", mode: "listening" },
      { id: "summary", type: "summary", title: "46 个清音完成！", body: "从 Day 1 的あ行到今天，平假名清音表已经全部点亮。这是很多自学者从来没走完的一步。", reviewItems: ["り/る/れ/ろ", "わ/を/ん"], next: "明天不学新东西，做一次平假名毕业复习。" },
    ],
  },
  {
    id: "day-20-hiragana-checkpoint",
    title: "Day 20：平假名毕业复习",
    subtitle: "零新内容，纯复习。检验前 19 天的积累。",
    track: "starter-14",
    order: 20,
    estimatedMinutes: 10,
    prerequisites: ["day-19-ra-wa-n-complete"],
    skillIds: ["kana-seion", "listen-kana"],
    newItemIds: [],
    steps: [
      { id: "checkpoint-why", type: "explain", title: "今天只复习，不加新", body: "记忆靠的是重复提取，不是一次学会。今天从前 19 天里抽几个容易混的音自测；做错也没关系，错题会自动进错题本。", bullets: ["做错的项目会进入错题本", "复习页每天会安排到期的假名", "自觉模糊的行，去五十音页再看一遍"] },
      { id: "owari-example", type: "example", title: "给自己一句肯定", japanese: "これでひらがなはおわりです。", romaji: "Kore de hiragana wa owari desu.", meaning: "平假名到此告一段落。", audioText: "これでひらがなはおわりです" },
      { id: "review-so", type: "multipleChoice", title: "复习：さ行", prompt: "そ 的读音是？", options: ["so", "se", "sa", "su"], answer: "so", itemId: "so", itemType: "kana", mode: "recognition" },
      { id: "review-nu", type: "dictation", title: "复习：听写", prompt: "听发音，输入对应平假名。", audioText: "ぬ", answer: "ぬ", itemId: "nu", itemType: "kana", mode: "listening" },
      { id: "review-ho", type: "multipleChoice", title: "复习：は行", prompt: "ほ 的读音是？", options: ["ho", "ha", "he", "hi"], answer: "ho", itemId: "ho", itemType: "kana", mode: "recognition" },
      { id: "review-ashita", type: "typing", title: "复习：主动回忆", prompt: "输入“明天”的日语假名。", answer: "あした", hint: "あ し た", itemId: "sur-t-3", itemType: "vocab", mode: "recall" },
      { id: "summary", type: "summary", title: "毕业复习完成", body: "平假名阶段正式收官。哪怕还有几个字模糊也没关系，SRS 复习会持续帮你巩固。", reviewItems: ["容易混的形：ぬ/め、ね/れ/わ", "复习页会持续安排到期项"], next: "明天开始第二种变化：浊音。" },
    ],
  },
  {
    id: "day-21-dakuon-za-da",
    title: "Day 21：浊音ざ行、だ行",
    subtitle: "两点一加，さ变ざ、た变だ。",
    track: "starter-14",
    order: 21,
    estimatedMinutes: 12,
    prerequisites: ["day-20-hiragana-checkpoint"],
    skillIds: ["kana-dakuon", "listen-kana"],
    newItemIds: [
      { type: "kana", id: "za" },
      { type: "kana", id: "ji" },
      { type: "kana", id: "zu" },
      { type: "kana", id: "ze" },
      { type: "kana", id: "zo" },
      { type: "kana", id: "da" },
      { type: "kana", id: "de" },
      { type: "kana", id: "do" },
    ],
    steps: [
      { id: "dakuon-rule", type: "explain", title: "浊音的规则", body: "在假名右上角加两点（゛），清音就变浊音。你在 Day 5 已经见过 か→が，今天轮到 さ→ざ 和 た→だ。", bullets: ["ざ/じ/ず/ぜ/ぞ", "だ/で/ど（ぢ、づ明天讲）", "じ 的读音是 ji，不是 zi"] },
      { id: "deguchi-example", type: "example", title: "今天可用的一句话", japanese: "ここはでぐちです。", romaji: "Koko wa deguchi desu.", meaning: "这里是出口。", audioText: "ここはでぐちです" },
      { id: "recognize-ji", type: "multipleChoice", title: "看假名选读音", prompt: "じ 的读音是？", options: ["ji", "shi", "chi", "zu"], answer: "ji", itemId: "ji", itemType: "kana", mode: "recognition" },
      { id: "listen-za", type: "multipleChoice", title: "清浊对比", prompt: "听发音，选择对应假名。", audioText: "ざ", options: ["ざ", "さ", "だ", "た"], answer: "ざ", itemId: "za", itemType: "kana", mode: "listening" },
      { id: "dictation-de", type: "dictation", title: "听写一个音", prompt: "听发音，输入对应平假名。", audioText: "で", answer: "で", itemId: "de", itemType: "kana", mode: "listening" },
      { id: "recognize-do", type: "multipleChoice", title: "再认一个", prompt: "ど 的读音是？", options: ["do", "to", "da", "de"], answer: "do", itemId: "do", itemType: "kana", mode: "recognition" },
      { id: "summary", type: "summary", title: "今天完成", body: "ざ行、だ行到手。です、でぐち、どこ 这些高频词现在都能拆读了。", reviewItems: ["ざ/じ/ず/ぜ/ぞ", "だ/で/ど"], next: "明天补完浊音：ば行和罕见的 ぢ・づ。" },
    ],
  },
  {
    id: "day-22-dakuon-ba-complete",
    title: "Day 22：浊音收官",
    subtitle: "ば行加上罕见的 ぢ・づ，浊音全部完成。",
    track: "starter-14",
    order: 22,
    estimatedMinutes: 12,
    prerequisites: ["day-21-dakuon-za-da"],
    skillIds: ["kana-dakuon", "listen-kana"],
    newItemIds: [
      { type: "kana", id: "ba" },
      { type: "kana", id: "bi" },
      { type: "kana", id: "bu" },
      { type: "kana", id: "be" },
      { type: "kana", id: "bo" },
      { type: "kana", id: "di" },
      { type: "kana", id: "du" },
    ],
    steps: [
      { id: "ba-row-rule", type: "explain", title: "は→ば，最后两个特例", body: "は行加两点变ば行。另外还有两个特例：ぢ 和 づ。它们的读音在现代日语里和 じ、ず 相同，出现频率很低，认识即可。", bullets: ["ば/び/ぶ/べ/ぼ", "ぢ ≈ じ（ji）", "づ ≈ ず（zu）", "半浊音ぱ行你在 Day 6 已经学过"] },
      { id: "tabemono-example", type: "example", title: "今天可用的一句话", japanese: "たべものがだいすきです。", romaji: "Tabemono ga daisuki desu.", meaning: "我非常喜欢食物。", audioText: "たべものがだいすきです" },
      { id: "recognize-bu", type: "multipleChoice", title: "看假名选读音", prompt: "ぶ 的读音是？", options: ["bu", "fu", "pu", "bo"], answer: "bu", itemId: "bu", itemType: "kana", mode: "recognition" },
      { id: "listen-ba", type: "multipleChoice", title: "三向辨音", prompt: "听发音，选择对应假名。", audioText: "ば", options: ["ば", "ぱ", "は", "だ"], answer: "ば", itemId: "ba", itemType: "kana", mode: "listening" },
      { id: "recognize-di", type: "multipleChoice", title: "特例确认", prompt: "ぢ 在现代日语里的读音和哪个假名相同？", options: ["じ", "ず", "ち", "し"], answer: "じ", itemId: "di", itemType: "kana", mode: "recognition" },
      { id: "dictation-bo", type: "dictation", title: "听写一个音", prompt: "听发音，输入对应平假名。", audioText: "ぼ", answer: "ぼ", itemId: "bo", itemType: "kana", mode: "listening" },
      { id: "summary", type: "summary", title: "浊音全部完成", body: "清音、浊音、半浊音都齐了。平假名世界只剩最后一块拼图：拗音。", reviewItems: ["ば/び/ぶ/べ/ぼ", "ぢ≈じ、づ≈ず"], next: "明天开始拗音：きゃ、しゃ 这些“小写组合音”。" },
    ],
  },
  {
    id: "day-23-yoon-kya-sha",
    title: "Day 23：拗音入门",
    subtitle: "小小的 ゃゅょ 把两个假名捏成一拍。今天先学 きゃ行、しゃ行。",
    track: "starter-14",
    order: 23,
    estimatedMinutes: 12,
    prerequisites: ["day-22-dakuon-ba-complete"],
    skillIds: ["kana-yoon", "listen-kana", "vocab-survival"],
    newItemIds: [
      { type: "kana", id: "kya" },
      { type: "kana", id: "kyu" },
      { type: "kana", id: "kyo" },
      { type: "kana", id: "sha" },
      { type: "kana", id: "shu" },
      { type: "kana", id: "sho" },
      { type: "vocab", id: "sur-t-2" },
    ],
    steps: [
      { id: "yoon-rule", type: "explain", title: "拗音的规则", body: "い段假名（き、し、ち…）后面接小写的 ゃ/ゅ/ょ，两个字合成一拍。きょ 是一拍，きよ 是两拍——这是拗音最容易错的地方。", bullets: ["き + ゃ = きゃ（kya）", "し + ゅ = しゅ（shu）", "小写ょ贴在右下角", "きょう（今天）就是拗音 + 长音"] },
      { id: "kyou-example", type: "example", title: "今天可用的一句话", japanese: "きょうはいいてんきです。", romaji: "Kyou wa ii tenki desu.", meaning: "今天天气真好。", audioText: "きょうはいいてんきです" },
      { id: "recognize-kyo", type: "multipleChoice", title: "一拍还是两拍", prompt: "きょ 的读音是？", options: ["kyo", "kiyo", "ko", "kyu"], answer: "kyo", itemId: "kyo", itemType: "kana", mode: "recognition" },
      { id: "listen-sha", type: "multipleChoice", title: "听音辨字", prompt: "听发音，选择对应假名。", audioText: "しゃ", options: ["しゃ", "さ", "しゅ", "し"], answer: "しゃ", itemId: "sha", itemType: "kana", mode: "listening" },
      { id: "kyou-meaning", type: "multipleChoice", title: "词义确认", prompt: "きょう 的意思是？", options: ["今天", "明天", "昨天", "现在"], answer: "今天", itemId: "sur-t-2", itemType: "vocab", mode: "meaning" },
      { id: "dictation-sho", type: "dictation", title: "听写拗音", prompt: "听发音，输入对应平假名（两个字）。", audioText: "しょ", answer: "しょ", itemId: "sho", itemType: "kana", mode: "listening" },
      { id: "summary", type: "summary", title: "今天完成", body: "拗音规则一通百通：任何い段假名加小写ゃゅょ都是同样读法。", reviewItems: ["きゃ/きゅ/きょ", "しゃ/しゅ/しょ", "きょう"], next: "明天继续 ちゃ行、じゃ行，并学会点茶。" },
    ],
  },
  {
    id: "day-24-yoon-cha-ja",
    title: "Day 24：拗音进阶",
    subtitle: "ちゃ行、じゃ行到手，剩下的拗音按同样规则读。",
    track: "starter-14",
    order: 24,
    estimatedMinutes: 12,
    prerequisites: ["day-23-yoon-kya-sha"],
    skillIds: ["kana-yoon", "listen-kana", "vocab-survival"],
    newItemIds: [
      { type: "kana", id: "cha" },
      { type: "kana", id: "chu" },
      { type: "kana", id: "cho" },
      { type: "kana", id: "ja" },
      { type: "kana", id: "ju" },
      { type: "kana", id: "jo" },
      { type: "vocab", id: "sur-f-9" },
    ],
    steps: [
      { id: "cha-ja-rule", type: "explain", title: "ちゃ行和じゃ行", body: "ち + ゃ = ちゃ（cha），じ + ゃ = じゃ（ja）。おちゃ（茶）、じゃあね（拜拜）里都有它们。剩下的にゃ、ひゃ、みゃ、りゃ等按完全相同的规则读，去五十音页认一遍即可。", bullets: ["ちゃ/ちゅ/ちょ", "じゃ/じゅ/じょ", "长音：おかあさん 里的 あ 拉长一拍"] },
      { id: "ocha-example", type: "example", title: "今天可用的一句话", japanese: "おちゃをのみます。", romaji: "Ocha o nomimasu.", meaning: "喝茶。", audioText: "おちゃをのみます" },
      { id: "recognize-cha", type: "multipleChoice", title: "看假名选读音", prompt: "ちゃ 的读音是？", options: ["cha", "chiya", "ja", "cho"], answer: "cha", itemId: "cha", itemType: "kana", mode: "recognition" },
      { id: "listen-ju", type: "multipleChoice", title: "听音辨字", prompt: "听发音，选择对应假名。", audioText: "じゅ", options: ["じゅ", "じょ", "ちゅ", "じ"], answer: "じゅ", itemId: "ju", itemType: "kana", mode: "listening" },
      { id: "ocha-meaning", type: "multipleChoice", title: "词义确认", prompt: "おちゃ 的意思是？", options: ["茶", "咖啡", "水", "牛奶"], answer: "茶", itemId: "sur-f-9", itemType: "vocab", mode: "meaning" },
      { id: "recognize-jo", type: "multipleChoice", title: "再认一个", prompt: "じょ 的读音是？", options: ["jo", "ja", "cho", "yo"], answer: "jo", itemId: "jo", itemType: "kana", mode: "recognition" },
      { id: "summary", type: "summary", title: "拗音掌握", body: "拗音的核心行学完了。从明天起进入片假名——好消息是：读音你全都会，只是换一套字形。", reviewItems: ["ちゃ/ちゅ/ちょ", "じゃ/じゅ/じょ", "おちゃ"], next: "明天开始片假名第一课：ア行到サ行。" },
    ],
  },
  {
    id: "day-25-katakana-a-so",
    title: "Day 25：片假名 I（ア〜ソ）",
    subtitle: "同样的音，换一套“直线感”的字形。咖啡和巴士这些外来词靠它。",
    track: "starter-14",
    order: 25,
    estimatedMinutes: 12,
    prerequisites: ["day-24-yoon-cha-ja"],
    skillIds: ["kana-seion", "listen-kana", "vocab-survival"],
    newItemIds: [
      { type: "vocab", id: "sur-f-10" },
      { type: "vocab", id: "sur-tr-5" },
    ],
    steps: [
      { id: "katakana-why", type: "explain", title: "片假名是什么", body: "每个平假名都有一个对应的片假名，读音完全相同，主要用来写外来语：コーヒー（咖啡）、バス（巴士）。片假名笔画更直、更有棱角。今天先认 ア行、カ行、サ行。", bullets: ["ア/イ/ウ/エ/オ = あ/い/う/え/お", "カ/キ/ク/ケ/コ = か行", "サ/シ/ス/セ/ソ = さ行", "读音不用重学，只认字形"] },
      { id: "coffee-example", type: "example", title: "今天可用的一句话", japanese: "コーヒーをください。", romaji: "Koohii o kudasai.", meaning: "请给我咖啡。", audioText: "コーヒーをください" },
      { id: "katakana-a", type: "multipleChoice", title: "片假名认读", prompt: "ア 对应的平假名是？", options: ["あ", "い", "う", "え"], answer: "あ", itemId: "a", itemType: "kana", mode: "recognition" },
      { id: "katakana-ka", type: "multipleChoice", title: "片假名认读", prompt: "カ 的读音是？", options: ["ka", "ki", "ku", "ke"], answer: "ka", itemId: "ka", itemType: "kana", mode: "recognition" },
      { id: "coffee-meaning", type: "multipleChoice", title: "词义确认", prompt: "コーヒー 的意思是？", options: ["咖啡", "茶", "可乐", "牛奶"], answer: "咖啡", itemId: "sur-f-10", itemType: "vocab", mode: "meaning" },
      { id: "katakana-shi", type: "multipleChoice", title: "形近警报", prompt: "シ 对应的平假名是？", options: ["し", "つ", "そ", "さ"], answer: "し", itemId: "shi", itemType: "kana", mode: "recognition" },
      { id: "summary", type: "summary", title: "今天完成", body: "片假名前三行认完。シ 和 ツ 的区别明天专门对付。", reviewItems: ["ア行/カ行/サ行", "コーヒー・バス"], next: "明天继续 タ行到ホ行，重点对付形近字。" },
    ],
  },
  {
    id: "day-26-katakana-ta-ho",
    title: "Day 26：片假名 II（タ〜ホ）",
    subtitle: "对付最容易搞混的 シ/ツ，顺便学会找厕所。",
    track: "starter-14",
    order: 26,
    estimatedMinutes: 12,
    prerequisites: ["day-25-katakana-a-so"],
    skillIds: ["kana-seion", "listen-kana", "vocab-survival"],
    newItemIds: [
      { type: "vocab", id: "sur-tr-6" },
      { type: "vocab", id: "sur-n-34" },
    ],
    steps: [
      { id: "shi-tsu-trap", type: "explain", title: "タ行到ホ行 + 形近陷阱", body: "今天认 タ行、ナ行、ハ行。重点是两组形近字：シ（笔画偏横，像笑脸）和 ツ（笔画偏竖，像皱眉）；ソ 和 ン 同理。", bullets: ["タ/チ/ツ/テ/ト", "ナ/ニ/ヌ/ネ/ノ", "ハ/ヒ/フ/ヘ/ホ", "シ vs ツ：横笑竖皱"] },
      { id: "toilet-example", type: "example", title: "今天可用的一句话", japanese: "トイレはどこですか。", romaji: "Toire wa doko desu ka.", meaning: "厕所在哪里？", audioText: "トイレはどこですか" },
      { id: "katakana-tsu", type: "multipleChoice", title: "形近辨认", prompt: "ツ 对应的平假名是？", options: ["つ", "し", "そ", "ん"], answer: "つ", itemId: "tsu", itemType: "kana", mode: "recognition" },
      { id: "katakana-to", type: "multipleChoice", title: "片假名认读", prompt: "ト 的读音是？", options: ["to", "ta", "te", "ho"], answer: "to", itemId: "to", itemType: "kana", mode: "recognition" },
      { id: "takushii-meaning", type: "multipleChoice", title: "词义确认", prompt: "タクシー 的意思是？", options: ["出租车", "巴士", "电车", "自行车"], answer: "出租车", itemId: "sur-tr-6", itemType: "vocab", mode: "meaning" },
      { id: "toire-meaning", type: "multipleChoice", title: "词义确认", prompt: "トイレ 的意思是？", options: ["厕所", "车站", "商店", "医院"], answer: "厕所", itemId: "sur-n-34", itemType: "vocab", mode: "meaning" },
      { id: "summary", type: "summary", title: "今天完成", body: "旅行场景最重要的两个片假名词（タクシー、トイレ）已经拿下。", reviewItems: ["タ行/ナ行/ハ行", "シvsツ、ソvsン"], next: "明天片假名收官：マ行到ン，加上长音符号ー。" },
    ],
  },
  {
    id: "day-27-katakana-ma-n",
    title: "Day 27：片假名收官（マ〜ン）",
    subtitle: "认完最后一批片假名，搞懂长音符号「ー」。",
    track: "starter-14",
    order: 27,
    estimatedMinutes: 12,
    prerequisites: ["day-26-katakana-ta-ho"],
    skillIds: ["kana-seion", "listen-kana", "vocab-survival"],
    newItemIds: [
      { type: "vocab", id: "sur-d-36" },
    ],
    steps: [
      { id: "katakana-final", type: "explain", title: "最后一批片假名", body: "マ行、ヤ行、ラ行、ワ、ヲ、ン。片假名里还有一个专属符号：长音符ー，表示把前一个音拉长一拍，コーヒー 里就有两个。", bullets: ["マ/ミ/ム/メ/モ", "ヤ/ユ/ヨ、ラ行、ワ/ヲ/ン", "ー = 前一个音拉长一拍", "ン vs ソ：又一对形近字"] },
      { id: "tv-example", type: "example", title: "今天可用的一句话", japanese: "よるはテレビをみます。", romaji: "Yoru wa terebi o mimasu.", meaning: "晚上看电视。", audioText: "よるはテレビをみます" },
      { id: "katakana-ma", type: "multipleChoice", title: "片假名认读", prompt: "マ 对应的平假名是？", options: ["ま", "も", "む", "ぬ"], answer: "ま", itemId: "ma", itemType: "kana", mode: "recognition" },
      { id: "katakana-n", type: "multipleChoice", title: "形近辨认", prompt: "ン 对应的平假名是？", options: ["ん", "そ", "つ", "し"], answer: "ん", itemId: "n", itemType: "kana", mode: "recognition" },
      { id: "terebi-meaning", type: "multipleChoice", title: "词义确认", prompt: "テレビ 的意思是？", options: ["电视", "电话", "电脑", "收音机"], answer: "电视", itemId: "sur-d-36", itemType: "vocab", mode: "meaning" },
      { id: "chouon-rule", type: "multipleChoice", title: "长音符号", prompt: "「コーヒー」里的「ー」表示什么？", options: ["把前一个音拉长一拍", "停顿一拍", "重读", "变成浊音"], answer: "把前一个音拉长一拍", itemId: "sur-f-10", itemType: "vocab", mode: "recognition" },
      { id: "summary", type: "summary", title: "假名系统全部完成！", body: "平假名、片假名、浊音、拗音、长音——日语的两套字母你都认识了。接下来把精力转向句型。", reviewItems: ["マ行〜ン", "长音符ー"], next: "明天学习表达愿望：たい 和 ましょう。" },
    ],
  },
  {
    id: "day-28-tai-mashou",
    title: "Day 28：想做什么，就说出来",
    subtitle: "用 〜たい 表达想做的事，用 〜ましょう 发出邀请。",
    track: "starter-14",
    order: 28,
    estimatedMinutes: 12,
    prerequisites: ["day-27-katakana-ma-n"],
    skillIds: ["grammar-n5", "verbs-conjugation", "vocab-survival"],
    newItemIds: [
      { type: "grammar", id: "n5-tai" },
      { type: "grammar", id: "n5-mashou" },
      { type: "vocab", id: "sur-adj-18" },
    ],
    steps: [
      { id: "tai-rule", type: "explain", title: "两个开口就能用的句尾", body: "把动词的 ます 去掉换成 たい，就是“想做”：たべます→たべたい。换成 ましょう，就是“一起做吧”：いきます→いきましょう。", bullets: ["たべたい = 想吃", "のみたい = 想喝", "いきましょう = 一起去吧", "たい 后面还可以接 です 更礼貌"] },
      { id: "tai-example", type: "example", title: "今天可用的一句话", japanese: "すしをたべたいです。", romaji: "Sushi o tabetai desu.", meaning: "我想吃寿司。", audioText: "すしをたべたいです" },
      { id: "tai-choice", type: "multipleChoice", title: "句型确认", prompt: "“想吃”用日语怎么说？", options: ["たべたい", "たべます", "たべましょう", "たべません"], answer: "たべたい", itemId: "n5-tai", itemType: "grammar", mode: "recognition" },
      { id: "mashou-choice", type: "multipleChoice", title: "句型确认", prompt: "提议“一起喝吧”应该用哪个结尾？", options: ["のみましょう", "のみたい", "のみます", "のみません"], answer: "のみましょう", itemId: "n5-mashou", itemType: "grammar", mode: "recognition" },
      { id: "oishii-meaning", type: "multipleChoice", title: "词义确认", prompt: "おいしい 的意思是？", options: ["好吃", "难吃", "贵", "便宜"], answer: "好吃", itemId: "sur-adj-18", itemType: "vocab", mode: "meaning" },
      { id: "build-mashou", type: "sentenceBuild", title: "组句", prompt: "组出“一起去吧”。", chunks: ["いきましょう", "いっしょに"], answer: "いっしょにいきましょう", meaning: "一起去吧。", itemId: "sentence-issho-ni-ikimashou", itemType: "sentence", mode: "production" },
      { id: "summary", type: "summary", title: "今天完成", body: "たい 和 ましょう 是把日语从“应答”变成“主动表达”的第一步。", reviewItems: ["〜たい = 想做", "〜ましょう = 一起吧", "おいしい"], next: "明天学过去时 ました，把昨天的事讲出来。" },
    ],
  },
  {
    id: "day-29-mashita-kara-made",
    title: "Day 29：讲昨天的事",
    subtitle: "过去时 ました，加上 から〜まで 的时间范围。",
    track: "starter-14",
    order: 29,
    estimatedMinutes: 12,
    prerequisites: ["day-28-tai-mashou"],
    skillIds: ["grammar-n5", "verbs-conjugation", "particles-basic"],
    newItemIds: [
      { type: "grammar", id: "n5-mashita" },
      { type: "grammar", id: "n5-kara" },
      { type: "grammar", id: "n5-made" },
    ],
    steps: [
      { id: "mashita-rule", type: "explain", title: "过去时和时间范围", body: "把 ます 换成 ました 就是过去时：いきます→いきました。要说“从几点到几点”，用 から（从）和 まで（到）。", bullets: ["たべました = 吃了", "9じから = 从 9 点", "5じまで = 到 5 点", "きのう〜ました = 昨天做了"] },
      { id: "mashita-example", type: "example", title: "今天可用的一句话", japanese: "きのう、9じから5じまでべんきょうしました。", romaji: "Kinou, ku-ji kara go-ji made benkyou shimashita.", meaning: "昨天从 9 点学习到 5 点。", audioText: "きのう、9じから5じまでべんきょうしました" },
      { id: "mashita-choice", type: "multipleChoice", title: "句型确认", prompt: "“昨天去了”用日语怎么说？", options: ["いきました", "いきます", "いきたい", "いきません"], answer: "いきました", itemId: "n5-mashita", itemType: "grammar", mode: "recognition" },
      { id: "kara-choice", type: "multipleChoice", title: "助词确认", prompt: "“从 9 点”应该用哪个助词？", options: ["から", "まで", "に", "で"], answer: "から", itemId: "n5-kara", itemType: "grammar", mode: "recognition" },
      { id: "made-choice", type: "multipleChoice", title: "助词确认", prompt: "“到 5 点”应该用哪个助词？", options: ["まで", "から", "を", "へ"], answer: "まで", itemId: "n5-made", itemType: "grammar", mode: "recognition" },
      { id: "build-kinou", type: "sentenceBuild", title: "组句", prompt: "组出“昨天学习了”。", chunks: ["しました", "きのう", "べんきょう"], answer: "きのうべんきょうしました", meaning: "昨天学习了。", itemId: "sentence-kinou-benkyou", itemType: "sentence", mode: "production" },
      { id: "summary", type: "summary", title: "今天完成", body: "现在你能报告过去发生的事，还能给它加上时间范围。", reviewItems: ["〜ました = 过去时", "から〜まで"], next: "明天是 30 天的毕业综合课。" },
    ],
  },
  {
    id: "day-30-graduation",
    title: "Day 30：毕业综合课",
    subtitle: "零新内容。把 30 天学到的假名、词汇、句型串起来做一次全面检验。",
    track: "starter-14",
    order: 30,
    estimatedMinutes: 15,
    prerequisites: ["day-29-mashita-kara-made"],
    skillIds: ["kana-seion", "kana-dakuon", "kana-yoon", "vocab-survival", "particles-basic", "grammar-n5"],
    newItemIds: [],
    steps: [
      { id: "graduation-review", type: "explain", title: "30 天走到这里", body: "你已经掌握：全部平假名和片假名、浊音拗音长音、约 50 个生存词汇、十几条 N5 句型。今天做一次综合检验，然后带着自己的节奏继续。", bullets: ["做错的题会进错题本", "每天先清空复习队列，再学新内容", "词汇页可以关掉罗马音训练裸读", "技能树页会推荐下一个薄弱环节"] },
      { id: "graduation-example", type: "example", title: "送你一句话", japanese: "まいにちすこしずつべんきょうしましょう。", romaji: "Mainichi sukoshi zutsu benkyou shimashou.", meaning: "每天一点点地学习吧。", audioText: "まいにちすこしずつべんきょうしましょう" },
      { id: "final-particle", type: "multipleChoice", title: "综合：助词", prompt: "「わたしはあさごはん＿たべます」里应该填什么？", options: ["を", "で", "が", "に"], answer: "を", explanation: "たべる 的直接宾语用 を 标记。", itemId: "n5-wo", itemType: "grammar", mode: "recognition" },
      { id: "final-dictation", type: "dictation", title: "综合：听写", prompt: "听发音，输入完整假名。", audioText: "ありがとうございます", answer: "ありがとうございます", itemId: "sur-g-5", itemType: "vocab", mode: "listening" },
      { id: "final-build", type: "sentenceBuild", title: "综合：组句", prompt: "组出“明天也来”。", chunks: ["きます", "も", "あした"], answer: "あしたもきます", meaning: "明天也来。", itemId: "sentence-ashita-mo-kimasu", itemType: "sentence", mode: "production" },
      { id: "final-meaning", type: "multipleChoice", title: "综合：词义", prompt: "おいしい 的意思是？", options: ["好吃", "有趣", "快", "新"], answer: "好吃", itemId: "sur-adj-18", itemType: "vocab", mode: "meaning" },
      { id: "summary", type: "summary", title: "30 天入门完成！", body: "这不是终点：接下来用技能树选择方向，用测验扩展词汇和语法，用复习页守住已有的记忆。日语学习的引擎已经启动了。", reviewItems: ["每天清空复习队列", "技能树推荐下一步", "错题本是你的私人弱点清单"], next: "去技能树页看看推荐的下一步吧。" },
    ],
  },
]

export const STARTER_LESSON_BY_ID = Object.fromEntries(STARTER_LESSONS.map((lesson) => [lesson.id, lesson])) as Record<string, Lesson>

export function getLessonById(id: string) {
  return STARTER_LESSON_BY_ID[id] ?? null
}

export function getNextLesson(completedLessonIds: Set<string>) {
  return STARTER_LESSONS.find((lesson) => !completedLessonIds.has(lesson.id)) ?? null
}

export function getLessonSummary(lessonId: string) {
  const lesson = getLessonById(lessonId)
  if (!lesson) return null
  const summary = lesson.steps.find((step): step is SummaryStep => step.type === "summary")
  return summary ?? null
}

export function isPracticeStep(step: LessonStep): step is ChoiceStep | TypingStep | DictationStep | SentenceBuildStep {
  return step.type === "multipleChoice" || step.type === "typing" || step.type === "dictation" || step.type === "sentenceBuild"
}
