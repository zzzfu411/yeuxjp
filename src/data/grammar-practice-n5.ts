import type { GrammarPracticeSet } from "./grammar-practice-types"

export const n5GrammarPracticeSets: GrammarPracticeSet[] = [
    {
      grammarId: "n5-wa",
      practiceTemplates: [
        { id: "topic-particle", prompt: "私は___学生です。主题助词应填哪一个？", answer: "は", options: ["は", "が", "を", "で"] },
        { id: "topic-today", prompt: "今日___日曜日です。标记话题应填什么？", answer: "は", options: ["は", "を", "へ", "と"] },
        { id: "topic-name", prompt: "名前___田中です。自我介绍时标记话题应填什么？", answer: "は", options: ["は", "が", "に", "の"] },
      ],
    },
    {
      grammarId: "n5-desu",
      practiceTemplates: [
        { id: "polite-copula", prompt: "これは本___。礼貌地判断“这是书”应填什么？", answer: "です", options: ["です", "だ", "ます", "でした"] },
        { id: "polite-copula-person", prompt: "田中さんは先生___。礼貌判断应填什么？", answer: "です", options: ["です", "だ", "ます", "か"] },
        { id: "polite-copula-adj", prompt: "この部屋は広い___。礼貌地描述应填什么？", answer: "です", options: ["です", "だ", "でした", "ます"] },
      ],
    },
    {
      grammarId: "n5-da",
      practiceTemplates: [
        { id: "plain-copula", prompt: "今日は休み___。对朋友使用简体判断时应填什么？", answer: "だ", options: ["だ", "です", "ます", "か"] },
        { id: "plain-copula-person", prompt: "彼は学生___。对朋友说“他是学生”应填什么？", answer: "だ", options: ["だ", "です", "ます", "の"] },
        { id: "plain-copula-weather", prompt: "今日は晴れ___。简体判断应填什么？", answer: "だ", options: ["だ", "です", "ました", "たい"] },
      ],
    },
    {
      grammarId: "n5-ka",
      practiceTemplates: [
        { id: "question-particle", prompt: "これはお茶です___。礼貌疑问句句尾应填什么？", answer: "か", options: ["か", "ね", "よ", "を"] },
        { id: "question-identity", prompt: "あなたは学生です___。礼貌疑问句尾应填什么？", answer: "か", options: ["か", "ね", "よ", "だ"] },
        { id: "question-time", prompt: "今、何時です___。询问时间的句尾应填什么？", answer: "か", options: ["か", "を", "に", "も"] },
      ],
    },
    {
      grammarId: "n5-no",
      practiceTemplates: [
        { id: "possession-particle", prompt: "これは私___本です。表示“我的书”应填什么？", answer: "の", options: ["の", "は", "を", "で"] },
        { id: "possession-school", prompt: "これは学校___本です。表示“学校的书”应填什么？", answer: "の", options: ["の", "は", "が", "を"] },
        { id: "possession-bag", prompt: "田中さん___かばんです。表示所属应填什么？", answer: "の", options: ["の", "と", "へ", "で"] },
      ],
    },
    {
      grammarId: "n5-wo",
      practiceTemplates: [
        { id: "object-particle", prompt: "パン___食べます。标记动作对象应填什么？", answer: "を", options: ["を", "に", "が", "で"] },
        { id: "object-watch", prompt: "テレビ___見ます。标记动作对象应填什么？", answer: "を", options: ["を", "に", "が", "で"] },
        { id: "object-drink", prompt: "水___飲みます。标记宾语应填什么？", answer: "を", options: ["を", "は", "と", "へ"] },
      ],
    },
    {
      grammarId: "n5-ni-loc",
      practiceTemplates: [
        { id: "existence-location", prompt: "部屋___猫がいます。标记存在地点应填什么？", answer: "に", options: ["に", "で", "を", "へ"] },
        { id: "existence-school", prompt: "学校___先生がいます。标记存在地点应填什么？", answer: "に", options: ["に", "で", "を", "が"] },
        { id: "existence-bag", prompt: "かばん___本があります。标记存在地点应填什么？", answer: "に", options: ["に", "で", "へ", "と"] },
      ],
    },
    {
      grammarId: "n5-de-action",
      practiceTemplates: [
        { id: "action-location", prompt: "図書館___勉強します。标记动作发生地点应填什么？", answer: "で", options: ["で", "に", "を", "が"] },
        { id: "action-park", prompt: "公園___遊びます。标记动作发生地点应填什么？", answer: "で", options: ["で", "に", "を", "へ"] },
        { id: "action-home", prompt: "家___ご飯を食べます。标记做事的场所应填什么？", answer: "で", options: ["で", "が", "と", "の"] },
      ],
    },
    {
      grammarId: "n5-e",
      practiceTemplates: [
        { id: "direction-particle", prompt: "東京___行きます。标记移动方向应填什么？", answer: "へ", options: ["へ", "を", "で", "が"] },
        { id: "direction-school", prompt: "学校___行きます。标记移动方向应填什么？", answer: "へ", options: ["へ", "を", "で", "が"] },
        { id: "direction-home", prompt: "うち___帰ります。标记回家的方向应填什么？", answer: "へ", options: ["へ", "を", "と", "も"] },
      ],
    },
    {
      grammarId: "n5-to",
      practiceTemplates: [
        { id: "companion-particle", prompt: "友達___映画を見ます。表示“和朋友一起”应填什么？", answer: "と", options: ["と", "の", "へ", "が"] },
        { id: "companion-family", prompt: "家族___旅行します。表示“和家人一起”应填什么？", answer: "と", options: ["と", "の", "へ", "を"] },
        { id: "complete-list", prompt: "パン___牛乳を買いました。完整列举“面包和牛奶”应填什么？", answer: "と", options: ["と", "や", "で", "に"] },
      ],
    },
    {
      grammarId: "n5-ga",
      practiceTemplates: [
        { id: "existence-subject", prompt: "机の上に本___あります。标记存在的事物应填什么？", answer: "が", options: ["が", "を", "で", "へ"] },
        { id: "who-subject", prompt: "だれ___来ますか。疑问词做主语应填什么？", answer: "が", options: ["が", "は", "を", "で"] },
        { id: "like-object", prompt: "猫___すきです。すき的对象应填什么？", answer: "が", options: ["が", "を", "で", "へ"] },
      ],
    },
    {
      grammarId: "n5-mo",
      practiceTemplates: [
        { id: "also-particle", prompt: "田中さんが行きます。私___行きます。表示“我也去”应填什么？", answer: "も", options: ["も", "を", "に", "と"] },
        { id: "also-student", prompt: "田中さんは学生です。山田さん___学生です。表示“也”应填什么？", answer: "も", options: ["も", "は", "が", "を"] },
        { id: "also-negative", prompt: "コーヒーを飲みません。紅茶___飲みません。表示“也不”应填什么？", answer: "も", options: ["も", "を", "に", "で"] },
      ],
    },
    {
      grammarId: "n5-kara",
      practiceTemplates: [
        { id: "starting-point", prompt: "9時___働きます。表示“从九点开始”应填什么？", answer: "から", options: ["から", "まで", "へ", "を"] },
        { id: "from-station", prompt: "駅___歩きます。表示“从车站”应填什么？", answer: "から", options: ["から", "まで", "へ", "を"] },
        { id: "from-monday", prompt: "月曜日___始まります。表示起点应填什么？", answer: "から", options: ["から", "まで", "に", "で"] },
      ],
    },
    {
      grammarId: "n5-made",
      practiceTemplates: [
        { id: "ending-point", prompt: "5時___働きます。表示“工作到五点”应填什么？", answer: "まで", options: ["まで", "から", "に", "で"] },
        { id: "until-station", prompt: "駅___歩きます。表示“走到车站”应填什么？", answer: "まで", options: ["まで", "から", "に", "で"] },
        { id: "until-night", prompt: "夜___勉強します。表示持续到某时点应填什么？", answer: "まで", options: ["まで", "から", "へ", "を"] },
      ],
    },
    {
      grammarId: "n5-masu",
      practiceTemplates: [
        { id: "polite-present", prompt: "毎日日本語を勉強し___。礼貌地陈述日常习惯应填什么？", answer: "ます", options: ["ます", "ません", "ました", "たい"] },
        { id: "polite-eat", prompt: "朝ごはんを食べ___。礼貌现在时应填什么？", answer: "ます", options: ["ます", "ません", "ました", "たい"] },
        { id: "polite-go", prompt: "明日学校へ行き___。礼貌地陈述将来动作应填什么？", answer: "ます", options: ["ます", "ません", "ました", "ましょう"] },
      ],
    },
    {
      grammarId: "n5-masen",
      practiceTemplates: [
        { id: "polite-negative", prompt: "肉を食べ___。礼貌地表达“不吃”应填什么？", answer: "ません", options: ["ません", "ます", "ました", "ましょう"] },
        { id: "polite-not-go", prompt: "今日は学校へ行き___。礼貌否定应填什么？", answer: "ません", options: ["ません", "ます", "ました", "ましょう"] },
        { id: "polite-not-drink", prompt: "お酒を飲み___。礼貌地表达“不喝”应填什么？", answer: "ません", options: ["ません", "ます", "たい", "た"] },
      ],
    },
    {
      grammarId: "n5-mashita",
      practiceTemplates: [
        { id: "polite-past", prompt: "昨日映画を見___。礼貌地表达过去动作应填什么？", answer: "ました", options: ["ました", "ます", "ません", "たい"] },
        { id: "polite-bought", prompt: "昨日本を買い___。礼貌过去应填什么？", answer: "ました", options: ["ました", "ます", "ません", "たい"] },
        { id: "polite-ate", prompt: "昨日朝ごはんを食べ___。礼貌地表达已经吃过应填什么？", answer: "ました", options: ["ました", "ます", "ません", "ましょう"] },
      ],
    },
    {
      grammarId: "n5-nai",
      practiceTemplates: [
        { id: "plain-negative", prompt: "今日は行か___。使用简体否定应填什么？", answer: "ない", options: ["ない", "ます", "たい", "た"] },
        { id: "plain-not-eat", prompt: "朝ごはんを食べ___。简体否定应填什么？", answer: "ない", options: ["ない", "ます", "たい", "た"] },
        { id: "plain-not-understand", prompt: "分から___。简体否定应填什么？", answer: "ない", options: ["ない", "ます", "ました", "て"] },
      ],
    },
    {
      grammarId: "n5-ta",
      practiceTemplates: [
        { id: "plain-past", prompt: "もう食べ___。使用简体过去形应填什么？", answer: "た", options: ["た", "て", "ない", "ます"] },
        { id: "plain-went", prompt: "昨日学校へ行っ___。简体过去应填什么？", answer: "た", options: ["た", "て", "ない", "ます"] },
        { id: "plain-saw", prompt: "もう見___。简体过去应填什么？", answer: "た", options: ["た", "て", "ない", "ます"] },
      ],
    },
    {
      grammarId: "n5-te",
      practiceTemplates: [
        { id: "request-connector", prompt: "ちょっと待っ___ください。提出请求时应填什么？", answer: "て", options: ["て", "た", "ない", "ます"] },
        { id: "sequence-connector", prompt: "朝ごはんを食べ___、学校へ行きます。连接两个动作应填什么？", answer: "て", options: ["て", "た", "ない", "ます"] },
        { id: "please-look", prompt: "これを見___ください。提出请求时应填什么？", answer: "て", options: ["て", "た", "ない", "だ"] },
      ],
    },
    {
      grammarId: "n5-arimasu",
      practiceTemplates: [
        { id: "inanimate-existence", prompt: "机の上に本が___。非生物“存在”应使用什么？", answer: "あります", options: ["あります", "います", "します", "行きます"] },
        { id: "inanimate-tree", prompt: "公園に木が___。非生物存在应使用什么？", answer: "あります", options: ["あります", "います", "します", "行きます"] },
        { id: "inanimate-time", prompt: "時間が___。表示“有时间”应使用什么？", answer: "あります", options: ["あります", "います", "食べます", "見ます"] },
      ],
    },
    {
      grammarId: "n5-imasu",
      practiceTemplates: [
        { id: "animate-existence", prompt: "教室に先生が___。人“存在”应使用什么？", answer: "います", options: ["います", "あります", "します", "行きます"] },
        { id: "animate-friend", prompt: "あそこに友達が___。人的存在应使用什么？", answer: "います", options: ["います", "あります", "します", "行きます"] },
        { id: "animate-dog", prompt: "家に犬が___。动物的存在应使用什么？", answer: "います", options: ["います", "あります", "食べます", "見ます"] },
      ],
    },
    {
      grammarId: "n5-tai",
      practiceTemplates: [
        { id: "desire-form", prompt: "日本へ行き___です。表达“想去日本”应填什么？", answer: "たい", options: ["たい", "ます", "ました", "ません"] },
        { id: "desire-eat", prompt: "寿司を食べ___です。表达“想吃”应填什么？", answer: "たい", options: ["たい", "ます", "ました", "ません"] },
        { id: "desire-see", prompt: "映画を見___です。表达愿望应填什么？", answer: "たい", options: ["たい", "ます", "て", "ない"] },
      ],
    },
    {
      grammarId: "n5-mashou",
      practiceTemplates: [
        { id: "polite-volitional", prompt: "一緒に帰り___。礼貌地提议“一起回去吧”应填什么？", answer: "ましょう", options: ["ましょう", "ます", "ません", "ました"] },
        { id: "lets-eat", prompt: "一緒に食べ___。礼貌提议应填什么？", answer: "ましょう", options: ["ましょう", "ます", "ません", "ました"] },
        { id: "lets-go", prompt: "公園へ行き___。提议“去公园吧”应填什么？", answer: "ましょう", options: ["ましょう", "たい", "ません", "ない"] },
      ],
    },
    {
      grammarId: "n5-ya",
      practiceTemplates: [
        { id: "partial-list", prompt: "本___雑誌などを買いました。表示不完全列举应填什么？", answer: "や", options: ["や", "と", "を", "が"] },
        { id: "partial-food", prompt: "りんご___バナナなどを食べます。不完全列举应填什么？", answer: "や", options: ["や", "と", "を", "が"] },
        { id: "partial-stationery", prompt: "ペン___ノートなどがあります。表示“之类”的列举应填什么？", answer: "や", options: ["や", "と", "に", "で"] },
      ],
    },
    {
      grammarId: "n5-kore",
      practiceTemplates: [
        { id: "near-speaker", prompt: "___はペンです。（指自己手里的笔）应填什么？", answer: "これ", options: ["これ", "それ", "あれ", "どれ"] },
        { id: "near-listener", prompt: "___は何ですか。（指对方手里的东西）应填什么？", answer: "それ", options: ["それ", "これ", "あれ", "どれ"] },
        { id: "which-one", prompt: "___が田中さんのかばんですか。问“哪一个”应填什么？", answer: "どれ", options: ["どれ", "これ", "それ", "あれ"] },
      ],
    },
    {
      grammarId: "n5-kono",
      practiceTemplates: [
        { id: "this-noun", prompt: "___本は新しいです。修饰“这本书”应填什么？", answer: "この", options: ["この", "これ", "その", "どれ"] },
        { id: "that-far-noun", prompt: "___建物は学校です。（双方都远的那栋）应填什么？", answer: "あの", options: ["あの", "あれ", "この", "どの"] },
        { id: "which-noun", prompt: "___かばんがあなたのですか。问“哪一个名词”应填什么？", answer: "どの", options: ["どの", "どれ", "この", "その"] },
      ],
    },
    {
      grammarId: "n5-koko",
      practiceTemplates: [
        { id: "here-place", prompt: "___は図書館です。（说话人所在处）应填什么？", answer: "ここ", options: ["ここ", "そこ", "あそこ", "どこ"] },
        { id: "where-place", prompt: "駅は___ですか。询问地点应填什么？", answer: "どこ", options: ["どこ", "どれ", "なに", "だれ"] },
        { id: "over-there", prompt: "___に郵便局があります。（双方都远）应填什么？", answer: "あそこ", options: ["あそこ", "ここ", "これ", "あれ"] },
      ],
    },
    {
      grammarId: "n5-questions",
      practiceTemplates: [
        { id: "who-question", prompt: "あの先生は___ですか。问“是谁”应填什么？", answer: "だれ", options: ["だれ", "なに", "いつ", "どこ"] },
        { id: "what-question", prompt: "それは___ですか。问“是什么”时常用读法应填什么？", answer: "なん", options: ["なん", "だれ", "いつ", "どこ"] },
        { id: "when-question", prompt: "試験は___ですか。问时间应填什么？", answer: "いつ", options: ["いつ", "だれ", "なに", "どう"] },
      ],
    },
    {
      grammarId: "n5-i-adj",
      practiceTemplates: [
        { id: "i-adj-polite", prompt: "この部屋は広い___。い形容词礼貌肯定应填什么？", answer: "です", options: ["です", "だ", "な", "に"] },
        { id: "i-adj-negative", prompt: "この本は高___です。い形容词否定应填什么？", answer: "くない", options: ["くない", "じゃない", "くなかった", "くて"] },
        { id: "i-adj-past", prompt: "昨日は暑___です。い形容词过去应填什么？", answer: "かった", options: ["かった", "くない", "でした", "な"] },
      ],
    },
    {
      grammarId: "n5-na-adj",
      practiceTemplates: [
        { id: "na-adj-modifying", prompt: "静か___部屋です。な形容词修饰名词应填什么？", answer: "な", options: ["な", "い", "の", "に"] },
        { id: "na-adj-negative", prompt: "今日は暇___です。な形容词简体否定应填什么？", answer: "じゃない", options: ["じゃない", "くない", "ません", "くなかった"] },
        { id: "na-adj-past", prompt: "昨日はにぎやか___。な形容词礼貌过去应填什么？", answer: "でした", options: ["でした", "かった", "です", "くない"] },
      ],
    },
    {
      grammarId: "n5-te-iru",
      practiceTemplates: [
        { id: "progressive-now", prompt: "今、勉強して___。表示正在进行应填什么？", answer: "います", options: ["います", "あります", "ました", "たい"] },
        { id: "result-state", prompt: "電気がついて___。表示“灯开着”的状态应填什么？", answer: "います", options: ["います", "あります", "ください", "ます"] },
        { id: "wear-state", prompt: "めがねをかけて___。表示戴着眼镜应填什么？", answer: "います", options: ["います", "あります", "ください", "ました"] },
      ],
    },
    {
      grammarId: "n5-te-kudasai",
      practiceTemplates: [
        { id: "please-wait", prompt: "ちょっと待って___。礼貌请求应填什么？", answer: "ください", options: ["ください", "います", "ます", "たい"] },
        { id: "please-look-item", prompt: "これを見て___。请对方看应填什么？", answer: "ください", options: ["ください", "います", "ました", "ません"] },
        { id: "please-write", prompt: "住所を書いて___。请对方写应填什么？", answer: "ください", options: ["ください", "あります", "でしょう", "たい"] },
      ],
    },
    {
      grammarId: "n5-hoshii",
      practiceTemplates: [
        { id: "want-particle", prompt: "コーヒー___ほしいです。标记想要的对象应填什么？", answer: "が", options: ["が", "を", "に", "で"] },
        { id: "want-word", prompt: "新しい辞書が___です。表示“想要”应填什么？", answer: "ほしい", options: ["ほしい", "たい", "すき", "あります"] },
        { id: "want-item", prompt: "お金が___です。想要物品时应填什么？", answer: "ほしい", options: ["ほしい", "たい", "ます", "ください"] },
      ],
    },
    {
      grammarId: "n5-counter",
      practiceTemplates: [
        { id: "counter-people", prompt: "教室に学生が五___います。数人应填什么？", answer: "人", options: ["人", "枚", "本", "匹"] },
        { id: "counter-paper", prompt: "紙を三___ください。数纸张应填什么？", answer: "枚", options: ["枚", "本", "人", "台"] },
        { id: "counter-long", prompt: "水を二___ください。数细长瓶装应填什么？", answer: "本", options: ["本", "枚", "杯", "匹"] },
      ],
    },
    {
      grammarId: "n5-masen-deshita",
      practiceTemplates: [
        { id: "past-neg-go", prompt: "昨日は働き___。礼貌过去否定应填什么？", answer: "ませんでした", options: ["ませんでした", "ました", "ません", "ます"] },
        { id: "past-neg-eat", prompt: "昼ごはんを食べ___。礼貌地说“没吃”应填什么？", answer: "ませんでした", options: ["ませんでした", "ました", "ない", "たい"] },
        { id: "past-neg-see", prompt: "その映画を見___。礼貌过去否定应填什么？", answer: "ませんでした", options: ["ませんでした", "ます", "ましょう", "てください"] },
      ],
    },
    {
      grammarId: "n5-masen-ka",
      practiceTemplates: [
        { id: "invite-eat", prompt: "一緒に食べ___。委婉邀请应填什么？", answer: "ませんか", options: ["ませんか", "ます", "ました", "たいです"] },
        { id: "invite-go", prompt: "公園へ行き___。委婉邀请“要不要去”应填什么？", answer: "ませんか", options: ["ませんか", "ました", "ませんでした", "たい"] },
        { id: "invite-drink", prompt: "お茶を飲み___。邀请喝应填什么？", answer: "ませんか", options: ["ませんか", "ます", "てください", "ほしい"] },
      ],
    },
    {
      grammarId: "n5-ni-time",
      practiceTemplates: [
        { id: "at-hour", prompt: "8時___学校へ行きます。标记具体时刻应填什么？", answer: "に", options: ["に", "で", "を", "へ"] },
        { id: "at-date", prompt: "3月1日___テストがあります。标记日期应填什么？", answer: "に", options: ["に", "で", "から", "と"] },
        { id: "at-weekday", prompt: "土曜日___買い物をします。星期几后面应填什么？", answer: "に", options: ["に", "で", "を", "が"] },
      ],
    },
    {
      grammarId: "n5-de-means",
      practiceTemplates: [
        { id: "by-bus", prompt: "駅までバス___行きます。表示交通手段应填什么？", answer: "で", options: ["で", "に", "を", "へ"] },
        { id: "by-train", prompt: "電車___学校へ行きます。表示乘坐工具应填什么？", answer: "で", options: ["で", "に", "が", "と"] },
        { id: "with-tool", prompt: "ペン___名前を書きます。表示工具应填什么？", answer: "で", options: ["で", "を", "に", "の"] },
      ],
    },
    {
      grammarId: "n5-kara-reason",
      practiceTemplates: [
        { id: "reason-busy", prompt: "忙しいです___、今日は行きません。表示原因应填什么？", answer: "から", options: ["から", "まで", "に", "で"] },
        { id: "reason-expensive", prompt: "高いです___、買いません。说明理由应填什么？", answer: "から", options: ["から", "まで", "を", "へ"] },
        { id: "reason-fever", prompt: "熱があります___、休みます。表示“因为”应填什么？", answer: "から", options: ["から", "と", "も", "が"] },
      ],
    },
    {
      grammarId: "n5-ne-yo",
      practiceTemplates: [
        { id: "particle-ne", prompt: "きれいです___。（征求对方同感）应填什么？", answer: "ね", options: ["ね", "よ", "か", "を"] },
        { id: "particle-yo", prompt: "明日テストがあります___。（提醒对方）应填什么？", answer: "よ", options: ["よ", "ね", "を", "に"] },
        { id: "particle-inform", prompt: "これは本です___。（告知新信息，不是提问）应填什么？", answer: "よ", options: ["よ", "か", "を", "で"] },
      ],
    },
    {
      grammarId: "n5-yori",
      practiceTemplates: [
        { id: "than-marker", prompt: "この本はあの本___おもしろいです。表示“比”应填什么？", answer: "より", options: ["より", "のほうが", "から", "まで"] },
        { id: "this-side", prompt: "バス___安いです。强调“巴士这边更便宜”应填什么？", answer: "のほうが", options: ["のほうが", "より", "から", "で"] },
        { id: "compare-season", prompt: "冬は秋___寒いです。比较句中“比秋天”应填什么？", answer: "より", options: ["より", "に", "と", "で"] },
      ],
    },
    {
      grammarId: "n5-ga-suki",
      practiceTemplates: [
        { id: "like-particle", prompt: "音楽___すきです。すき的对象应填什么？", answer: "が", options: ["が", "を", "に", "で"] },
        { id: "dislike-particle", prompt: "野菜___きらいです。きらい的对象应填什么？", answer: "が", options: ["が", "を", "は", "へ"] },
        { id: "skill-particle", prompt: "料理___じょうずです。擅长的对象应填什么？", answer: "が", options: ["が", "を", "で", "と"] },
      ],
    },
    {
      grammarId: "n5-ja-arimasen",
      practiceTemplates: [
        { id: "polite-neg-noun", prompt: "私は学生___。礼貌否定判断应填什么？", answer: "じゃありません", options: ["じゃありません", "くない", "ません", "でした"] },
        { id: "formal-neg-noun", prompt: "これは本___。较郑重的否定判断应填什么？", answer: "ではありません", options: ["ではありません", "くない", "ませんでした", "たい"] },
        { id: "na-adj-neg", prompt: "この町は静か___。な形容词礼貌否定应填什么？", answer: "じゃありません", options: ["じゃありません", "くない", "かった", "ます"] },
      ],
    },
    {
      grammarId: "n5-deshita",
      practiceTemplates: [
        { id: "past-copula", prompt: "昨日は休み___。名词礼貌过去应填什么？", answer: "でした", options: ["でした", "です", "かった", "じゃありません"] },
        { id: "past-na-adj", prompt: "パーティーはにぎやか___。な形容词礼貌过去应填什么？", answer: "でした", options: ["でした", "かった", "です", "くない"] },
        { id: "past-occupation", prompt: "子供のとき、先生___。名词过去判断应填什么？", answer: "でした", options: ["でした", "かったです", "ます", "たい"] },
      ],
    },
  ]
