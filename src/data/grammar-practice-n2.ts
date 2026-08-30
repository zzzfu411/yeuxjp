import type { GrammarPracticeSet } from "./grammar-practice-types"

export const n2GrammarPracticeSets: GrammarPracticeSet[] = [
    {
      grammarId: "n2-temo",
      practiceTemplates: [
        { id: "n2-temo-rain", prompt: "雨が降っ___、授業はあります。即使也应填什么？", answer: "ても", options: ["ても", "たら", "のに", "つつ"] },
        { id: "n2-temo-price", prompt: "高く___、この辞書を買いたいです。让步应填什么？", answer: "ても", options: ["ても", "ては", "たら", "のに"] },
      ],
    },
    {
      grammarId: "n2-zuni",
      practiceTemplates: [
        { id: "n2-zuni-dict", prompt: "辞書を使わ___、訳してください。不……而应填什么？", answer: "ずに", options: ["ずに", "ないで", "なくて", "なければ"] },
        { id: "n2-zuni-breakfast", prompt: "朝ごはんを食べ___学校へ行きました。没做就去应填什么？", answer: "ずに", options: ["ずに", "ながら", "たびに", "ままに"] },
      ],
    },
    {
      grammarId: "n2-monoka",
      practiceTemplates: [
        { id: "n2-monoka-hard", prompt: "できる___。强烈否定应填什么？", answer: "ものか", options: ["ものか", "はずだ", "べきだ", "わけだ"] },
        { id: "n2-monoka-late", prompt: "二度と遅刻する___。绝不会应填什么？", answer: "ものか", options: ["ものか", "ところだ", "ばかりだ", "せいだ"] },
      ],
    },
    {
      grammarId: "n2-ageku",
      practiceTemplates: [
        { id: "n2-ageku-choose", prompt: "迷った___、安いほうを選びました。折腾后的结果应填什么？", answer: "あげく", options: ["あげく", "上で", "うちに", "たびに"] },
        { id: "n2-ageku-wait", prompt: "待った___、会うことができませんでした。坏结果应填什么？", answer: "あげく", options: ["あげく", "おかげで", "とおりに", "つもりで"] },
      ],
    },
    {
      grammarId: "n2-kuse-ni",
      practiceTemplates: [
        { id: "n2-kuse-ni-student", prompt: "学生の___、宿題をしません。明明应填什么？", answer: "くせに", options: ["くせに", "せいで", "おかげで", "とおりに"] },
        { id: "n2-kuse-ni-know", prompt: "知っている___、教えてくれません。责怪应填什么？", answer: "くせに", options: ["くせに", "ために", "ままに", "うちに"] },
      ],
    },
    {
      grammarId: "n2-bakari-ka",
      practiceTemplates: [
        { id: "n2-bakari-ka-kanji", prompt: "漢字が書ける___、敬語も使えます。不但应填什么？", answer: "ばかりか", options: ["ばかりか", "ばかりだ", "どころか", "はずだ"] },
        { id: "n2-bakari-ka-late", prompt: "遅刻した___、宿題も忘れてきました。不但……而且应填什么？", answer: "ばかりか", options: ["ばかりか", "だけあって", "にもかかわらず", "にすぎない"] },
      ],
    },
    {
      grammarId: "n2-shidai",
      practiceTemplates: [
        { id: "n2-shidai-know", prompt: "分かり___連絡します。一……就应填什么？", answer: "次第", options: ["次第", "たびに", "うちに", "ままに"] },
        { id: "n2-shidai-arrive", prompt: "到着___、メールをください。立刻应填什么？", answer: "次第", options: ["次第", "最中", "途中", "以上"] },
      ],
    },
    {
      grammarId: "n2-gachi",
      practiceTemplates: [
        { id: "n2-gachi-cold", prompt: "冬は風邪を引き___です。容易陷入的倾向应填什么？", answer: "がち", options: ["がち", "ぎみ", "っぽい", "らしい"] },
        { id: "n2-gachi-meal", prompt: "食事を抜き___です。负面习惯应填什么？", answer: "がち", options: ["がち", "かけ", "きり", "まま"] },
      ],
    },
    {
      grammarId: "n2-koto-wanai",
      practiceTemplates: [
        { id: "n2-koto-wanai-mistake", prompt: "気にする___。不必应填什么？", answer: "ことはありません", options: ["ことはありません", "ことがありません", "わけがありません", "はずがありません"] },
        { id: "n2-koto-wanai-hurry", prompt: "急ぐ___。没有必要应填什么？", answer: "ことはありません", options: ["ことはありません", "しかありません", "べきではありません", "わけではありません"] },
      ],
    },
    {
      grammarId: "n2-mai",
      practiceTemplates: [
        { id: "n2-mai-lie", prompt: "もう二度と嘘はつく___。否定意志应填什么？", answer: "まい", options: ["まい", "べき", "ぬ", "がち"] },
        { id: "n2-mai-say", prompt: "そんなことは言う___。大概不会应填什么？", answer: "まい", options: ["まい", "たい", "はず", "せい"] },
      ],
    },
    {
      grammarId: "n2-nu",
      practiceTemplates: [
        { id: "n2-nu-problem", prompt: "予想せ___問題が出ました。书面否定应填什么？", answer: "ぬ", options: ["ぬ", "ない", "ず", "ん"] },
        { id: "n2-nu-person", prompt: "知ら___人に道を聞きました。古风否定应填什么？", answer: "ぬ", options: ["ぬ", "ない", "ず", "ん"] },
      ],
    },
    {
      grammarId: "n2-zaruenai",
      practiceTemplates: [
        { id: "n2-zaruenai-plan", prompt: "予定を変更せ___。不得不应填什么？", answer: "ざるを得ない", options: ["ざるを得ない", "なければならない", "わけにはいかない", "しかない"] },
        { id: "n2-zaruenai-fact", prompt: "事実を認め___ません。无奈承认应填什么？", answer: "ざるを得", options: ["ざるを得", "なければならない", "わけにはいか", "しかあり"] },
      ],
    },
    {
      grammarId: "n2-yara",
      practiceTemplates: [
        { id: "n2-yara-bag", prompt: "荷物___切符やらで、かばんがいっぱいです。杂乱列举应填什么？", answer: "やら", options: ["やら", "や", "とか", "し"] },
        { id: "n2-yara-study", prompt: "漢字___文法やら、覚えることがたくさんあります。又是……又是应填什么？", answer: "やら", options: ["やら", "たり", "し", "と"] },
      ],
    },
    {
      grammarId: "n2-shikanai",
      practiceTemplates: [
        { id: "n2-shikanai-walk", prompt: "歩く___。别无选择应填什么？", answer: "しかない", options: ["しかない", "だけある", "ばかりだ", "べきだ"] },
        { id: "n2-shikanai-study", prompt: "毎日勉強する___ません。只能应填什么？", answer: "しかあり", options: ["しかあり", "だけあり", "ばかりあり", "はずあり"] },
      ],
    },
    {
      grammarId: "n2-sae-ba",
      practiceTemplates: [
        { id: "n2-sae-ba-time", prompt: "時間___あれば、手伝います。只要应填什么？", answer: "さえ", options: ["さえ", "まで", "ほど", "しか"] },
        { id: "n2-sae-ba-dict", prompt: "辞書___あれば、一人で調べられます。唯一条件应填什么？", answer: "さえ", options: ["さえ", "でも", "には", "とは"] },
      ],
    },
    {
      grammarId: "n2-beki",
      practiceTemplates: [
        { id: "n2-beki-promise", prompt: "約束は守る___です。应当应填什么？", answer: "べき", options: ["べき", "まい", "がち", "まま"] },
        { id: "n2-beki-ask", prompt: "わからないことは聞く___だ。按道理应填什么？", answer: "べき", options: ["べき", "つもり", "ところ", "せい"] },
      ],
    },
    {
      grammarId: "n2-wake-dewa-nai",
      practiceTemplates: [
        { id: "n2-wake-dewa-nai-all", prompt: "全部わかる___。并非全部如此应填什么？", answer: "わけではない", options: ["わけではない", "わけがない", "はずがない", "しかない"] },
        { id: "n2-wake-dewa-nai-go", prompt: "行きたくない___ません。并不是应填什么？", answer: "わけではあり", options: ["わけではあり", "わけがあり", "はずではあり", "べきではあり"] },
      ],
    },
    {
      grammarId: "n2-ni-suginai",
      practiceTemplates: [
        { id: "n2-ni-suginai-opinion", prompt: "これは私の意見___。只不过应填什么？", answer: "にすぎません", options: ["にすぎません", "にほかなりません", "に違いありません", "に基づきます"] },
        { id: "n2-ni-suginai-start", prompt: "始めたばかり___。不过如此应填什么？", answer: "にすぎない", options: ["にすぎない", "にほかならない", "に違いない", "に伴う"] },
      ],
    },
    {
      grammarId: "n2-ni-hokanaranai",
      practiceTemplates: [
        { id: "n2-ni-hokanaranai-effort", prompt: "毎日の努力___。正是应填什么？", answer: "にほかならない", options: ["にほかならない", "にすぎない", "に対する", "に関する"] },
        { id: "n2-ni-hokanaranai-fail", prompt: "失敗は準備不足___。不是别的正是应填什么？", answer: "にほかなりません", options: ["にほかなりません", "にすぎません", "にすぎないです", "に違いすぎます"] },
      ],
    },
    {
      grammarId: "n2-ue-ni",
      practiceTemplates: [
        { id: "n2-ue-ni-shop", prompt: "安い___、味もいいです。而且应填什么？", answer: "上に", options: ["上に", "上で", "うちに", "たびに"] },
        { id: "n2-ue-ni-busy", prompt: "忙しい___、体調もよくないそうです。叠加应填什么？", answer: "上に", options: ["上に", "あげくに", "くせに", "せいで"] },
      ],
    },
    {
      grammarId: "n2-ippo-de",
      practiceTemplates: [
        { id: "n2-ippo-de-convenient", prompt: "便利な___、依存しやすくなります。另一方面应填什么？", answer: "一方で", options: ["一方で", "反面", "上で", "上に"] },
        { id: "n2-ippo-de-city", prompt: "都市は便利な___、家賃が高いです。另一面应填什么？", answer: "一方で", options: ["一方で", "ついでに", "とおりに", "ままに"] },
      ],
    },
    {
      grammarId: "n2-hanmen",
      practiceTemplates: [
        { id: "n2-hanmen-job", prompt: "給料が高い___、残業も多いです。正反两面应填什么？", answer: "反面", options: ["反面", "一方", "上で", "あげく"] },
        { id: "n2-hanmen-net", prompt: "ネットは便利な___、注意も必要です。反面应填什么？", answer: "反面", options: ["反面", "たびに", "うちに", "ままに"] },
      ],
    },
    {
      grammarId: "n2-wo-megutte",
      practiceTemplates: [
        { id: "n2-wo-megutte-rule", prompt: "新しい校則___、意見が分かれています。围绕应填什么？", answer: "をめぐって", options: ["をめぐって", "を問わず", "にとって", "について"] },
        { id: "n2-wo-megutte-plan", prompt: "この計画___会議が開かれました。以……为中心应填什么？", answer: "をめぐって", options: ["をめぐって", "に基づいて", "に伴って", "にあたって"] },
      ],
    },
    {
      grammarId: "n2-wo-towazu",
      practiceTemplates: [
        { id: "n2-wo-towazu-age", prompt: "年齢___利用できます。不论应填什么？", answer: "を問わず", options: ["を問わず", "をめぐって", "に対して", "にとって"] },
        { id: "n2-wo-towazu-exp", prompt: "経験___、申し込めます。不限条件应填什么？", answer: "を問わず", options: ["を問わず", "に際して", "にしたがって", "にもかかわらず"] },
      ],
    },
    {
      grammarId: "n2-ni-atatte",
      practiceTemplates: [
        { id: "n2-ni-atatte-grad", prompt: "卒業___、お礼を申し上げます。值此应填什么？", answer: "にあたって", options: ["にあたって", "に対して", "にとって", "について"] },
        { id: "n2-ni-atatte-term", prompt: "学期を始める___、目標を書きましょう。在重要节点应填什么？", answer: "にあたって", options: ["にあたって", "を問わず", "をめぐって", "にすぎず"] },
      ],
    },
    {
      grammarId: "n2-ni-saishite",
      practiceTemplates: [
        { id: "n2-ni-saishite-enter", prompt: "入学___、書類を提出してください。之际应填什么？", answer: "に際して", options: ["に際して", "に対して", "にとって", "によって"] },
        { id: "n2-ni-saishite-return", prompt: "帰国___、先生にあいさつしました。正当其事应填什么？", answer: "に際して", options: ["に際して", "に伴って", "に基づいて", "をめぐって"] },
      ],
    },
    {
      grammarId: "n2-tsutsu-aru",
      practiceTemplates: [
        { id: "n2-tsutsu-aru-skill", prompt: "能力は向上し___。正在逐渐应填什么？", answer: "つつあります", options: ["つつあります", "てあります", "ておきます", "てしまいます"] },
        { id: "n2-tsutsu-aru-env", prompt: "改善され___。变化进行中应填什么？", answer: "つつある", options: ["つつある", "つつも", "ながらも", "たびに"] },
      ],
    },
    {
      grammarId: "n2-kaneru",
      practiceTemplates: [
        { id: "n2-kaneru-request", prompt: "そのご依頼には応じ___。委婉拒绝应填什么？", answer: "かねます", options: ["かねます", "がたいです", "にくいです", "ざるを得ません"] },
        { id: "n2-kaneru-answer", prompt: "今すぐお答えし___。难以立刻做应填什么？", answer: "かねます", options: ["かねます", "つつあります", "がちです", "べきです"] },
      ],
    },
    {
      grammarId: "n2-gatai",
      practiceTemplates: [
        { id: "n2-gatai-effort", prompt: "彼の努力は忘れ___です。心理上难以应填什么？", answer: "がたい", options: ["がたい", "やすい", "がち", "ぎみ"] },
        { id: "n2-gatai-believe", prompt: "この説明では信じ___。难以相信应填什么？", answer: "がたい", options: ["がたい", "かねる", "にくい", "っぽい"] },
      ],
    },
    {
      grammarId: "n2-dokoroka",
      practiceTemplates: [
        { id: "n2-dokoroka-rest", prompt: "休む___、残業までしました。哪里谈得上应填什么？", answer: "どころか", options: ["どころか", "ばかりか", "だけあって", "にもかかわらず"] },
        { id: "n2-dokoroka-easy", prompt: "簡単___、かなり難しいです。远非应填什么？", answer: "どころか", options: ["どころか", "にすぎず", "にほかならず", "をめぐって"] },
      ],
    },
    {
      grammarId: "n2-dake-atte",
      practiceTemplates: [
        { id: "n2-dake-atte-teacher", prompt: "先生___、説明がわかりやすいです。不愧应填什么？", answer: "だけあって", options: ["だけあって", "どころか", "ばかりか", "にすぎず"] },
        { id: "n2-dake-atte-practice", prompt: "練習した___、発表は成功しました。正因为如此应填什么？", answer: "だけあって", options: ["だけあって", "あげく", "くせに", "せいで"] },
      ],
    },
    {
      grammarId: "n2-koto-kara",
      practiceTemplates: [
        { id: "n2-koto-kara-window", prompt: "窓が開いている___、誰かいるとわかりました。据此推断应填什么？", answer: "ことから", options: ["ことから", "ところから", "せいで", "くせに"] },
        { id: "n2-koto-kara-q", prompt: "質問が多い___、この課は難しいようです。从这一事实应填什么？", answer: "ことから", options: ["ことから", "をめぐって", "を問わず", "に際して"] },
      ],
    },
    {
      grammarId: "n2-ni-motozuite",
      practiceTemplates: [
        { id: "n2-ni-motozuite-survey", prompt: "調査___、報告を書きます。基于应填什么？", answer: "に基づいて", options: ["に基づいて", "に伴って", "にあたって", "に際して"] },
        { id: "n2-ni-motozuite-rule", prompt: "規則___判断してください。作为根据应填什么？", answer: "に基づいて", options: ["に基づいて", "をめぐって", "を問わず", "にとって"] },
      ],
    },
    {
      grammarId: "n2-kakawarazu",
      practiceTemplates: [
        { id: "n2-kakawarazu-rain", prompt: "雨___、試合は行われました。尽管应填什么？", answer: "にもかかわらず", options: ["にもかかわらず", "にしたがって", "に伴って", "にあたって"] },
        { id: "n2-kakawarazu-explain", prompt: "説明した___、まだ間違えます。按理相反应填什么？", answer: "にもかかわらず", options: ["にもかかわらず", "だけあって", "どころか", "にすぎず"] },
      ],
    },
    {
      grammarId: "n2-tomonatte",
      practiceTemplates: [
        { id: "n2-tomonatte-temp", prompt: "気温の上昇___、冷房の使用が増えます。伴随应填什么？", answer: "に伴って", options: ["に伴って", "に対して", "にとって", "について"] },
        { id: "n2-tomonatte-increase", prompt: "留学生の増加___、案内も増えました。随着一起变化应填什么？", answer: "に伴って", options: ["に伴って", "をめぐって", "を問わず", "にすぎず"] },
      ],
    },
  ]
