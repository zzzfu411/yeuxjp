import type { GrammarPracticeSet } from "./grammar-practice-types"

export const n4GrammarPracticeSets: GrammarPracticeSet[] = [
    {
      grammarId: "n4-te-iru",
      practiceTemplates: [
        { id: "n4-te-iru-now", prompt: "今、勉強し___。表示正在进行应填什么？", answer: "ている", options: ["ている", "てみる", "ておく", "てしまう"] },
        { id: "n4-te-iru-state", prompt: "窓が開い___。表示结果状态应填什么？", answer: "ている", options: ["ている", "てある", "てくる", "てください"] },
      ],
    },
    {
      grammarId: "n4-te-kudasai",
      practiceTemplates: [
        { id: "n4-te-kudasai-wait", prompt: "ちょっと待っ___。礼貌请求应填什么？", answer: "てください", options: ["てください", "てあげる", "てみる", "てしまう"] },
        { id: "n4-te-kudasai-write", prompt: "ここに名前を書い___。请对方写名字应填什么？", answer: "てください", options: ["てください", "ておく", "てもらう", "てくる"] },
      ],
    },
    {
      grammarId: "n4-nai-de",
      practiceTemplates: [
        { id: "n4-nai-de-photo", prompt: "ここで写真を撮ら___ください。请不要拍照应填什么？", answer: "ないで", options: ["ないで", "なくて", "なければ", "なくても"] },
        { id: "n4-nai-de-dict", prompt: "辞書を見___答えてください。请别看词典应填什么？", answer: "ないで", options: ["ないで", "なくて", "ないと", "ないか"] },
      ],
    },
    {
      grammarId: "n4-koto-ga-dekiru",
      practiceTemplates: [
        { id: "n4-koto-ga-dekiru-read", prompt: "漢字を読む___。表示能力应填什么？", answer: "ことができる", options: ["ことができる", "ことになる", "ことにする", "ことがある"] },
        { id: "n4-koto-ga-dekiru-piano", prompt: "ピアノを弾く___。表示会做应填什么？", answer: "ことができる", options: ["ことができる", "ようになる", "ほうがいい", "かもしれません"] },
      ],
    },
    {
      grammarId: "n4-hou-ga-ii",
      practiceTemplates: [
        { id: "n4-hou-ga-ii-sleep", prompt: "もっと早く寝た___。劝人最好去做应填什么？", answer: "ほうがいい", options: ["ほうがいい", "つもりだ", "かもしれない", "ことにする"] },
        { id: "n4-hou-ga-ii-phone", prompt: "携帯を使わない___。劝人最好别做应填什么？", answer: "ほうがいい", options: ["ほうがいい", "なければならない", "てください", "ことになる"] },
      ],
    },
    {
      grammarId: "n4-ndesu",
      practiceTemplates: [
        { id: "n4-ndesu-head", prompt: "頭が痛い___。解释说明应填什么？", answer: "んです", options: ["んです", "ます", "でしょう", "つもりです"] },
        { id: "n4-ndesu-ask", prompt: "どうした___か。把询问说软应填什么？", answer: "んです", options: ["んです", "です", "ます", "だ"] },
      ],
    },
    {
      grammarId: "n4-nakereba",
      practiceTemplates: [
        { id: "n4-nakereba-hw", prompt: "宿題をし___。表示必须应填什么？", answer: "なければなりません", options: ["なければなりません", "なくてもいいです", "たほうがいいです", "てください"] },
        { id: "n4-nakereba-wake", prompt: "早く起き___。表示义务应填什么？", answer: "なければなりません", options: ["なければなりません", "なくてもいいです", "かもしれません", "てみます"] },
      ],
    },
    {
      grammarId: "n4-tara",
      practiceTemplates: [
        { id: "n4-tara-kyoto", prompt: "京都へ行っ___、お寺を見たいです。假定条件应填什么？", answer: "たら", options: ["たら", "ば", "と", "なら"] },
        { id: "n4-tara-rain", prompt: "雨が止ん___、散歩しましょう。表示“之后就”应填什么？", answer: "たら", options: ["たら", "まえに", "ながら", "ずに"] },
      ],
    },
    {
      grammarId: "n4-ba",
      practiceTemplates: [
        { id: "n4-ba-cheap", prompt: "安けれ___、この本を買います。ば形条件应填什么？", answer: "ば", options: ["ば", "たら", "と", "なら"] },
        { id: "n4-ba-time", prompt: "時間がなけれ___、明日にしましょう。条件形应填什么？", answer: "ば", options: ["ば", "ても", "のに", "なら"] },
      ],
    },
    {
      grammarId: "n4-nara",
      practiceTemplates: [
        { id: "n4-nara-jp", prompt: "日本語___、田中さんに聞いてください。承接话题应填什么？", answer: "なら", options: ["なら", "たら", "ば", "と"] },
        { id: "n4-nara-go", prompt: "今から行く___、一緒に行きましょう。就对方所说应填什么？", answer: "なら", options: ["なら", "のに", "ても", "つつ"] },
      ],
    },
    {
      grammarId: "n4-volitional",
      practiceTemplates: [
        { id: "n4-volitional-movie", prompt: "週末に映画を見___。意向形应填什么？", answer: "よう", options: ["よう", "ます", "たい", "なさい"] },
        { id: "n4-volitional-practice", prompt: "もう少し練習し___。表示“做吧”应填什么？", answer: "よう", options: ["よう", "ます", "ない", "なさい"] },
      ],
    },
    {
      grammarId: "n4-passive",
      practiceTemplates: [
        { id: "n4-passive-name", prompt: "先生に名前を___。被动“被叫到”应填什么？", answer: "呼ばれました", options: ["呼ばれました", "呼ばせました", "呼びました", "呼んでもらいました"] },
        { id: "n4-passive-cake", prompt: "弟にケーキを___。受害被动应填什么？", answer: "食べられました", options: ["食べられました", "食べさせました", "食べてあげました", "食べました"] },
      ],
    },
    {
      grammarId: "n4-causative",
      practiceTemplates: [
        { id: "n4-causative-veg", prompt: "母は子供に野菜を___。使役“让吃”应填什么？", answer: "食べさせます", options: ["食べさせます", "食べられます", "食べます", "食べてくれます"] },
        { id: "n4-causative-essay", prompt: "先生は学生に作文を___。让学生写应填什么？", answer: "書かせました", options: ["書かせました", "書かれました", "書きました", "書いてもらいました"] },
      ],
    },
    {
      grammarId: "n4-ageru",
      practiceTemplates: [
        { id: "n4-ageru-lend", prompt: "友達に本を貸し___。为别人做应填什么？", answer: "てあげました", options: ["てあげました", "てくれました", "てもらいました", "てしまいました"] },
        { id: "n4-ageru-teach", prompt: "妹に宿題を教え___。给晚辈做应填什么？", answer: "てあげます", options: ["てあげます", "てくれます", "てもらいます", "ておきます"] },
      ],
    },
    {
      grammarId: "n4-kureru",
      practiceTemplates: [
        { id: "n4-kureru-note", prompt: "友達がノートを貸し___。别人为我做应填什么？", answer: "てくれました", options: ["てくれました", "てあげました", "ておきました", "てみました"] },
        { id: "n4-kureru-explain", prompt: "先生が丁寧に説明し___。老师为我讲解应填什么？", answer: "てくれます", options: ["てくれます", "てあげます", "ていきます", "てあります"] },
      ],
    },
    {
      grammarId: "n4-morau",
      practiceTemplates: [
        { id: "n4-morau-report", prompt: "先輩にレポートを見___。请别人做应填什么？", answer: "てもらいました", options: ["てもらいました", "てあげました", "てくれました", "てしまいました"] },
        { id: "n4-morau-bento", prompt: "母に弁当を作っ___。从别人那里得到该动作应填什么？", answer: "てもらいました", options: ["てもらいました", "てあげました", "ておきました", "てあります"] },
      ],
    },
    {
      grammarId: "n4-shi-shi",
      practiceTemplates: [
        { id: "n4-shi-shi-shop", prompt: "この店は安い___、おいしいです。列举原因应填什么？", answer: "し", options: ["し", "て", "たり", "のに"] },
        { id: "n4-shi-shi-weather", prompt: "天気もいい___、時間もあるし、出かけましょう。并列理由应填什么？", answer: "し", options: ["し", "ば", "と", "ても"] },
      ],
    },
    {
      grammarId: "n4-sou",
      practiceTemplates: [
        { id: "n4-sou-rain", prompt: "明日は雨だ___。传闻应填什么？", answer: "そうです", options: ["そうです", "みたいです", "はずです", "ところです"] },
        { id: "n4-sou-go", prompt: "田中さんは日本へ行く___。听说应填什么？", answer: "そうです", options: ["そうです", "ようです", "らしいです", "つもりです"] },
      ],
    },
    {
      grammarId: "n4-mitai",
      practiceTemplates: [
        { id: "n4-mitai-cloud", prompt: "あの雲は羊___です。比喻应填什么？", answer: "みたい", options: ["みたい", "らしい", "っぽい", "がち"] },
        { id: "n4-mitai-cook", prompt: "母が作った___です。好像是那样应填什么？", answer: "みたい", options: ["みたい", "そうだ", "べき", "まま"] },
      ],
    },
    {
      grammarId: "n4-tsumori",
      practiceTemplates: [
        { id: "n4-tsumori-study", prompt: "来年留学する___です。主观打算应填什么？", answer: "つもり", options: ["つもり", "はず", "べき", "ところ"] },
        { id: "n4-tsumori-leave", prompt: "今日は早く帰る___です。计划应填什么？", answer: "つもり", options: ["つもり", "わけ", "せい", "まま"] },
      ],
    },
    {
      grammarId: "n4-to-cond",
      practiceTemplates: [
        { id: "n4-to-cond-spring", prompt: "春になる___、桜が咲きます。恒常条件应填什么？", answer: "と", options: ["と", "たら", "ば", "なら"] },
        { id: "n4-to-cond-button", prompt: "このボタンを押す___、ドアが開きます。一……就应填什么？", answer: "と", options: ["と", "ても", "のに", "つつ"] },
      ],
    },
    {
      grammarId: "n4-nakutemo-ii",
      practiceTemplates: [
        { id: "n4-nakutemo-ii-shoes", prompt: "靴を脱が___です。不做也行应填什么？", answer: "なくてもいい", options: ["なくてもいい", "なければならない", "ないでください", "ないほうがいい"] },
        { id: "n4-nakutemo-ii-hw", prompt: "今日出さ___です。表示许可不做应填什么？", answer: "なくてもいい", options: ["なくてもいい", "なければなりません", "ないでください", "たほうがいいです"] },
      ],
    },
    {
      grammarId: "n4-te-miru",
      practiceTemplates: [
        { id: "n4-te-miru-eat", prompt: "この料理を食べ___ください。请试试看应填什么？", answer: "てみて", options: ["てみて", "ておいて", "てしまって", "てあげて"] },
        { id: "n4-te-miru-use", prompt: "新しい辞書を使っ___。尝试做应填什么？", answer: "てみます", options: ["てみます", "ておきます", "てしまいます", "ていきます"] },
      ],
    },
    {
      grammarId: "n4-te-shimau",
      practiceTemplates: [
        { id: "n4-te-shimau-forget", prompt: "宿題を忘れ___。表示遗憾应填什么？", answer: "てしまいました", options: ["てしまいました", "ておきました", "てみました", "てありました"] },
        { id: "n4-te-shimau-read", prompt: "本を一日で読ん___。全部做完应填什么？", answer: "でしまいました", options: ["でしまいました", "でおきました", "でみました", "でありました"] },
      ],
    },
    {
      grammarId: "n4-te-oku",
      practiceTemplates: [
        { id: "n4-te-oku-ticket", prompt: "切符を買っ___。事先准备应填什么？", answer: "ておきます", options: ["ておきます", "てみます", "てしまいます", "てきます"] },
        { id: "n4-te-oku-window", prompt: "窓を開け___ください。请先做好应填什么？", answer: "ておいて", options: ["ておいて", "てみて", "てしまって", "てあげて"] },
      ],
    },
    {
      grammarId: "n4-nagara",
      practiceTemplates: [
        { id: "n4-nagara-music", prompt: "音楽を聞き___勉強します。一边……一边应填什么？", answer: "ながら", options: ["ながら", "つつある", "たびに", "まま"] },
        { id: "n4-nagara-walk", prompt: "歩き___話しましょう。同时进行应填什么？", answer: "ながら", options: ["ながら", "まえに", "あとで", "ずに"] },
      ],
    },
    {
      grammarId: "n4-tari",
      practiceTemplates: [
        { id: "n4-tari-weekend", prompt: "本を読んだ___、映画を見たりします。代表性列举应填什么？", answer: "り", options: ["り", "し", "て", "ば"] },
        { id: "n4-tari-sun", prompt: "掃除した___、洗濯したりします。たり形应填什么？", answer: "り", options: ["り", "まま", "よう", "ずつ"] },
      ],
    },
    {
      grammarId: "n4-mae-ni",
      practiceTemplates: [
        { id: "n4-mae-ni-sleep", prompt: "寝る___歯を磨きます。在……之前应填什么？", answer: "前に", options: ["前に", "あとで", "間に", "うちに"] },
        { id: "n4-mae-ni-jp", prompt: "日本へ行く___、日本語を勉強します。之前应填什么？", answer: "前に", options: ["前に", "たびに", "とおりに", "おかげで"] },
      ],
    },
    {
      grammarId: "n4-ato-de",
      practiceTemplates: [
        { id: "n4-ato-de-hw", prompt: "宿題をした___、テレビを見ます。在……之后应填什么？", answer: "あとで", options: ["あとで", "前に", "ながら", "うちに"] },
        { id: "n4-ato-de-meal", prompt: "食事の___、散歩しました。名词后的“之后”应填什么？", answer: "あとで", options: ["あとで", "まえに", "ために", "せいで"] },
      ],
    },
    {
      grammarId: "n4-toki",
      practiceTemplates: [
        { id: "n4-toki-child", prompt: "子供の___、よく公園で遊びました。“时候”应填什么？", answer: "とき", options: ["とき", "まま", "せい", "わけ"] },
        { id: "n4-toki-ask", prompt: "わからない___、先生に聞いてください。在那个时候应填什么？", answer: "とき", options: ["とき", "のに", "ても", "つつ"] },
      ],
    },
    {
      grammarId: "n4-ta-koto-aru",
      practiceTemplates: [
        { id: "n4-ta-koto-aru-fuji", prompt: "富士山に登った___。有过经验应填什么？", answer: "ことがあります", options: ["ことがあります", "ことができます", "ことにします", "ことになります"] },
        { id: "n4-ta-koto-aru-sushi", prompt: "寿司を食べた___。没有经验应填什么？", answer: "ことがありません", options: ["ことがありません", "ことができません", "ことがしません", "わけがありません"] },
      ],
    },
    {
      grammarId: "n4-you-ni-naru",
      practiceTemplates: [
        { id: "n4-you-ni-naru-read", prompt: "ひらがなが読める___。变得能够应填什么？", answer: "ようになりました", options: ["ようになりました", "ことにしました", "つもりです", "ばかりです"] },
        { id: "n4-you-ni-naru-coffee", prompt: "コーヒーを飲む___。开始有此习惯应填什么？", answer: "ようになりました", options: ["ようになりました", "なければなりません", "てください", "そうです"] },
      ],
    },
    {
      grammarId: "n4-kamoshirenai",
      practiceTemplates: [
        { id: "n4-kamoshirenai-rain", prompt: "明日は雨が降る___。不确定推测应填什么？", answer: "かもしれません", options: ["かもしれません", "に違いありません", "はずです", "べきです"] },
        { id: "n4-kamoshirenai-home", prompt: "もう家に帰った___。也许应填什么？", answer: "かもしれません", options: ["かもしれません", "わけです", "ところです", "ばかりです"] },
      ],
    },
    {
      grammarId: "n4-deshou",
      practiceTemplates: [
        { id: "n4-deshou-sunny", prompt: "明日は晴れる___。较有把握的推测应填什么？", answer: "でしょう", options: ["でしょう", "かもしれません", "んです", "つもりです"] },
        { id: "n4-deshou-hard", prompt: "この問題は難しい___。征求同意的推测应填什么？", answer: "でしょう", options: ["でしょう", "なさい", "たいです", "てください"] },
      ],
    },
    {
      grammarId: "n4-to-omou",
      practiceTemplates: [
        { id: "n4-to-omou-book", prompt: "この本はおもしろい___。发表看法应填什么？", answer: "と思います", options: ["と思います", "と言います", "そうです", "はずです"] },
        { id: "n4-to-omou-busy", prompt: "明日は忙しいだろう___。我认为应填什么？", answer: "と思います", options: ["と思います", "てください", "ことになります", "ばかりです"] },
      ],
    },
    {
      grammarId: "n4-sou-looks",
      practiceTemplates: [
        { id: "n4-sou-looks-cake", prompt: "このケーキはおいし___。看起来应填什么？", answer: "そうです", options: ["そうです", "らしいです", "べきです", "はずです"] },
        { id: "n4-sou-looks-rain", prompt: "雨が降り___。样子推测应填什么？", answer: "そうです", options: ["そうです", "みたいです", "ところです", "わけです"] },
      ],
    },
    {
      grammarId: "n4-yasui-nikui",
      practiceTemplates: [
        { id: "n4-yasui-nikui-pen", prompt: "このペンは書き___です。容易做应填什么？", answer: "やすい", options: ["やすい", "にくい", "がたい", "がち"] },
        { id: "n4-yasui-nikui-kanji", prompt: "この漢字は覚え___です。难以做应填什么？", answer: "にくい", options: ["にくい", "やすい", "っぽい", "ぎみ"] },
      ],
    },
    {
      grammarId: "n4-te-aru",
      practiceTemplates: [
        { id: "n4-te-aru-window", prompt: "窓が開け___。人为准备好的状态应填什么？", answer: "てあります", options: ["てあります", "ています", "ておきます", "てみます"] },
        { id: "n4-te-aru-docs", prompt: "資料が置い___。已经放好应填什么？", answer: "てあります", options: ["てあります", "てしまいます", "てくれます", "ていきます"] },
      ],
    },
    {
      grammarId: "n4-te-iku",
      practiceTemplates: [
        { id: "n4-te-iku-cold", prompt: "これから寒くなっ___。今后变化下去应填什么？", answer: "ていきます", options: ["ていきます", "てあります", "ておきます", "てしまいます"] },
        { id: "n4-te-iku-bring", prompt: "宿題を学校へ持っ___。带走应填什么？", answer: "ていきます", options: ["ていきます", "てきます", "てみます", "てあります"] },
      ],
    },
    {
      grammarId: "n4-kata",
      practiceTemplates: [
        { id: "n4-kata-read", prompt: "この漢字の読み___を教えてください。“方法”应填什么？", answer: "方", options: ["方", "まま", "せい", "はず"] },
        { id: "n4-kata-use", prompt: "パソコンの使い___がわかりません。做法应填什么？", answer: "方", options: ["方", "とおり", "ところ", "わけ"] },
      ],
    },
    {
      grammarId: "n4-ni-suru",
      practiceTemplates: [
        { id: "n4-ni-suru-tea", prompt: "飲み物はお茶___。点单选定应填什么？", answer: "にします", options: ["にします", "になります", "であります", "をします"] },
        { id: "n4-ni-suru-gift", prompt: "プレゼントは本___。选择应填什么？", answer: "にします", options: ["にします", "になります", "そうです", "はずです"] },
      ],
    },
    {
      grammarId: "n4-o-polite",
      practiceTemplates: [
        { id: "n4-o-polite-name", prompt: "___名前を書いてください。礼貌接头应填什么？", answer: "お", options: ["お", "ご", "を", "に"] },
        { id: "n4-o-polite-wait", prompt: "ここで___待ちください。礼貌请求应填什么？", answer: "お", options: ["お", "ご", "て", "に"] },
      ],
    },
  ]
