import type { GrammarPracticeSet } from "./grammar-practice-types"

export const n3GrammarPracticeSets: GrammarPracticeSet[] = [
    {
      grammarId: "n3-sae",
      practiceTemplates: [
        { id: "n3-sae-lunch", prompt: "昼ごはん___食べられませんでした。甚至应填什么？", answer: "さえ", options: ["さえ", "だけ", "しか", "ほど"] },
        { id: "n3-sae-child", prompt: "子供___解けます。连……都应填什么？", answer: "さえ", options: ["さえ", "まで", "より", "ほど"] },
      ],
    },
    {
      grammarId: "n3-bakari",
      practiceTemplates: [
        { id: "n3-bakari-game", prompt: "ゲームをして___です。净是做应填什么？", answer: "ばかり", options: ["ばかり", "ところ", "つもり", "はず"] },
        { id: "n3-bakari-sweet", prompt: "甘いもの___食べています。尽是这类东西应填什么？", answer: "ばかり", options: ["ばかり", "まま", "せい", "わけ"] },
      ],
    },
    {
      grammarId: "n3-wake-ga-nai",
      practiceTemplates: [
        { id: "n3-wake-ga-nai-pass", prompt: "簡単に合格できる___。不可能应填什么？", answer: "わけがない", options: ["わけがない", "わけだ", "わけではない", "はずだ"] },
        { id: "n3-wake-ga-nai-lie", prompt: "彼が嘘をつく___。绝无可能应填什么？", answer: "わけがない", options: ["わけがない", "ものだ", "ことだ", "べきだ"] },
      ],
    },
    {
      grammarId: "n3-hazu",
      practiceTemplates: [
        { id: "n3-hazu-come", prompt: "今日来る___です。按理应该应填什么？", answer: "はず", options: ["はず", "つもり", "べき", "せい"] },
        { id: "n3-hazu-key", prompt: "鍵は机の上にある___です。有根据的推测应填什么？", answer: "はず", options: ["はず", "まま", "ところ", "ばかり"] },
      ],
    },
    {
      grammarId: "n3-you-ni",
      practiceTemplates: [
        { id: "n3-you-ni-late", prompt: "遅れない___、早く家を出ます。为了达到状态应填什么？", answer: "ように", options: ["ように", "ために", "せいで", "ままに"] },
        { id: "n3-you-ni-hear", prompt: "聞こえる___、大きい声で話してください。使对方能做到应填什么？", answer: "ように", options: ["ように", "とおりに", "ばかりに", "くせに"] },
      ],
    },
    {
      grammarId: "n3-te-shimau",
      practiceTemplates: [
        { id: "n3-te-shimau-paper", prompt: "書類を忘れ___。后悔义应填什么？", answer: "てしまいました", options: ["てしまいました", "ておきました", "てみました", "てありました"] },
        { id: "n3-te-shimau-cake", prompt: "ケーキを全部食べ___。全部做完应填什么？", answer: "てしまいました", options: ["てしまいました", "てあげました", "てくれました", "てもらいました"] },
      ],
    },
    {
      grammarId: "n3-koto-ni-suru",
      practiceTemplates: [
        { id: "n3-koto-ni-suru-diary", prompt: "毎日日記を書く___。自己决定应填什么？", answer: "ことにしました", options: ["ことにしました", "ことになりました", "ようになりました", "ばかりにしました"] },
        { id: "n3-koto-ni-suru-sweet", prompt: "甘いものを控える___。主观决定应填什么？", answer: "ことにします", options: ["ことにします", "ことになります", "わけです", "はずです"] },
      ],
    },
    {
      grammarId: "n3-rashii",
      practiceTemplates: [
        { id: "n3-rashii-snow", prompt: "明日は雪___です。有根据的传闻应填什么？", answer: "らしい", options: ["らしい", "みたい", "べき", "がち"] },
        { id: "n3-rashii-wear", prompt: "学生___服装をしてください。典型样子应填什么？", answer: "らしい", options: ["らしい", "っぽい", "ぎみ", "がち"] },
      ],
    },
    {
      grammarId: "n3-ppoi",
      practiceTemplates: [
        { id: "n3-ppoi-lie", prompt: "その説明は嘘___です。有某种味道应填什么？", answer: "っぽい", options: ["っぽい", "らしい", "べき", "はず"] },
        { id: "n3-ppoi-forget", prompt: "最近忘れ___なりました。倾向应填什么？", answer: "っぽく", options: ["っぽく", "らしく", "がちに", "ぎみに"] },
      ],
    },
    {
      grammarId: "n3-tabi-ni",
      practiceTemplates: [
        { id: "n3-tabi-ni-photo", prompt: "この写真を見る___、旅行を思い出します。每当应填什么？", answer: "たびに", options: ["たびに", "うちに", "ままに", "せいに"] },
        { id: "n3-tabi-ni-meet", prompt: "会う___新しい本をくれます。每一次都应填什么？", answer: "たびに", options: ["たびに", "ながら", "つつ", "ままに"] },
      ],
    },
    {
      grammarId: "n3-nitsuite",
      practiceTemplates: [
        { id: "n3-nitsuite-culture", prompt: "日本の文化___発表します。关于应填什么？", answer: "について", options: ["について", "にとって", "に対して", "によって"] },
        { id: "n3-nitsuite-q", prompt: "この問題___質問しました。就该主题应填什么？", answer: "について", options: ["について", "にとって", "として", "にしたがって"] },
      ],
    },
    {
      grammarId: "n3-mama",
      practiceTemplates: [
        { id: "n3-mama-window", prompt: "窓を開けた___寝てしまいました。保持原状应填什么？", answer: "まま", options: ["まま", "ところ", "とおり", "つもり"] },
        { id: "n3-mama-shoes", prompt: "靴をはいた___入らないでください。维持该状态应填什么？", answer: "まま", options: ["まま", "ばかり", "はず", "せい"] },
      ],
    },
    {
      grammarId: "n3-kiru",
      practiceTemplates: [
        { id: "n3-kiru-money", prompt: "お金を使い___しまいました。全部用尽应填什么？", answer: "きって", options: ["きって", "かけて", "がちで", "きれで"] },
        { id: "n3-kiru-book", prompt: "この本は難しくて読み___ません。做不完应填什么？", answer: "きれ", options: ["きれ", "かけ", "がち", "ぎみ"] },
      ],
    },
    {
      grammarId: "n3-kake",
      practiceTemplates: [
        { id: "n3-kake-book", prompt: "読み___の本が机の上にあります。做到一半应填什么？", answer: "かけ", options: ["かけ", "きれ", "がち", "ぎみ"] },
        { id: "n3-kake-say", prompt: "彼は言い___て、やめました。刚开始还没完成应填什么？", answer: "かけ", options: ["かけ", "きり", "つつ", "まま"] },
      ],
    },
    {
      grammarId: "n3-saserareru",
      practiceTemplates: [
        { id: "n3-saserareru-piano", prompt: "毎日ピアノを練習___。被迫做应填什么？", answer: "させられました", options: ["させられました", "させました", "されました", "できました"] },
        { id: "n3-saserareru-report", prompt: "長い報告を___。使役被动应填什么？", answer: "させられました", options: ["させられました", "してあげました", "してもらいました", "しておきました"] },
      ],
    },
    {
      grammarId: "n3-tokoro",
      practiceTemplates: [
        { id: "n3-tokoro-out", prompt: "これから出かける___です。正要做应填什么？", answer: "ところ", options: ["ところ", "つもり", "はず", "まま"] },
        { id: "n3-tokoro-arrive", prompt: "今、着いた___です。刚刚做完应填什么？", answer: "ところ", options: ["ところ", "ばかりか", "せいで", "わけで"] },
      ],
    },
    {
      grammarId: "n3-okage",
      practiceTemplates: [
        { id: "n3-okage-pass", prompt: "先生の___、合格できました。多亏应填什么？", answer: "おかげで", options: ["おかげで", "せいで", "くせに", "とおりに"] },
        { id: "n3-okage-talk", prompt: "練習した___、会話が上手になりました。正面原因应填什么？", answer: "おかげで", options: ["おかげで", "せいで", "ために", "ままで"] },
      ],
    },
    {
      grammarId: "n3-seide",
      practiceTemplates: [
        { id: "n3-seide-train", prompt: "電車が遅れた___、授業に遅れました。归咎应填什么？", answer: "せいで", options: ["せいで", "おかげで", "とおりで", "つもりで"] },
        { id: "n3-seide-sleep", prompt: "遅くまで起きた___、今朝は眠いです。都怪应填什么？", answer: "せいで", options: ["せいで", "おかげで", "ばかりで", "ままで"] },
      ],
    },
    {
      grammarId: "n3-totte",
      practiceTemplates: [
        { id: "n3-totte-dict", prompt: "この辞書は留学生___便利です。立场评价应填什么？", answer: "にとって", options: ["にとって", "について", "に対して", "によって"] },
        { id: "n3-totte-family", prompt: "家族は私___一番大切です。对……来说应填什么？", answer: "にとって", options: ["にとって", "として", "にしたがって", "にあたって"] },
      ],
    },
    {
      grammarId: "n3-chigainai",
      practiceTemplates: [
        { id: "n3-chigainai-tanaka", prompt: "あの人は田中さん___。确信应填什么？", answer: "に違いない", options: ["に違いない", "かもしれない", "わけではない", "にすぎない"] },
        { id: "n3-chigainai-answer", prompt: "この答えは正しい___。一定应填什么？", answer: "に違いない", options: ["に違いない", "かもしれない", "べきだ", "ところだ"] },
      ],
    },
    {
      grammarId: "n3-baai",
      practiceTemplates: [
        { id: "n3-baai-fire", prompt: "火事の___は、この出口から出てください。场合应填什么？", answer: "場合", options: ["場合", "ところ", "まま", "せい"] },
        { id: "n3-baai-unknown", prompt: "わからない___は、辞書を使ってもいいです。在这种情况下应填什么？", answer: "場合", options: ["場合", "たびに", "あげく", "くせに"] },
      ],
    },
    {
      grammarId: "n3-tame",
      practiceTemplates: [
        { id: "n3-tame-save", prompt: "留学する___、お金を貯めています。目的应填什么？", answer: "ために", options: ["ために", "ように", "せいで", "ままに"] },
        { id: "n3-tame-rain", prompt: "雨の___、試合は中止になりました。原因应填什么？", answer: "ため", options: ["ため", "せい", "まま", "ほど"] },
      ],
    },
    {
      grammarId: "n3-ni-yotte",
      practiceTemplates: [
        { id: "n3-ni-yotte-design", prompt: "建築家___設計されました。被动施事应填什么？", answer: "によって", options: ["によって", "にとって", "について", "に対して"] },
        { id: "n3-ni-yotte-person", prompt: "人___考え方が違います。因……而异应填什么？", answer: "によって", options: ["によって", "として", "にとって", "にしたがって"] },
      ],
    },
    {
      grammarId: "n3-ni-taishite",
      practiceTemplates: [
        { id: "n3-ni-taishite-strict", prompt: "学生___厳しいです。对待对象应填什么？", answer: "に対して", options: ["に対して", "にとって", "について", "によって"] },
        { id: "n3-ni-taishite-opinion", prompt: "この意見___反対します。针对应填什么？", answer: "に対して", options: ["に対して", "にとって", "として", "にあたって"] },
      ],
    },
    {
      grammarId: "n3-toshite",
      practiceTemplates: [
        { id: "n3-toshite-rep", prompt: "代表___会議に出席しました。作为身份应填什么？", answer: "として", options: ["として", "にとって", "によって", "について"] },
        { id: "n3-toshite-hobby", prompt: "趣味___ピアノを習っています。以某种资格应填什么？", answer: "として", options: ["として", "に対して", "にしたがって", "をめぐって"] },
      ],
    },
    {
      grammarId: "n3-aida-ni",
      practiceTemplates: [
        { id: "n3-aida-ni-summer", prompt: "夏休みの___、本を十冊読みました。在期间之内应填什么？", answer: "間に", options: ["間に", "うちに", "たびに", "まえに"] },
        { id: "n3-aida-ni-cook", prompt: "料理している___、テーブルを準備します。在持续的时间里应填什么？", answer: "間に", options: ["間に", "ままに", "あとで", "おかげで"] },
      ],
    },
    {
      grammarId: "n3-uchi-ni",
      practiceTemplates: [
        { id: "n3-uchi-ni-memo", prompt: "忘れない___、メモしてください。趁还没变应填什么？", answer: "うちに", options: ["うちに", "間に", "たびに", "あげくに"] },
        { id: "n3-uchi-ni-young", prompt: "若い___、いろいろな経験をしたほうがいいです。趁着应填什么？", answer: "うちに", options: ["うちに", "ままに", "せいに", "とおりに"] },
      ],
    },
    {
      grammarId: "n3-wake-da",
      practiceTemplates: [
        { id: "n3-wake-da-skill", prompt: "毎日練習しているから、上手な___。引出理所当然的结论应填什么？", answer: "わけだ", options: ["わけだ", "わけがない", "わけではない", "はずがない"] },
        { id: "n3-wake-da-sleepy", prompt: "遅くまで勉強したので、眠い___です。原来如此应填什么？", answer: "わけです", options: ["わけです", "ところです", "ばかりです", "べきです"] },
      ],
    },
    {
      grammarId: "n3-wake-niwa-ikanai",
      practiceTemplates: [
        { id: "n3-wake-niwa-ikanai-play", prompt: "遊んでいる___。情理上不能应填什么？", answer: "わけにはいかない", options: ["わけにはいかない", "わけがない", "わけではない", "はずがない"] },
        { id: "n3-wake-niwa-ikanai-refuse", prompt: "断る___ません。责任上不能应填什么？", answer: "わけにはいき", options: ["わけにはいき", "わけがなく", "わけではなく", "はずがなく"] },
      ],
    },
    {
      grammarId: "n3-koto-ni-natteiru",
      practiceTemplates: [
        { id: "n3-koto-ni-natteiru-shoes", prompt: "土足で入らない___。规定如此应填什么？", answer: "ことになっています", options: ["ことになっています", "ことにしています", "ようになっています", "ばかりになっています"] },
        { id: "n3-koto-ni-natteiru-book", prompt: "新しい教科書を使う___。既定安排应填什么？", answer: "ことになっています", options: ["ことになっています", "つもりです", "べきです", "はずです"] },
      ],
    },
    {
      grammarId: "n3-toiu",
      practiceTemplates: [
        { id: "n3-toiu-word", prompt: "「すみません」___のは、謝るときの言葉です。叫做应填什么？", answer: "という", options: ["という", "とする", "による", "に対する"] },
        { id: "n3-toiu-person", prompt: "田中さん___人から電話がありました。名叫应填什么？", answer: "という", options: ["という", "ような", "らしい", "みたいな"] },
      ],
    },
    {
      grammarId: "n3-toiunowa",
      practiceTemplates: [
        { id: "n3-toiunowa-keigo", prompt: "敬語___、丁寧な話し方のことです。所谓……就是应填什么？", answer: "というのは", options: ["というのは", "というより", "としたら", "にとっては"] },
        { id: "n3-toiunowa-rest", prompt: "休む___、今日来られないということですか。解释对方的话应填什么？", answer: "というのは", options: ["というのは", "というと", "としても", "ところでは"] },
      ],
    },
    {
      grammarId: "n3-mono-da",
      practiceTemplates: [
        { id: "n3-mono-da-past", prompt: "よく川で遊んだ___。感慨过去应填什么？", answer: "ものだ", options: ["ものだ", "ことだ", "わけだ", "はずだ"] },
        { id: "n3-mono-da-age", prompt: "年を取ると、目が悪くなる___。普遍道理应填什么？", answer: "ものだ", options: ["ものだ", "ことだ", "べきだ", "せいだ"] },
      ],
    },
    {
      grammarId: "n3-koto-da",
      practiceTemplates: [
        { id: "n3-koto-da-speak", prompt: "毎日話す___。劝告应当做应填什么？", answer: "ことだ", options: ["ことだ", "ものだ", "わけだ", "はずだ"] },
        { id: "n3-koto-da-sleep", prompt: "よく寝る___。重要的是这样做应填什么？", answer: "ことだ", options: ["ことだ", "ばかりだ", "ところだ", "ままだ"] },
      ],
    },
    {
      grammarId: "n3-te-hoshii",
      practiceTemplates: [
        { id: "n3-te-hoshii-slow", prompt: "ゆっくり話し___です。希望对方做应填什么？", answer: "てほしい", options: ["てほしい", "たい", "たがる", "てあげる"] },
        { id: "n3-te-hoshii-window", prompt: "窓を開け___のですが。想请对方做应填什么？", answer: "てほしい", options: ["てほしい", "ておく", "てみる", "てしまう"] },
      ],
    },
    {
      grammarId: "n3-gimi",
      practiceTemplates: [
        { id: "n3-gimi-tired", prompt: "最近ちょっと疲れ___です。有点这种倾向应填什么？", answer: "気味", options: ["気味", "がち", "っぽい", "らしい"] },
        { id: "n3-gimi-score", prompt: "成績が下がり___なので、心配です。略带负面苗头应填什么？", answer: "気味", options: ["気味", "きり", "かけ", "まま"] },
      ],
    },
    {
      grammarId: "n3-tsutsu",
      practiceTemplates: [
        { id: "n3-tsutsu-reflect", prompt: "反省し___、次の課題を進めています。书面的一边应填什么？", answer: "つつ", options: ["つつ", "ながら", "たびに", "ままに"] },
        { id: "n3-tsutsu-know", prompt: "悪いと知り___、夜更かししてしまいました。明知却仍应填什么？", answer: "つつ", options: ["つつ", "まま", "せい", "わけ"] },
      ],
    },
    {
      grammarId: "n3-kagiri",
      practiceTemplates: [
        { id: "n3-kagiri-know", prompt: "知っている___、彼は欠席していません。就这个范围应填什么？", answer: "限り", options: ["限り", "まま", "たび", "あげく"] },
        { id: "n3-kagiri-time", prompt: "時間がある___、手伝います。只要还在这个限度应填什么？", answer: "限り", options: ["限り", "うち", "せい", "わけ"] },
      ],
    },
    {
      grammarId: "n3-ue-de",
      practiceTemplates: [
        { id: "n3-ue-de-read", prompt: "説明をよく読んだ___、申し込んでください。在此基础上应填什么？", answer: "上で", options: ["上で", "上に", "うちに", "たびに"] },
        { id: "n3-ue-de-search", prompt: "調べた___、質問してください。先完成再进行应填什么？", answer: "上で", options: ["上で", "あげく", "くせに", "せいで"] },
      ],
    },
    {
      grammarId: "n3-ni-shitagatte",
      practiceTemplates: [
        { id: "n3-ni-shitagatte-temp", prompt: "気温が上がる___、観光客が増えます。随着变化应填什么？", answer: "にしたがって", options: ["にしたがって", "に対して", "にとって", "について"] },
        { id: "n3-ni-shitagatte-guide", prompt: "案内___、会場へ行ってください。按照指示应填什么？", answer: "にしたがって", options: ["にしたがって", "をめぐって", "を問わず", "にあたって"] },
      ],
    },
  ]
