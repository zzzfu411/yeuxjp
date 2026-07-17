export interface Example {
  japanese: string;
  romaji: string;
  meaning: string;
}

export interface GrammarPracticeTemplate {
  id: string;
  prompt: string;
  answer: string;
  options?: string[];
}

export type Level = 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'Anime'; // Added Anime Level

export interface GrammarPoint {
  id: string;
  title: string;
  structure: string;
  explanation: string;
  examples: Example[];
  level: Level;
  plainExplanation?: string;
  patternParts?: string[];
  pitfalls?: string[];
  practiceTemplates?: GrammarPracticeTemplate[];
  relatedVocabIds?: string[];
  lessonIds?: string[];
  prerequisites?: string[];
}

interface GrammarPracticeSet {
  grammarId: string;
  practiceTemplates: GrammarPracticeTemplate[];
}

const grammarPracticeData = {
  n5GrammarPracticeSets: [
    {
      grammarId: "n5-wa",
      practiceTemplates: [{ id: "topic-particle", prompt: "私は___学生です。主题助词应填哪一个？", answer: "は", options: ["は", "が", "を", "で"] }],
    },
    {
      grammarId: "n5-desu",
      practiceTemplates: [{ id: "polite-copula", prompt: "これは本___。礼貌地判断“这是书”应填什么？", answer: "です", options: ["です", "だ", "ます", "でした"] }],
    },
    {
      grammarId: "n5-da",
      practiceTemplates: [{ id: "plain-copula", prompt: "今日は休み___。对朋友使用简体判断时应填什么？", answer: "だ", options: ["だ", "です", "ます", "か"] }],
    },
    {
      grammarId: "n5-ka",
      practiceTemplates: [{ id: "question-particle", prompt: "これはお茶です___。礼貌疑问句句尾应填什么？", answer: "か", options: ["か", "ね", "よ", "を"] }],
    },
    {
      grammarId: "n5-no",
      practiceTemplates: [{ id: "possession-particle", prompt: "これは私___本です。表示“我的书”应填什么？", answer: "の", options: ["の", "は", "を", "で"] }],
    },
    {
      grammarId: "n5-wo",
      practiceTemplates: [{ id: "object-particle", prompt: "パン___食べます。标记动作对象应填什么？", answer: "を", options: ["を", "に", "が", "で"] }],
    },
    {
      grammarId: "n5-ni-loc",
      practiceTemplates: [{ id: "existence-location", prompt: "部屋___猫がいます。标记存在地点应填什么？", answer: "に", options: ["に", "で", "を", "へ"] }],
    },
    {
      grammarId: "n5-de-action",
      practiceTemplates: [{ id: "action-location", prompt: "図書館___勉強します。标记动作发生地点应填什么？", answer: "で", options: ["で", "に", "を", "が"] }],
    },
    {
      grammarId: "n5-e",
      practiceTemplates: [{ id: "direction-particle", prompt: "東京___行きます。标记移动方向应填什么？", answer: "へ", options: ["へ", "を", "で", "が"] }],
    },
    {
      grammarId: "n5-to",
      practiceTemplates: [{ id: "companion-particle", prompt: "友達___映画を見ます。表示“和朋友一起”应填什么？", answer: "と", options: ["と", "の", "へ", "が"] }],
    },
    {
      grammarId: "n5-ga",
      practiceTemplates: [{ id: "existence-subject", prompt: "机の上に本___あります。标记存在的事物应填什么？", answer: "が", options: ["が", "を", "で", "へ"] }],
    },
    {
      grammarId: "n5-mo",
      practiceTemplates: [{ id: "also-particle", prompt: "田中さんが行きます。私___行きます。表示“我也去”应填什么？", answer: "も", options: ["も", "を", "に", "と"] }],
    },
    {
      grammarId: "n5-kara",
      practiceTemplates: [{ id: "starting-point", prompt: "9時___働きます。表示“从九点开始”应填什么？", answer: "から", options: ["から", "まで", "へ", "を"] }],
    },
    {
      grammarId: "n5-made",
      practiceTemplates: [{ id: "ending-point", prompt: "5時___働きます。表示“工作到五点”应填什么？", answer: "まで", options: ["まで", "から", "に", "で"] }],
    },
    {
      grammarId: "n5-masu",
      practiceTemplates: [{ id: "polite-present", prompt: "毎日日本語を勉強し___。礼貌地陈述日常习惯应填什么？", answer: "ます", options: ["ます", "ません", "ました", "たい"] }],
    },
    {
      grammarId: "n5-masen",
      practiceTemplates: [{ id: "polite-negative", prompt: "肉を食べ___。礼貌地表达“不吃”应填什么？", answer: "ません", options: ["ません", "ます", "ました", "ましょう"] }],
    },
    {
      grammarId: "n5-mashita",
      practiceTemplates: [{ id: "polite-past", prompt: "昨日映画を見___。礼貌地表达过去动作应填什么？", answer: "ました", options: ["ました", "ます", "ません", "たい"] }],
    },
    {
      grammarId: "n5-nai",
      practiceTemplates: [{ id: "plain-negative", prompt: "今日は行か___。使用简体否定应填什么？", answer: "ない", options: ["ない", "ます", "たい", "た"] }],
    },
    {
      grammarId: "n5-ta",
      practiceTemplates: [{ id: "plain-past", prompt: "もう食べ___。使用简体过去形应填什么？", answer: "た", options: ["た", "て", "ない", "ます"] }],
    },
    {
      grammarId: "n5-te",
      practiceTemplates: [{ id: "request-connector", prompt: "ちょっと待っ___ください。提出请求时应填什么？", answer: "て", options: ["て", "た", "ない", "ます"] }],
    },
    {
      grammarId: "n5-arimasu",
      practiceTemplates: [{ id: "inanimate-existence", prompt: "机の上に本が___。非生物“存在”应使用什么？", answer: "あります", options: ["あります", "います", "します", "行きます"] }],
    },
    {
      grammarId: "n5-imasu",
      practiceTemplates: [{ id: "animate-existence", prompt: "教室に先生が___。人“存在”应使用什么？", answer: "います", options: ["います", "あります", "します", "行きます"] }],
    },
    {
      grammarId: "n5-tai",
      practiceTemplates: [{ id: "desire-form", prompt: "日本へ行き___です。表达“想去日本”应填什么？", answer: "たい", options: ["たい", "ます", "ました", "ません"] }],
    },
    {
      grammarId: "n5-mashou",
      practiceTemplates: [{ id: "polite-volitional", prompt: "一緒に帰り___。礼貌地提议“一起回去吧”应填什么？", answer: "ましょう", options: ["ましょう", "ます", "ません", "ました"] }],
    },
    {
      grammarId: "n5-ya",
      practiceTemplates: [{ id: "partial-list", prompt: "本___雑誌などを買いました。表示不完全列举应填什么？", answer: "や", options: ["や", "と", "を", "が"] }],
    },
  ] satisfies GrammarPracticeSet[],
};

