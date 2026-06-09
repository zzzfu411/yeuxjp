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
      { id: "summary", type: "summary", title: "14 天入门完成", body: "你已经拥有一条真正的学习闭环：每天新学一点、做输出练习、记录掌握度、回到复习流巩固。", reviewItems: ["すみません", "これをください", "ありがとう"], next: "接下来可以继续扩展 core-80 词汇和 N5 句型。" },
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