const n5GrammarPracticeById = new Map(
  grammarPracticeData.n5GrammarPracticeSets.map((set) => [set.grammarId, set.practiceTemplates])
);

const grammarDataSource: Record<Level, GrammarPoint[]> = {
  // --- N5 (基础生存) ---
  N5: [
    { id: "n5-wa", title: "主题: は (Wa)", structure: "N + は", explanation: "标记主题。", plainExplanation: "「は」把一个词立为话题，后面的内容都是在说明它，相当于“要说……的话”。", pitfalls: ["作助词时读 wa，不读 ha", "「は」谈论已知话题；第一次引入新事物用「が」"], examples: [{ japanese: "私は学生です。", romaji: "Watashi wa gakusei desu.", meaning: "我是学生。" }], level: "N5" },
    { id: "n5-desu", title: "判断: です (Desu)", structure: "N/Adj + です", explanation: "标准断定。", plainExplanation: "名词或形容词后面加 です，句子就成了礼貌的“是……/很……”。", pitfalls: ["い形容词后也直接加 です：おいしいです", "变成简体时，名词和な形容词把 です 换成 だ；い形容词只去掉 です：高いです→高い"], examples: [{ japanese: "私は学生です。", romaji: "Watashi wa gakusei desu.", meaning: "我是学生。" }, { japanese: "この本は高いです。", romaji: "Kono hon wa takai desu.", meaning: "这本书很贵。" }], level: "N5" },
    { id: "n5-da", title: "简体判断: だ (Da)", structure: "N/Adj-na + だ", explanation: "简体断定。", plainExplanation: "だ 是 です 的简体版，朋友之间或自言自语时用。", pitfalls: ["对长辈或陌生人用 だ 会显得失礼", "い形容词后面不能加 だ：×おいしいだ"], examples: [{ japanese: "今日は雨だ。", romaji: "Kyou wa ame da.", meaning: "今天下雨。" }], level: "N5" },
    { id: "n5-ka", title: "疑问: か (Ka)", structure: "S + か", explanation: "疑问句。", plainExplanation: "句尾加一个 か，陈述句就变成问句，不需要改变语序。", pitfalls: ["有 か 的礼貌问句一般不再写问号", "简体口语常直接用升调代替 か"], examples: [{ japanese: "これはお茶ですか。", romaji: "Kore wa ocha desu ka.", meaning: "这是茶吗？" }], level: "N5" },
    { id: "n5-no", title: "所属: の (No)", structure: "N1 + の + N2", explanation: "表示所属。", plainExplanation: "A の B 就是“A 的 B”，语序和中文“的”完全一样。", pitfalls: ["名词修饰名词必须加 の：日本語の本", "答句里可以省略重复的名词：私のです（是我的）"], examples: [{ japanese: "これは私の傘です。", romaji: "Kore wa watashi no kasa desu.", meaning: "这是我的伞。" }], level: "N5" },
    { id: "n5-wo", title: "宾语: を (Wo)", structure: "O + を + V", explanation: "动作对象。", plainExplanation: "を 标记动作直接作用的东西：吃“什么”、看“什么”、买“什么”。", pitfalls: ["を 读作 o，打字时输入 wo", "すき/きらい 的对象用 が，不用 を"], examples: [{ japanese: "パンを食べます。", romaji: "Pan o tabemasu.", meaning: "吃面包。" }], level: "N5" },
    { id: "n5-ni-loc", title: "存在: に (Ni)", structure: "Place + に + いる/ある", explanation: "存在的场所。", plainExplanation: "表示“在哪里存在”：某人/某物待在哪里，用 に。", pitfalls: ["做动作的场所用 で：図書館で読みます vs 図書館にいます", "具体时刻也用 に：7時に起きます"], examples: [{ japanese: "部屋に猫がいます。", romaji: "Heya ni neko ga imasu.", meaning: "房间里有猫。" }], level: "N5" },
    { id: "n5-de-action", title: "场所: で (De)", structure: "Place + で + V", explanation: "动作的场所。", plainExplanation: "で 标记“在哪里做事”：动作发生的地点。", pitfalls: ["存在用 に，动作用 で", "で 还能表示手段/工具：バスで行きます（坐巴士去）"], examples: [{ japanese: "図書館で勉強します。", romaji: "Toshokan de benkyou shimasu.", meaning: "在图书馆学习。" }], level: "N5" },
    { id: "n5-e", title: "方向: へ (E)", structure: "Place + へ", explanation: "移动方向。", plainExplanation: "へ 表示移动的方向，“往……去”。", pitfalls: ["作助词时读 e，不读 he", "多数场合可以和 に 互换：東京に行きます 也对"], examples: [{ japanese: "東京へ行きます。", romaji: "Toukyou e ikimasu.", meaning: "去东京。" }], level: "N5" },
    { id: "n5-to", title: "和: と (To)", structure: "N + と", explanation: "并列或伴随。", plainExplanation: "と 就是“和”：连接两个名词（A和B），或表示和某人一起做事。", pitfalls: ["列举不完全时用 や：本や雑誌（书啊杂志之类）", "「あう（见面）」的标准搭配是 に：友達に会います"], examples: [{ japanese: "友達と映画を見ます。", romaji: "Tomodachi to eiga o mimasu.", meaning: "和朋友看电影。" }], level: "N5" },
    { id: "n5-ga", title: "主语: が (Ga)", structure: "S + が", explanation: "强调主语或对象。", plainExplanation: "が 用来引入新信息或强调“是谁/是什么”：存在句和疑问词主语都用它。", pitfalls: ["疑问词做主语必须用 が：だれが来ますか", "すき/じょうず/ほしい 的对象也用 が"], examples: [{ japanese: "机の上に本があります。", romaji: "Tsukue no ue ni hon ga arimasu.", meaning: "桌上有书。" }], level: "N5" },
    { id: "n5-mo", title: "也: も (Mo)", structure: "N + も", explanation: "类推。", plainExplanation: "も 就是“也”，直接放在 は/が 的位置上。", pitfalls: ["も 替换 は/が，不能叠用：×私はも", "否定句里的 も 表示“也不/都不”：何もありません"], examples: [{ japanese: "私も行きます。", romaji: "Watashi mo ikimasu.", meaning: "我也去。" }], level: "N5" },
    { id: "n5-kara", title: "从/因为: から (Kara)", structure: "N/S + から", explanation: "起点或原因。", plainExplanation: "接名词表示起点“从……”；接句子表示原因“因为……”。", pitfalls: ["时间和地点都能用：9時から、駅から", "表示原因时接在句尾：高いですから、買いません"], examples: [{ japanese: "9時から働きます。", romaji: "Ku-ji kara hatarakimasu.", meaning: "从九点开始工作。" }], level: "N5" },
    { id: "n5-made", title: "直到: まで (Made)", structure: "N + まで", explanation: "终点。", plainExplanation: "まで 表示终点“到……为止”，经常和 から 成对出现。", pitfalls: ["までに 是“在……之前（截止）”，和 まで（一直持续到）意思不同"], examples: [{ japanese: "5時まで働きます。", romaji: "Go-ji made hatarakimasu.", meaning: "工作到五点。" }], level: "N5" },
    { id: "n5-masu", title: "敬语动词: ます (Masu)", structure: "V-stem + ます", explanation: "礼貌体。", plainExplanation: "动词的 ます形是礼貌的现在/将来时。跟任何人开口，用它最安全。", pitfalls: ["ます形表示习惯或将来，不表示“正在做”", "后续变化都基于词干：去掉 ます 再接 たい/ましょう"], examples: [{ japanese: "毎日日本語を勉強します。", romaji: "Mainichi nihongo o benkyou shimasu.", meaning: "每天学日语。" }], level: "N5" },
    { id: "n5-masen", title: "敬语否定: ません (Masen)", structure: "V-stem + ません", explanation: "礼貌否定。", plainExplanation: "把 ます 换成 ません，就是礼貌的“不……”。", pitfalls: ["ませんか 是邀请：“要不要一起……？”：一緒に行きませんか"], examples: [{ japanese: "肉を食べません。", romaji: "Niku o tabemasen.", meaning: "不吃肉。" }], level: "N5" },
    { id: "n5-mashita", title: "敬语过去: ました (Mashita)", structure: "V-stem + ました", explanation: "礼貌过去。", plainExplanation: "把 ます 换成 ました，就是礼貌的“……了”。", pitfalls: ["过去否定是 ませんでした：行きませんでした"], examples: [{ japanese: "昨日映画を見ました。", romaji: "Kinou eiga o mimashita.", meaning: "昨天看了电影。" }], level: "N5" },
    { id: "n5-nai", title: "简体否定: ない (Nai)", structure: "V-nai", explanation: "普通体否定。", plainExplanation: "ない形是简体否定，朋友之间说“不……”。", pitfalls: ["五段动词词尾变到あ段再加 ない：行く→行かない", "ある 的否定就是 ない 本身，不是 あらない"], examples: [{ japanese: "今日は行かない。", romaji: "Kyou wa ikanai.", meaning: "今天不去。" }], level: "N5" },
    { id: "n5-ta", title: "简体过去: た (Ta)", structure: "V-ta", explanation: "普通体过去。", plainExplanation: "た形是简体过去时，变形分组和 て形完全相同：て 换成 た，で 换成 だ（読んで→読んだ）。", pitfalls: ["先掌握 て形，再按 て→た、で→だ 转换", "た形还用于经验：行ったことがあります（去过）"], examples: [{ japanese: "もう食べた。", romaji: "Mou tabeta.", meaning: "已经吃了。" }], level: "N5" },
    { id: "n5-te", title: "连接: て (Te)", structure: "V-te", explanation: "动作相继或请求。", plainExplanation: "て形是万能连接器：连接动作（吃了再去）、发出请求（てください）、表示进行（ています）。", pitfalls: ["五段动词分组变化：く→いて、ぐ→いで、す→して、む/ぶ/ぬ→んで、う/つ/る→って", "行く 是特例：行って（不是 行いて）"], examples: [{ japanese: "ちょっと待ってください。", romaji: "Chotto matte kudasai.", meaning: "请稍等。" }], level: "N5" },
    { id: "n5-arimasu", title: "有(物): ある/あります", structure: "N + が + あります", explanation: "非生物存在。", plainExplanation: "没有生命的东西“存在/有”，用 あります。", pitfalls: ["人和动物用 います，东西用 あります", "否定是 ありません"], examples: [{ japanese: "机の上に本があります。", romaji: "Tsukue no ue ni hon ga arimasu.", meaning: "桌上有书。" }], level: "N5" },
    { id: "n5-imasu", title: "有(人): いる/います", structure: "N + が + います", explanation: "生物存在。", plainExplanation: "人和动物“存在/在”，用 います。", pitfalls: ["植物虽然是活的，但用 あります", "说“有兄弟姐妹”也用 います：兄がいます"], examples: [{ japanese: "教室に先生がいます。", romaji: "Kyoushitsu ni sensei ga imasu.", meaning: "教室里有老师。" }], level: "N5" },
    { id: "n5-tai", title: "想做: たい (Tai)", structure: "V-stem + たい", explanation: "第一人称愿望。", plainExplanation: "ます形词干加 たい，表示“想做……”；后面接 です 更礼貌。", pitfalls: ["たい 只用于说自己（或直接问对方）；说别人想要用 たがっています", "たい 按い形容词变化：行きたくない（不想去）"], examples: [{ japanese: "日本へ行きたいです。", romaji: "Nihon e ikitai desu.", meaning: "想去日本。" }], level: "N5" },
    { id: "n5-mashou", title: "吧: ましょう (Mashou)", structure: "V-stem + ましょう", explanation: "提议。", plainExplanation: "ましょう 表示“（我们）一起……吧”，向对方发出提议。", pitfalls: ["ましょうか 可以表示“我来帮你……吧？”", "更委婉的邀请用 ませんか"], examples: [{ japanese: "一緒に帰りましょう。", romaji: "Issho ni kaerimashou.", meaning: "一起回家吧。" }], level: "N5" },
    { id: "n5-ya", title: "列举: や (Ya)", structure: "A や B", explanation: "不完全列举。", plainExplanation: "や 列举几样有代表性的，暗示“还有别的”；と 则是完整列举。", pitfalls: ["AやB 表示不止 A 和 B；AとB 就只有这两样", "常和 など 搭配：本や雑誌など"], examples: [{ japanese: "本や雑誌を買いました。", romaji: "Hon ya zasshi o kaimashita.", meaning: "买了书和杂志（等）。" }], level: "N5" }
  ],

  // --- N4 (日常基础) ---
  N4: [
    { id: "n4-te-iru", title: "正在/状态: ている (Te iru)", structure: "V-te + いる", explanation: "正在进行或状态持续。", examples: [{ japanese: "生きている。", romaji: "Ikite iru.", meaning: "还活着。" }], level: "N4" },
    { id: "n4-te-kudasai", title: "请求: てください (Te kudasai)", structure: "V-te + ください", explanation: "请做某事。", examples: [{ japanese: "助けてください。", romaji: "Tasukete kudasai.", meaning: "请救救我。" }], level: "N4" },
    { id: "n4-nai-de", title: "禁止: ないで (Naide)", structure: "V-nai + で", explanation: "请不要做。", examples: [{ japanese: "死なないで。", romaji: "Shinanaide.", meaning: "不要死。" }], level: "N4" },
    { id: "n4-koto-ga-dekiru", title: "能力: ことができる (Dekiru)", structure: "V-dict + ことができる", explanation: "能做某事。", examples: [{ japanese: "空を飛ぶことができる。", romaji: "Sora o tobu koto ga dekiru.", meaning: "能飞。" }], level: "N4" },
    { id: "n4-hou-ga-ii", title: "建议: ほうがいい (Hou ga ii)", structure: "V-ta/nai + ほうがいい", explanation: "最好做/不做。", examples: [{ japanese: "逃げたほうがいい。", romaji: "Nigeta hou ga ii.", meaning: "最好快逃。" }], level: "N4" },
    { id: "n4-ndesu", title: "强调: んです (Ndesu)", structure: "Plain + んです", explanation: "解释说明。", examples: [{ japanese: "負けられないんです。", romaji: "Makerarenai ndesu.", meaning: "我不能输啊。" }], level: "N4" },
    { id: "n4-nakereba", title: "必须: なければならない", structure: "V-nai + ければ", explanation: "必须做。", examples: [{ japanese: "行かなければならない。", romaji: "Ikanakereba naranai.", meaning: "必须去。" }], level: "N4" },
    { id: "n4-tara", title: "如果: たら (Tara)", structure: "V-ta + たら", explanation: "假定条件。", examples: [{ japanese: "もし俺が死んだら...", romaji: "Moshi ore ga shindara...", meaning: "如果我死了..." }], level: "N4" },
    { id: "n4-ba", title: "假如: ば (Ba)", structure: "V-ba", explanation: "条件形。", examples: [{ japanese: "力があれば...", romaji: "Chikara ga areba...", meaning: "如果有力量的话..." }], level: "N4" },
    { id: "n4-nara", title: "若是: なら (Nara)", structure: "N + なら", explanation: "承接话题。", examples: [{ japanese: "お前ならできる。", romaji: "Omae nara dekiru.", meaning: "如果是你的话能做到。" }], level: "N4" },
    { id: "n4-volitional", title: "意志: 意向形 (Volitional)", structure: "V-ou", explanation: "想做，吧。", examples: [{ japanese: "パーティーやろうぜ！", romaji: "Paatii yarou ze!", meaning: "开派对吧！" }], level: "N4" },
    { id: "n4-passive", title: "被动: 受身 (Passive)", structure: "V-rareru", explanation: "被做。", examples: [{ japanese: "裏切られた。", romaji: "Uragirareta.", meaning: "被背叛了。" }], level: "N4" },
    { id: "n4-causative", title: "使役: 使役 (Causative)", structure: "V-saseru", explanation: "让做。", examples: [{ japanese: "行かせてくれ。", romaji: "Ikasetekure.", meaning: "让我去。" }], level: "N4" },
    { id: "n4-ageru", title: "给: あげる (Ageru)", structure: "V-te + あげる", explanation: "为别人做。", examples: [{ japanese: "守ってあげる。", romaji: "Mamotte ageru.", meaning: "我会保护你。" }], level: "N4" },
    { id: "n4-kureru", title: "给我: くれる (Kureru)", structure: "V-te + くれる", explanation: "别人为我做。", examples: [{ japanese: "愛してくれてありがとう。", romaji: "Aishite kurete arigatou.", meaning: "谢谢你爱我。" }], level: "N4" },
    { id: "n4-morau", title: "得到: もらう (Morau)", structure: "V-te + もらう", explanation: "请别人做。", examples: [{ japanese: "仲間に助けてもらった。", romaji: "Nakama ni tasukete moratta.", meaning: "伙伴救了我。" }], level: "N4" },
    { id: "n4-shi-shi", title: "又..又: し (Shi)", structure: "Plain + し", explanation: "列举原因。", examples: [{ japanese: "強いし、優しいし。", romaji: "Tsuyoi shi, yasashii shi.", meaning: "又强又温柔。" }], level: "N4" },
    { id: "n4-sou", title: "听说: そう (Sou)", structure: "Plain + そう", explanation: "传闻。", examples: [{ japanese: "あいつが来るそうだ。", romaji: "Aitsu ga kuru sou da.", meaning: "听说那家伙要来。" }], level: "N4" },
    { id: "n4-mitai", title: "像: みたい (Mitai)", structure: "N + みたい", explanation: "比喻。", examples: [{ japanese: "バカみたい。", romaji: "Baka mitai.", meaning: "像个笨蛋。" }], level: "N4" },
    { id: "n4-tsumori", title: "打算: つもり (Tsumori)", structure: "V-dict + つもり", explanation: "主观打算。", examples: [{ japanese: "本気でやるつもりか？", romaji: "Honki de yaru tsumori ka?", meaning: "你是认真的吗？" }], level: "N4" }
  ],

  // --- N3 (情感与逻辑) ---
  N3: [
    { id: "n3-sae", title: "甚至: さえ (Sae)", structure: "N + さえ", explanation: "极端例子。", examples: [{ japanese: "名前さえ忘れた。", romaji: "Namae sae wasureta.", meaning: "连名字都忘了。" }], level: "N3" },
    { id: "n3-bakari", title: "光是: ばかり (Bakari)", structure: "V-te + ばかり", explanation: "净是做某事。", examples: [{ japanese: "逃げてばかりだ。", romaji: "Nigete bakari da.", meaning: "光是逃跑。" }], level: "N3" },
    { id: "n3-wake-ga-nai", title: "不可能: わけがない", structure: "Plain + わけがない", explanation: "绝无可能。", examples: [{ japanese: "負けるわけがない。", romaji: "Makeru wake ga nai.", meaning: "绝不可能输。" }], level: "N3" },
    { id: "n3-hazu", title: "理应: はず (Hazu)", structure: "Plain + はず", explanation: "推测。", examples: [{ japanese: "あいつなら勝てるはずだ。", romaji: "Aitsu nara kateru hazu da.", meaning: "是他的话应该能赢。" }], level: "N3" },
    { id: "n3-you-ni", title: "为了: ように (You ni)", structure: "V-dict + ように", explanation: "目的/祈祷。", examples: [{ japanese: "世界が平和になるように。", romaji: "Sekai ga heiwa ni naru you ni.", meaning: "祈祷世界和平。" }], level: "N3" },
    { id: "n3-te-shimau", title: "完了/遗憾: てしまう", structure: "V-te + しまう", explanation: "彻底做完或搞砸了。", examples: [{ japanese: "バレてしまった。", romaji: "Barete shimatta.", meaning: "暴露了。" }], level: "N3" },
    { id: "n3-koto-ni-suru", title: "决定: ことにする", structure: "V-dict + ことにする", explanation: "主观决定。", examples: [{ japanese: "今日から海賊をやることにした。", romaji: "Kyou kara kaizoku o yaru koto ni shita.", meaning: "决定从今天开始当海盗。" }], level: "N3" },
    { id: "n3-rashii", title: "像样: らしい (Rashii)", structure: "N + らしい", explanation: "典型的样子。", examples: [{ japanese: "男らしい。", romaji: "Otokorashii.", meaning: "有男子气概。" }], level: "N3" },
    { id: "n3-ppoi", title: "倾向: っぽい (Ppoi)", structure: "N + っぽい", explanation: "有某种特质（常含贬义）。", examples: [{ japanese: "嘘っぽい。", romaji: "Usoppoi.", meaning: "像是在撒谎。" }], level: "N3" },
    { id: "n3-tabi-ni", title: "每当: たびに (Tabi ni)", structure: "V-dict + たびに", explanation: "每次。", examples: [{ japanese: "戦うたびに強くなる。", romaji: "Tatakau tabi ni tsuyoku naru.", meaning: "每次战斗都会变强。" }], level: "N3" },
    { id: "n3-nitsuite", title: "关于: について", structure: "N + について", explanation: "关于。", examples: [{ japanese: "世界について知りたい。", romaji: "Sekai ni tsuite shiritai.", meaning: "想知道关于这个世界的事。" }], level: "N3" },
    { id: "n3-mama", title: "保持: まま (Mama)", structure: "V-ta + まま", explanation: "维持原状。", examples: [{ japanese: "そのままでいい。", romaji: "Sono mama de ii.", meaning: "那样就好。" }], level: "N3" },
    { id: "n3-kiru", title: "极致: きる (Kiru)", structure: "V-stem + きる", explanation: "彻底/极限。", examples: [{ japanese: "信じきっている。", romaji: "Shinjikitte iru.", meaning: "深信不疑。" }], level: "N3" },
    { id: "n3-kake", title: "做到一半: かけ (Kake)", structure: "V-stem + かけ", explanation: "未完成。", examples: [{ japanese: "飲みかけのコーラ。", romaji: "Nomikake no koora.", meaning: "喝了一半的可乐。" }], level: "N3" },
    { id: "n3-saserareru", title: "被迫: させられる", structure: "V-saserareru", explanation: "使役被动。", examples: [{ japanese: "待たされたな。", romaji: "Matasareta na.", meaning: "让我好等啊（被迫等了）。" }], level: "N3" },
    { id: "n3-tokoro", title: "正当: ところ (Tokoro)", structure: "V + ところ", explanation: "时间点。", examples: [{ japanese: "逃げるところだ。", romaji: "Nigeru tokoro da.", meaning: "正要逃跑。" }], level: "N3" },
    { id: "n3-okage", title: "托福: おかげ (Okage)", structure: "Plain + おかげ", explanation: "感谢原因。", examples: [{ japanese: "お前のおかげだ。", romaji: "Omae no okage da.", meaning: "多亏了你。" }], level: "N3" },
    { id: "n3-seide", title: "都怪: せいで (Seide)", structure: "Plain + せいで", explanation: "归咎原因。", examples: [{ japanese: "貴様のせいで！", romaji: "Kisama no sei de!", meaning: "都怪你！" }], level: "N3" },
    { id: "n3-totte", title: "对于: にとって", structure: "N + にとって", explanation: "立场。", examples: [{ japanese: "俺にとっての宝だ。", romaji: "Ore ni totte no takara da.", meaning: "对我是宝物。" }], level: "N3" },
    { id: "n3-chigainai", title: "一定: に違いない", structure: "Plain + に違いない", explanation: "确信。", examples: [{ japanese: "罠に違いない。", romaji: "Wana ni chigainai.", meaning: "一定是陷阱。" }], level: "N3" }
  ],

  // --- N2 (严肃与战斗) ---
  N2: [
    { id: "n2-temo", title: "即使: ても (Temo)", structure: "V-te + も", explanation: "逆接条件。", examples: [{ japanese: "世界を敵に回しても。", romaji: "Sekai o teki ni mawashite mo.", meaning: "即使与世界为敌。" }], level: "N2" },
    { id: "n2-zuni", title: "不...就: ずに (Zuni)", structure: "V-nai + ずに", explanation: "不做某事而...", examples: [{ japanese: "何も言わずに去った。", romaji: "Nani mo iwazu ni satta.", meaning: "什么都没说就离开了。" }], level: "N2" },
    { id: "n2-monoka", title: "绝不: ものか (Monoka)", structure: "Plain + ものか", explanation: "强烈否定。", examples: [{ japanese: "負けるものか！", romaji: "Makeru mono ka!", meaning: "我怎么可能输！" }], level: "N2" },
    { id: "n2-ageku", title: "结果: あげく (Ageku)", structure: "V-ta + あげく", explanation: "坏结果。", examples: [{ japanese: "迷ったあげく、間違えた。", romaji: "Mayotta ageku, machigaeta.", meaning: "犹豫半天最后选错了。" }], level: "N2" },
    { id: "n2-kuse-ni", title: "明明: くせに (Kuseni)", structure: "Plain + くせに", explanation: "责怪。", examples: [{ japanese: "弱いくせに。", romaji: "Yowai kuse ni.", meaning: "明明那么弱。" }], level: "N2" },
    { id: "n2-bakari-ka", title: "不但: ばかりか", structure: "Plain + ばかりか", explanation: "不仅...而且。", examples: [{ japanese: "金ばかりか、命まで。", romaji: "Kane bakari ka, inochi made.", meaning: "不仅是钱，连命都..." }], level: "N2" },
    { id: "n2-shidai", title: "立刻: 次第 (Shidai)", structure: "V-stem + 次第", explanation: "一...就...", examples: [{ japanese: "分かり次第連絡する。", romaji: "Wakari shidai renraku suru.", meaning: "一弄明白就联系。" }], level: "N2" },
    { id: "n2-gachi", title: "容易: がち (Gachi)", structure: "V-stem + がち", explanation: "负面倾向。", examples: [{ japanese: "諦めがちだ。", romaji: "Akirame gachi da.", meaning: "容易放弃。" }], level: "N2" },
    { id: "n2-koto-wanai", title: "不用: ことはない", structure: "V-dict + ことはない", explanation: "没必要。", examples: [{ japanese: "恐れることはない。", romaji: "Osoreru koto wa nai.", meaning: "没必要害怕。" }], level: "N2" },
    { id: "n2-mai", title: "不再/不会: まい (Mai)", structure: "V-dict + まい", explanation: "否定意志。", examples: [{ japanese: "二度と迷うまい。", romaji: "Nido to mayou mai.", meaning: "决不再迷茫。" }], level: "N2" },
    { id: "n2-nu", title: "不: ぬ (Nu)", structure: "V-nai + ぬ", explanation: "古风否定。", examples: [{ japanese: "知らぬ存ぜぬ。", romaji: "Shiranu zonzenu.", meaning: "一问三不知。" }], level: "N2" },
    { id: "n2-zaruenai", title: "不得不: ざるを得ない", structure: "V-nai + ざるを得ない", explanation: "被迫。", examples: [{ japanese: "戦わざるを得ない。", romaji: "Tatakawazaru o enai.", meaning: "不得不战。" }], level: "N2" },
    { id: "n2-yara", title: "啦...啦: やら", structure: "A やら B やら", explanation: "杂乱列举。", examples: [{ japanese: "嘘やら本当やら。", romaji: "Uso yara hontou yara.", meaning: "谎言真话混杂。" }], level: "N2" },
    { id: "n2-shikanai", title: "只有: しかない", structure: "V-dict + しかない", explanation: "别无他法。", examples: [{ japanese: "やるしかない。", romaji: "Yaru shika nai.", meaning: "只有干了。" }], level: "N2" },
    { id: "n2-sae-ba", title: "只要: さえ～ば", structure: "N + さえ～ば", explanation: "唯一条件。", examples: [{ japanese: "君さえいれば。", romaji: "Kimi sae ireba.", meaning: "只要有你在。" }], level: "N2" }
  ],

  // --- N1 (极道与哲学) ---
  N1: [
    { id: "n1-nari", title: "一..就: なり (Nari)", structure: "V-dict + なり", explanation: "突发。", examples: [{ japanese: "見るなり斬りかかった。", romaji: "Miru nari kirikakatta.", meaning: "一见面就砍过来了。" }], level: "N1" },
    { id: "n1-gotoki", title: "如/像: ごとき (Gotoki)", structure: "N + ごとき", explanation: "轻蔑/比喻。", examples: [{ japanese: "お前ごときに！", romaji: "Omae gotoki ni!", meaning: "像你这种家伙！" }], level: "N1" },
    { id: "n1-zaru", title: "不: ざる (Zaru)", structure: "V-nai + ざる", explanation: "定语否定。", examples: [{ japanese: "見えざる敵。", romaji: "Miezaru teki.", meaning: "看不见的敌人。" }], level: "N1" },
    { id: "n1-beshi", title: "应该: べし (Beshi)", structure: "V-dict + べし", explanation: "古风命令/义务。", examples: [{ japanese: "死すべし。", romaji: "Shisu beshi.", meaning: "去死吧（应死）。" }], level: "N1" },
    { id: "n1-majiki", title: "不该: まじき (Majiki)", structure: "V-dict + まじき", explanation: "禁止/不当。", examples: [{ japanese: "許すまじき行為。", romaji: "Yurusu majiki koui.", meaning: "不可原谅的行为。" }], level: "N1" },
    { id: "n1-tari", title: "作为: たり (Tari)", structure: "N + たり", explanation: "身份。", examples: [{ japanese: "王たりうる者。", romaji: "Ou tariuru mono.", meaning: "能成为王的人。" }], level: "N1" },
    { id: "n1-suru", title: "即使: としたところで", structure: "Plain + としたところで", explanation: "让步。", examples: [{ japanese: "後悔したところで遅い。", romaji: "Koukai shita tokoro de osoi.", meaning: "即使后悔也晚了。" }], level: "N1" },
    { id: "n1-yuen", title: "原因: 所以 (Yuen)", structure: "N + の所以", explanation: "理由。", examples: [{ japanese: "これが強さの所以だ。", romaji: "Kore ga tsuyosa no yuen da.", meaning: "这就是强的原因。" }], level: "N1" },
    { id: "n1-danjite", title: "断然: 断じて (Danjite)", structure: "Adverb", explanation: "绝对。", examples: [{ japanese: "断じて否！", romaji: "Danjite ina!", meaning: "绝对不行！" }], level: "N1" },
    { id: "n1-sobakara", title: "刚..就: そばから", structure: "V-dict + そばから", explanation: "徒劳重复。", examples: [{ japanese: "治すそばから傷つく。", romaji: "Naosu soba kara kizutsuku.", meaning: "刚治好就又受伤。" }], level: "N1" }
  ],

  // --- Anime/Colloquial (动漫口语黑话) ---
  Anime: [
    { id: "ani-chatta", title: "糟糕/完了: ～ちゃった", structure: "V-te + ちゃった", explanation: "てしまった的口语缩略。表示遗憾或动作完成。动漫里极其常用。", examples: [{ japanese: "食べちゃった。", romaji: "Tabechatta.", meaning: "不小心吃掉了。" }, { japanese: "好きになっちゃった。", romaji: "Suki ni nacchatta.", meaning: "不知不觉喜欢上了。" }], level: "Anime" },
    { id: "ani-nakya", title: "必须: ～なきゃ", structure: "V-nai + なきゃ", explanation: "なければならない的缩略。必须做。", examples: [{ japanese: "行かなきゃ。", romaji: "Ikanakya.", meaning: "我得走了。" }, { japanese: "守らなきゃ。", romaji: "Mamoranakya.", meaning: "必须守护。" }], level: "Anime" },
    { id: "ani-jan", title: "不是嘛/挺..嘛: ～じゃん", structure: "Plain + じゃん", explanation: "不是...吗？或者表示发现、评价。横滨方言演变而来。", examples: [{ japanese: "いいじゃん！", romaji: "Ii jan!", meaning: "挺好嘛！" }, { japanese: "お前、強いじゃん。", romaji: "Omae, tsuyoi jan.", meaning: "你这不是挺强的嘛。" }], level: "Anime" },
    { id: "ani-ze", title: "男性语气: ～ぜ", structure: "Sentence + ぜ", explanation: "粗鲁、帅气的男性终助词。强调告知。", examples: [{ japanese: "行くぜ！", romaji: "Iku ze!", meaning: "上啊！/走咯！" }, { japanese: "面白くなってきたぜ。", romaji: "Omoshiroku natte kita ze.", meaning: "变得有趣起来了啊。" }], level: "Anime" },
    { id: "ani-zo", title: "警告/决心: ～ぞ", structure: "Sentence + ぞ", explanation: "强烈的断定或自我暗示。比ぜ更严肃。", examples: [{ japanese: "海賊王になるぞ！", romaji: "Kaizokuou ni naru zo!", meaning: "我要成为海贼王！" }, { japanese: "殺すぞ。", romaji: "Korosu zo.", meaning: "杀了你哦。" }], level: "Anime" },
    { id: "ani-daro", title: "是吧: ～だろ", structure: "Plain + だろ", explanation: "でしょう的粗鲁说法。寻求同意或推测。", examples: [{ japanese: "お前もそう思うだろ？", romaji: "Omae mo sou omou daro?", meaning: "你也这么想吧？" }], level: "Anime" },
    { id: "ani-su", title: "敷衍敬语: ～っす", structure: "Sentence + っす", explanation: "体育会系或不良少年常用的简化敬语。把です/ます简化为っす。", examples: [{ japanese: "ちわっす！", romaji: "Chiwa-ssu!", meaning: "你好！（Konnichiwa简化）" }, { japanese: "マジっすか？", romaji: "Maji-ssu ka?", meaning: "真的假的？" }], level: "Anime" },
    { id: "ani-yagaru", title: "轻蔑: ～やがる", structure: "V-stem + やがる", explanation: "极其粗鲁地描述对方动作。表示憎恶。", examples: [{ japanese: "逃げやがった。", romaji: "Nigeyagatta.", meaning: "那混蛋逃跑了。" }, { japanese: "調子に乗ってんじゃねーよ。", romaji: "Choushi ni notten ja nee yo.", meaning: "少得意忘形了。（～てんじゃねー＝～ているのではない）" }], level: "Anime" },
    { id: "ani-nee", title: "否定: ～ねえ", structure: "V-nai (ai -> ee)", explanation: "ない的粗鲁读音。Ai音变为Ee。", examples: [{ japanese: "知らねえよ。", romaji: "Shiranee yo.", meaning: "我哪知道啊。" }, { japanese: "関係ねえ。", romaji: "Kankei nee.", meaning: "没关系/不关我事。" }], level: "Anime" },
    { id: "ani-temee", title: "你: てめぇ", structure: "Pronoun", explanation: "极其粗鲁的“你”。", examples: [{ japanese: "てめぇは誰だ！", romaji: "Temee wa dare da!", meaning: "你这混蛋是谁！" }], level: "Anime" },
    { id: "ani-kure", title: "命令: ～くれ", structure: "V-te + くれ", explanation: "ください的命令形。给我做...", examples: [{ japanese: "待ってくれ！", romaji: "Matte kure!", meaning: "等等我！" }], level: "Anime" },
    { id: "ani-mon", title: "撒娇/辩解: ～もん", structure: "Plain + もん", explanation: "因为...嘛。常用于借口或撒娇。", examples: [{ japanese: "だって、怖いんだもん。", romaji: "Datte, kowai nda mon.", meaning: "可是，人家怕嘛。" }], level: "Anime" },
    { id: "ani-kashira", title: "女性疑问: ～かしら", structure: "Sentence + かしら", explanation: "女性自问自答或委婉提问。", examples: [{ japanese: "あら、そうかしら？", romaji: "Ara, sou kashira?", meaning: "哎呀，是那样吗？" }], level: "Anime" },
    { id: "ani-wa", title: "女性语气: ～わ", structure: "Sentence + わ", explanation: "女性终助词，表示轻微的决意或感叹。但在关西弁中男性也用。", examples: [{ japanese: "私、行くわ。", romaji: "Watashi, iku wa.", meaning: "我要走了。" }], level: "Anime" },
    { id: "ani-tatte", title: "即使: ～たって", structure: "V-ta + って", explanation: "ても的口语。", examples: [{ japanese: "何言ったって無駄だ。", romaji: "Nani ittatte muda da.", meaning: "说什么都没用。" }], level: "Anime" }
  ]
};

export const grammarData: Record<Level, GrammarPoint[]> = {
  ...grammarDataSource,
  N5: grammarDataSource.N5.map((point) => ({
    ...point,
    practiceTemplates: n5GrammarPracticeById.get(point.id) ?? point.practiceTemplates,
  })),
};
