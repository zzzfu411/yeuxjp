export interface NuancePoint {
  id: string;
  title: string;
  pair: [string, string];
  meaning: [string, string];
  explanation: string;
  examples: {
    sentence: string;
    translation: string;
    nuance: string;
  }[];
}

export const semanticsData: NuancePoint[] = [
  // ==========================================
  // 1. 基础动词辨析 (Basic Verbs) - 20条
  // ==========================================
  {
    id: "s-shiru-wakaru",
    title: "知る vs 分かる",
    pair: ["知る", "分かる"],
    meaning: ["Know (Data)", "Understand (Logic)"],
    explanation: "'知る'是拥有信息；'分かる'是理解逻辑或共情。",
    examples: [{ sentence: "住所を知っている。", translation: "知道地址。", nuance: "信息。" }]
  },
  {
    id: "s-miru-kinds",
    title: "見る vs 観る vs 診る",
    pair: ["見る", "観る/診る"],
    meaning: ["See", "Watch/Examine"],
    explanation: "通用 vs 欣赏/医疗。",
    examples: [{ sentence: "映画を観る。", translation: "看电影。", nuance: "欣赏。" }]
  },
  {
    id: "s-kiku-kinds",
    title: "聞く vs 聴く vs 訊く",
    pair: ["聞く", "聴く/訊く"],
    meaning: ["Hear/Ask", "Listen/Inquire"],
    explanation: "自然听到 vs 倾听(音乐) vs 询问(问题)。",
    examples: [{ sentence: "音楽を聴く。", translation: "听音乐。", nuance: "倾听。" }]
  },
  {
    id: "s-au-aeru",
    title: "会う vs 会える",
    pair: ["会う", "会える"],
    meaning: ["Meet", "Can meet"],
    explanation: "会える常含'期待重逢'的语感。",
    examples: [{ sentence: "また会えるよ。", translation: "还能再见的。", nuance: "希望。" }]
  },
  {
    id: "s-aru-iru",
    title: "ある vs いる",
    pair: ["ある", "いる"],
    meaning: ["Exist (Thing)", "Exist (Living)"],
    explanation: "无生命 vs 有生命。",
    examples: [{ sentence: "猫がいる。", translation: "有猫。", nuance: "生物。" }]
  },
  {
    id: "s-ageru-kureru",
    title: "あげる vs くれる",
    pair: ["あげる", "くれる"],
    meaning: ["Give (Out)", "Give (In)"],
    explanation: "我给别人 vs 别人给我。",
    examples: [{ sentence: "くれた。", translation: "给了我。", nuance: "恩惠。" }]
  },
  {
    id: "s-morau-itadaku",
    title: "もらう vs いただく",
    pair: ["もらう", "いただく"],
    meaning: ["Receive", "Receive (Humble)"],
    explanation: "一般 vs 敬语。",
    examples: [{ sentence: "いただく。", translation: "领受。", nuance: "感激。" }]
  },
  {
    id: "s-kariru-kasu",
    title: "借りる vs 貸す",
    pair: ["借りる", "貸す"],
    meaning: ["Borrow", "Lend"],
    explanation: "借入 vs 借出。",
    examples: [{ sentence: "本を借りる。", translation: "借书（进来）。", nuance: "我要用。" }]
  },
  {
    id: "s-narau-manabu",
    title: "習う vs 学ぶ",
    pair: ["習う", "学ぶ"],
    meaning: ["Learn (Skill)", "Study (Academic)"],
    explanation: "跟老师学技能 vs 学术/抽象学习。",
    examples: [{ sentence: "ピアノを習う。", translation: "学钢琴。", nuance: "技能。" }]
  },
  {
    id: "s-oshieru-tsutaeru",
    title: "教える vs 伝える",
    pair: ["教える", "伝える"],
    meaning: ["Teach/Tell", "Convey"],
    explanation: "教导知识 vs 传达信息。",
    examples: [{ sentence: "伝言を伝える。", translation: "传话。", nuance: "转达。" }]
  },
  {
    id: "s-omou-kangaeru",
    title: "思う vs 考える",
    pair: ["思う", "考える"],
    meaning: ["Feel/Think (Subjective)", "Think (Logical)"],
    explanation: "情感/直觉 vs 逻辑思考。",
    examples: [{ sentence: "そう思う。", translation: "我这么觉得。", nuance: "直觉。" }]
  },
  {
    id: "s-kiru-tatsu",
    title: "切る vs 断つ",
    pair: ["切る", "断つ"],
    meaning: ["Cut", "Sever/Abstain"],
    explanation: "物理切断 vs 抽象断绝（烟酒/关系）。",
    examples: [{ sentence: "酒を断つ。", translation: "戒酒。", nuance: "决心。" }]
  },
  {
    id: "s-naosu-kurasu",
    title: "直す vs 治す",
    pair: ["直す", "治す"],
    meaning: ["Repair", "Cure"],
    explanation: "修理物品 vs 治疗疾病。",
    examples: [{ sentence: "風邪を治す。", translation: "治感冒。", nuance: "健康。" }]
  },
  {
    id: "s-noboru-kinds",
    title: "上る vs 登る vs 昇る",
    pair: ["上る", "登る/昇る"],
    meaning: ["Go up", "Climb/Rise"],
    explanation: "一般向上 vs 费力攀登/太阳升起。",
    examples: [{ sentence: "山に登る。", translation: "登山。", nuance: "费力。" }]
  },
  {
    id: "s-tsutomeru-kinds",
    title: "勤める vs 務める vs 努める",
    pair: ["勤める", "務める/努める"],
    meaning: ["Work for", "Serve as/Strive"],
    explanation: "就职 vs 担任职务 vs 努力。",
    examples: [{ sentence: "会社に勤める。", translation: "在公司上班。", nuance: "就职。" }]
  },
  {
    id: "s-kawaru-kinds",
    title: "変わる vs 代わる vs 換わる",
    pair: ["変わる", "代わる/換わる"],
    meaning: ["Change", "Replace/Exchange"],
    explanation: "变化 vs 代替/交换。",
    examples: [{ sentence: "席を代わる。", translation: "换座位（代替）。", nuance: "接替。" }]
  },
  {
    id: "s-hakaru-kinds",
    title: "計る vs 測る vs 量る",
    pair: ["計る", "測る/量る"],
    meaning: ["Time", "Measure/Weigh"],
    explanation: "时间 vs 长度面积 vs 重量容积。",
    examples: [{ sentence: "体重を量る。", translation: "称体重。", nuance: "重量。" }]
  },
  {
    id: "s-toru-kinds",
    title: "取る vs 撮る vs 採る",
    pair: ["取る", "撮る/採る"],
    meaning: ["Take", "Photo/Adopt"],
    explanation: "拿 vs 拍照 vs 采用/采集。",
    examples: [{ sentence: "写真を撮る。", translation: "拍照。", nuance: "摄影。" }]
  },
  {
    id: "s-utsusu-kinds",
    title: "写す vs 映す vs 移す",
    pair: ["写す", "映す/移す"],
    meaning: ["Copy/Photo", "Reflect/Project/Move"],
    explanation: "抄写拍照 vs 映照 vs 移动。",
    examples: [{ sentence: "鏡に映す。", translation: "照镜子。", nuance: "映像。" }]
  },
  {
    id: "s-au-kinds",
    title: "合う vs 遭う",
    pair: ["合う", "遭う"],
    meaning: ["Fit/Match", "Encounter (Bad)"],
    explanation: "合适 vs 遭遇灾难。",
    examples: [{ sentence: "事故に遭う。", translation: "遭遇事故。", nuance: "不幸。" }]
  },

  // ==========================================
  // 2. 形容词与情感 (Adjectives & Emotions) - 20条
  // ==========================================
  {
    id: "s-ureshii-tanoshii",
    title: "嬉しい vs 楽しい",
    pair: ["嬉しい", "楽しい"],
    meaning: ["Happy (Result)", "Fun (Process)"],
    explanation: "结果高兴 vs 过程愉快。",
    examples: [{ sentence: "楽しい旅行。", translation: "愉快的旅行。", nuance: "过程。" }]
  },
  {
    id: "s-sabishii-koishii",
    title: "寂しい vs 恋しい",
    pair: ["寂しい", "恋しい"],
    meaning: ["Lonely", "Miss/Yearn"],
    explanation: "孤单(负面) vs 怀念(正面)。",
    examples: [{ sentence: "故郷が恋しい。", translation: "想家。", nuance: "爱恋。" }]
  },
  {
    id: "s-atsui-kinds",
    title: "暑い vs 熱い vs 厚い",
    pair: ["暑い", "熱い/厚い"],
    meaning: ["Hot (Weather)", "Hot (Touch)/Thick"],
    explanation: "气温 vs 触感/热情 vs 厚度/深情。",
    examples: [{ sentence: "熱いお茶。", translation: "热茶。", nuance: "触感。" }]
  },
  {
    id: "s-hayai-kinds",
    title: "速い vs 早い",
    pair: ["速い", "早い"],
    meaning: ["Fast (Speed)", "Early (Time)"],
    explanation: "速度快 vs 时间早。",
    examples: [{ sentence: "足が速い。", translation: "跑得快。", nuance: "速度。" }]
  },
  {
    id: "s-yasashii-kinds",
    title: "易しい vs 優しい",
    pair: ["易しい", "優しい"],
    meaning: ["Easy", "Kind/Gentle"],
    explanation: "容易 vs 温柔。",
    examples: [{ sentence: "優しい人。", translation: "温柔的人。", nuance: "性格。" }]
  },
  {
    id: "s-takai-kinds",
    title: "高い (Height vs Cost)",
    pair: ["高い (高)", "高い (貴)"],
    meaning: ["High", "Expensive"],
    explanation: "物理高度 vs 价格。",
    examples: [{ sentence: "背が高い。", translation: "个子高。", nuance: "高度。" }]
  },
  {
    id: "s-kowai-osoroshii",
    title: "怖い vs 恐ろしい",
    pair: ["怖い", "恐ろしい"],
    meaning: ["Scary (Feeling)", "Terrifying (Objective)"],
    explanation: "主观害怕 vs 客观恐怖。",
    examples: [{ sentence: "恐ろしい事件。", translation: "恐怖的案件。", nuance: "性质恶劣。" }]
  },
  {
    id: "s-umai-oishii",
    title: "うまい vs おいしい",
    pair: ["うまい", "おいしい"],
    meaning: ["Good/Tasty (Casual)", "Delicious (Polite)"],
    explanation: "高超/好吃(粗鲁) vs 好吃(礼貌)。",
    examples: [{ sentence: "うまい！", translation: "好吃/干得好！", nuance: "男性/随意。" }]
  },
  {
    id: "s-kibou-nozomi",
    title: "希望 vs 望み",
    pair: ["希望", "望み"],
    meaning: ["Hope (Formal)", "Wish/Desire"],
    explanation: "书面 vs 也就是愿望。",
    examples: [{ sentence: "望みを捨てるな。", translation: "别放弃希望。", nuance: "内心愿望。" }]
  },
  {
    id: "s-koukai-zanen",
    title: "後悔 vs 残念",
    pair: ["後悔", "残念"],
    meaning: ["Regret (Action)", "Pity/Regret (Result)"],
    explanation: "对自己行为的悔恨 vs 对结果的遗憾。",
    examples: [{ sentence: "残念だ。", translation: "真遗憾。", nuance: "可惜。" }]
  },
  {
    id: "s-shinpai-fuan",
    title: "心配 vs 不安",
    pair: ["心配", "不安"],
    meaning: ["Worry (Specific)", "Anxiety (Vague)"],
    explanation: "对某事的担心 vs 莫名的不安。",
    examples: [{ sentence: "将来が不安だ。", translation: "对未来感到不安。", nuance: "模糊的恐惧。" }]
  },
  {
    id: "s-shitashii-nakayoshi",
    title: "親しい vs 仲良し",
    pair: ["親しい", "仲良し"],
    meaning: ["Close (Formal/State)", "Good Friends"],
    explanation: "关系亲密 vs 好朋友。",
    examples: [{ sentence: "親しい友人。", translation: "密友。", nuance: "状态描述。" }]
  },
  {
    id: "s-utsukushii-kirei",
    title: "美しい vs きれい",
    pair: ["美しい", "きれい"],
    meaning: ["Beautiful (Art/Nature)", "Pretty/Clean"],
    explanation: "美感/感动 vs 漂亮/干净。",
    examples: [{ sentence: "美しい心。", translation: "美丽的心灵。", nuance: "感动。" }]
  },
  {
    id: "s-chiisai-komakai",
    title: "小さい vs 細かい",
    pair: ["小さい", "細かい"],
    meaning: ["Small (Size)", "Fine/Detailed"],
    explanation: "体积小 vs 颗粒细/琐碎。",
    examples: [{ sentence: "細かいお金。", translation: "零钱。", nuance: "细碎。" }]
  },
  {
    id: "s-kura-yami",
    title: "暗い vs 闇",
    pair: ["暗い", "闇"],
    meaning: ["Dark (Adj)", "Darkness (Noun)"],
    explanation: "光线暗/性格阴暗 vs 黑暗本身。",
    examples: [{ sentence: "闇に落ちる。", translation: "堕入黑暗。", nuance: "名词。" }]
  },
  {
    id: "s-itai-kurushii",
    title: "痛い vs 苦しい",
    pair: ["痛い", "苦しい"],
    meaning: ["Painful (Physical)", "Suffering/Tight"],
    explanation: "疼 vs 难受/痛苦/呼吸困难。",
    examples: [{ sentence: "息が苦しい。", translation: "呼吸困难。", nuance: "压迫感。" }]
  },
  {
    id: "s-katai-kinds",
    title: "固い vs 硬い vs 堅い",
    pair: ["固い", "硬い/堅い"],
    meaning: ["Solid/Firm", "Hard (Material)/Strict"],
    explanation: "稳固/团结 vs 材质硬 vs 坚守/死板。",
    examples: [{ sentence: "口が堅い。", translation: "口风紧。", nuance: "意志。" }]
  },
  {
    id: "s-marui-kinds",
    title: "丸い vs 円い",
    pair: ["丸い", "円い"],
    meaning: ["Round (Sphere)", "Round (Circle)"],
    explanation: "立体圆/球形 vs 平面圆。",
    examples: [{ sentence: "地球は丸い。", translation: "地球是圆的。", nuance: "球体。" }]
  },
  {
    id: "s-samui-tsumetai",
    title: "寒い vs 冷たい",
    pair: ["寒い", "冷たい"],
    meaning: ["Cold (Weather)", "Cold (Touch/Personality)"],
    explanation: "气温 vs 触感/性格冷淡。",
    examples: [{ sentence: "冷たい水。", translation: "凉水。", nuance: "触感。" }]
  },
  {
    id: "s-okashii-hen",
    title: "おかしい vs 変",
    pair: ["おかしい", "変"],
    meaning: ["Funny/Strange", "Weird/Odd"],
    explanation: "好笑/反常 vs 奇怪。",
    examples: [{ sentence: "頭がおかしい。", translation: "脑子有病。", nuance: "反常。" }]
  },

  // ==========================================
  // 3. 名词与概念 (Nouns & Concepts) - 20条
  // ==========================================
  {
    id: "s-kokoro-mune",
    title: "心 vs 胸",
    pair: ["心", "胸"],
    meaning: ["Mind/Spirit", "Chest/Feeling"],
    explanation: "精神 vs 身体情绪。",
    examples: [{ sentence: "胸が躍る。", translation: "雀跃不已。", nuance: "身体反应。" }]
  },
  {
    id: "s-nakama-tomodachi",
    title: "仲間 vs 友達",
    pair: ["仲間", "友達"],
    meaning: ["Comrade/Ally", "Friend"],
    explanation: "命运共同体 vs 朋友。",
    examples: [{ sentence: "俺たちは仲間だ。", translation: "我们是伙伴。", nuance: "羁绊。" }]
  },
  {
    id: "s-teki-kataki",
    title: "敵 vs 仇",
    pair: ["敵", "仇"],
    meaning: ["Enemy", "Vengeance Target"],
    explanation: "对手/敌人 vs 仇人。",
    examples: [{ sentence: "親の仇。", translation: "杀父之仇。", nuance: "复仇。" }]
  },
  {
    id: "s-ai-koi",
    title: "愛 vs 恋",
    pair: ["愛 (Ai)", "恋 (Koi)"],
    meaning: ["Love (Deep/Giving)", "Love (Passion/Wanting)"],
    explanation: "无偿的爱/大爱 vs 激情的恋/想占有。",
    examples: [{ sentence: "恋に落ちる。", translation: "坠入爱河。", nuance: "激情。" }]
  },
  {
    id: "s-uchi-ie",
    title: "うち vs 家",
    pair: ["うち", "家"],
    meaning: ["My Home/Us", "House/Building"],
    explanation: "我的家/我们圈子 vs 房子。",
    examples: [{ sentence: "うちにおいで。", translation: "来我家玩。", nuance: "归属感。" }]
  },
  {
    id: "s-kuni-kokyou",
    title: "国 vs 故郷",
    pair: ["国", "故郷"],
    meaning: ["Country/Hometown", "Hometown"],
    explanation: "在口语中'国'常指故乡（老家）。",
    examples: [{ sentence: "国に帰る。", translation: "回老家。", nuance: "口语。" }]
  },
  {
    id: "s-hi-kinds",
    title: "日 vs 陽 vs 火",
    pair: ["日", "陽/火"],
    meaning: ["Day/Sun", "Sunshine/Fire"],
    explanation: "日子/太阳 vs 阳光 vs 火。",
    examples: [{ sentence: "陽が当たる。", translation: "照到阳光。", nuance: "光线。" }]
  },
  {
    id: "s-michi-kinds",
    title: "道 vs 径 vs 途",
    pair: ["道", "径/途"],
    meaning: ["Road/Way", "Path/Route"],
    explanation: "道路/道理 vs 小径 vs 用途/途径。",
    examples: [{ sentence: "使途不明。", translation: "用途不明。", nuance: "用途。" }]
  },
  {
    id: "s-hashi-kinds",
    title: "橋 vs 箸 vs 端",
    pair: ["橋", "箸/端"],
    meaning: ["Bridge", "Chopsticks/Edge"],
    explanation: "音调不同：桥(2) 筷子(1) 边缘(0)。",
    examples: [{ sentence: "橋を渡る。", translation: "过桥。", nuance: "建筑。" }]
  },
  {
    id: "s-hana-kinds",
    title: "花 vs 鼻",
    pair: ["花", "鼻"],
    meaning: ["Flower", "Nose"],
    explanation: "音调不同：花(2) 鼻(0)。",
    examples: [{ sentence: "鼻が高い。", translation: "骄傲/得意。", nuance: "鼻子。" }]
  },
  {
    id: "s-kumo-kinds",
    title: "雲 vs 蜘蛛",
    pair: ["雲", "蜘蛛"],
    meaning: ["Cloud", "Spider"],
    explanation: "音调不同：云(1) 蜘蛛(2)。",
    examples: [{ sentence: "雲が流れる。", translation: "云在飘。", nuance: "天象。" }]
  },
  {
    id: "s-ame-kinds",
    title: "雨 vs 飴",
    pair: ["雨", "飴"],
    meaning: ["Rain", "Candy"],
    explanation: "音调不同：雨(1) 糖(0)。",
    examples: [{ sentence: "飴を舐める。", translation: "舔糖。", nuance: "食物。" }]
  },
  {
    id: "s-sake-shake",
    title: "酒 vs 鮭",
    pair: ["酒 (Sake)", "鮭 (Shake/Sake)"],
    meaning: ["Alcohol", "Salmon"],
    explanation: "酒 vs 三文鱼。",
    examples: [{ sentence: "酒を飲む。", translation: "喝酒。", nuance: "饮料。" }]
  },
  {
    id: "s-kao-omote",
    title: "顔 vs 面",
    pair: ["顔", "面"],
    meaning: ["Face", "Mask/Surface"],
    explanation: "脸 vs 面具/表面。",
    examples: [{ sentence: "面の皮が厚い。", translation: "脸皮厚。", nuance: "面具。" }]
  },
  {
    id: "s-otoko-kan",
    title: "男 vs 漢",
    pair: ["男", "漢"],
    meaning: ["Male", "Manly Man"],
    explanation: "生理男性 vs 真正的男子汉。",
    examples: [{ sentence: "漢を見せる。", translation: "展现男子气概。", nuance: "热血。" }]
  },
  {
    id: "s-on-oto",
    title: "音 vs 声",
    pair: ["音", "声"],
    meaning: ["Sound (Thing)", "Voice (Living)"],
    explanation: "物体发声 vs 嗓音。",
    examples: [{ sentence: "雨の音。", translation: "雨声。", nuance: "自然声。" }]
  },
  {
    id: "s-toki-jikoku",
    title: "時間 vs 時刻",
    pair: ["時間", "時刻"],
    meaning: ["Time (Duration)", "Time (Point)"],
    explanation: "时长/泛指 vs 具体的时刻。",
    examples: [{ sentence: "到着時刻。", translation: "到达时刻。", nuance: "时间点。" }]
  },
  {
    id: "s-basho-tokoro",
    title: "場所 vs 所",
    pair: ["場所", "所"],
    meaning: ["Place (Physical)", "Place/Aspect"],
    explanation: "地点 vs 地方/抽象方面。",
    examples: [{ sentence: "いい所がある。", translation: "有优点。", nuance: "抽象。" }]
  },
  {
    id: "s-mono-koto",
    title: "物 vs 事",
    pair: ["物", "事"],
    meaning: ["Thing (Physical)", "Thing (Abstract/Event)"],
    explanation: "实物 vs 事情/概念。",
    examples: [{ sentence: "大事なこと。", translation: "重要的事。", nuance: "抽象。" }]
  },
  {
    id: "s-hito-kata",
    title: "人 vs 方",
    pair: ["人", "方"],
    meaning: ["Person", "Person (Polite)"],
    explanation: "人 vs 这位/方。",
    examples: [{ sentence: "あの方。", translation: "那位。", nuance: "敬语。" }]
  },

  // ==========================================
  // 4. 第一人称与代词 (Pronouns) - 10条
  // ==========================================
  {
    id: "s-watashi-ore",
    title: "私 vs 俺",
    pair: ["私", "俺"],
    meaning: ["I (Standard)", "I (Male/Rough)"],
    explanation: "标准 vs 粗鲁自信。",
    examples: [{ sentence: "俺が決める。", translation: "老子决定。", nuance: "霸气。" }]
  },
  {
    id: "s-boku-ore",
    title: "僕 vs 俺",
    pair: ["僕", "俺"],
    meaning: ["I (Boyish/Humble)", "I (Male)"],
    explanation: "温和谦逊 vs 强势。",
    examples: [{ sentence: "僕は守る。", translation: "我会守护。", nuance: "少年感。" }]
  },
  {
    id: "s-atashi-watashi",
    title: "あたし vs 私",
    pair: ["あたし", "私"],
    meaning: ["I (Girl/Cute)", "I (Standard)"],
    explanation: "女性撒娇/年轻 vs 标准。",
    examples: [{ sentence: "あたしね...", translation: "人家跟你说哦...", nuance: "可爱。" }]
  },
  {
    id: "s-washi-sessha",
    title: "わし vs 拙者",
    pair: ["わし", "拙者"],
    meaning: ["I (Old Man)", "I (Samurai)"],
    explanation: "老人/博士 vs 武士。",
    examples: [{ sentence: "わしが教えよう。", translation: "老夫来教你。", nuance: "长者。" }]
  },
  {
    id: "s-ware-waga",
    title: "我 vs 我が",
    pair: ["我", "我が"],
    meaning: ["I/Self (Formal)", "My/Our"],
    explanation: "宏大/正式。",
    examples: [{ sentence: "我が国。", translation: "我国。", nuance: "庄重。" }]
  },
  {
    id: "s-anata-omae",
    title: "あなた vs お前",
    pair: ["あなた", "お前"],
    meaning: ["You (Polite/Dear)", "You (Rough/Close)"],
    explanation: "您/亲爱的 vs 你这家伙(上对下/亲密)。",
    examples: [{ sentence: "お前が好きだ。", translation: "喜欢你。", nuance: "男性对女性/好友。" }]
  },
  {
    id: "s-kimi-temee",
    title: "君 vs てめぇ",
    pair: ["君", "てめぇ"],
    meaning: ["You (Gentle/Peer)", "You (Bastard)"],
    explanation: "同辈/晚辈 vs 敌人(极粗鲁)。",
    examples: [{ sentence: "てめぇ！", translation: "你这混蛋！", nuance: "愤怒。" }]
  },
  {
    id: "s-kisama-onore",
    title: "貴様 vs 己",
    pair: ["貴様", "己"],
    meaning: ["You (Enemy)", "You (Curse)"],
    explanation: "死敌(原本是敬语现为骂人) vs 你这厮。",
    examples: [{ sentence: "貴様、許さん！", translation: "你这混蛋，不可原谅！", nuance: "仇恨。" }]
  },
  {
    id: "s-kare-kanojo",
    title: "彼 vs 彼女",
    pair: ["彼", "彼女"],
    meaning: ["He/Boyfriend", "She/Girlfriend"],
    explanation: "他/男朋友 vs 她/女朋友。",
    examples: [{ sentence: "彼女ができた。", translation: "交到女朋友了。", nuance: "恋人。" }]
  },
  {
    id: "s-aitsu-koitsu",
    title: "あいつ vs こいつ",
    pair: ["あいつ", "こいつ"],
    meaning: ["That guy", "This guy"],
    explanation: "那家伙 vs 这家伙(随意/轻蔑/亲密)。",
    examples: [{ sentence: "こいつはすごい。", translation: "这家伙真厉害。", nuance: "亲密/佩服。" }]
  },

  // ==========================================
  // 5. 拟声拟态词 (Onomatopoeia) - 20条
  // ==========================================
  {
    id: "s-doki-waku",
    title: "ドキドキ vs ワクワク",
    pair: ["ドキドキ", "ワクワク"],
    meaning: ["Heartbeat (Nervous/Love)", "Excited"],
    explanation: "紧张心跳 vs 期待兴奋。",
    examples: [{ sentence: "胸がドキドキする。", translation: "心跳加速。", nuance: "恋爱/紧张。" }]
  },
  {
    id: "s-niko-niya",
    title: "ニコニコ vs ニヤニヤ",
    pair: ["ニコニコ", "ニヤニヤ"],
    meaning: ["Smile", "Smirk"],
    explanation: "友好微笑 vs 猥琐/坏笑。",
    examples: [{ sentence: "ニヤニヤするな。", translation: "别在那偷笑。", nuance: "嫌弃。" }]
  },
  {
    id: "s-kira-gira",
    title: "キラキラ vs ギラギラ",
    pair: ["キラキラ", "ギラギラ"],
    meaning: ["Sparkle", "Glare"],
    explanation: "闪亮 vs 刺眼/欲望。",
    examples: [{ sentence: "目がギラギラしている。", translation: "目光炯炯(贪婪)。", nuance: "欲望。" }]
  },
  {
    id: "s-pika-pika",
    title: "ピカピカ vs キラキラ",
    pair: ["ピカピカ", "キラキラ"],
    meaning: ["Shiny (Polished)", "Sparkly (Star)"],
    explanation: "擦得亮/光洁 vs 星星闪烁。",
    examples: [{ sentence: "靴がピカピカ。", translation: "鞋子锃亮。", nuance: "干净。" }]
  },
  {
    id: "s-sara-zara",
    title: "サラサラ vs ザラザラ",
    pair: ["サラサラ", "ザラザラ"],
    meaning: ["Smooth/Silky", "Rough/Gritty"],
    explanation: "顺滑(头发/水流) vs 粗糙(沙子)。",
    examples: [{ sentence: "髪がサラサラ。", translation: "头发顺滑。", nuance: "美感。" }]
  },
  {
    id: "s-fuwa-goha",
    title: "フワフワ vs ゴワゴワ",
    pair: ["フワフワ", "ゴワゴワ"],
    meaning: ["Fluffy", "Stiff/Rough"],
    explanation: "松软(棉花糖) vs 硬/僵硬(洗坏的衣服)。",
    examples: [{ sentence: "フワフワのパン。", translation: "松软的面包。", nuance: "口感。" }]
  },
  {
    id: "s-pera-pera",
    title: "ペラペラ",
    pair: ["ペラペラ", "...."],
    meaning: ["Fluent/Thin", "...."],
    explanation: "流利(说话) vs 薄(纸)。",
    examples: [{ sentence: "日本語がペラペラだ。", translation: "日语流利。", nuance: "语言能力。" }]
  },
  {
    id: "s-giri-giri",
    title: "ギリギリ",
    pair: ["ギリギリ", "...."],
    meaning: ["Barely/Just in time", "...."],
    explanation: "勉强/最后一刻。",
    examples: [{ sentence: "時間にギリギリ。", translation: "时间卡得很死。", nuance: "紧迫。" }]
  },
  {
    id: "s-bata-bata",
    title: "バタバタ",
    pair: ["バタバタ", "...."],
    meaning: ["Busy/Flapping", "...."],
    explanation: "忙乱/扑腾声。",
    examples: [{ sentence: "朝はバタバタする。", translation: "早上忙得团团转。", nuance: "忙碌。" }]
  },
  {
    id: "s-dara-dara",
    title: "ダラダラ",
    pair: ["ダラダラ", "...."],
    meaning: ["Lazy/Dripping", "...."],
    explanation: "懒散/流淌。",
    examples: [{ sentence: "ダラダラ過ごす。", translation: "混日子。", nuance: "懒惰。" }]
  },
  {
    id: "s-moya-moya",
    title: "モヤモヤ",
    pair: ["モヤモヤ", "...."],
    meaning: ["Hazy/Gloomy", "...."],
    explanation: "内心纠结/不舒畅。",
    examples: [{ sentence: "胸がモヤモヤする。", translation: "心里堵得慌。", nuance: "烦恼。" }]
  },
  {
    id: "s-ira-ira",
    title: "イライラ",
    pair: ["イライラ", "...."],
    meaning: ["Irritated", "...."],
    explanation: "焦躁/不耐烦。",
    examples: [{ sentence: "待ちくたびれてイライラする。", translation: "等得不耐烦。", nuance: "生气。" }]
  },
  {
    id: "s-tsuru-tsuru",
    title: "ツルツル vs すべすべ",
    pair: ["ツルツル", "すべすべ"],
    meaning: ["Slippery/Bald", "Smooth (Skin)"],
    explanation: "滑溜/光秃 vs 肌肤光滑。",
    examples: [{ sentence: "道がツルツル。", translation: "路很滑。", nuance: "危险。" }]
  },
  {
    id: "s-shiin",
    title: "シーン",
    pair: ["シーン", "...."],
    meaning: ["Silence", "...."],
    explanation: "无声的拟声词。",
    examples: [{ sentence: "教室がシーンとなる。", translation: "教室鸦雀无声。", nuance: "寂静。" }]
  },
  {
    id: "s-jii",
    title: "じーっ",
    pair: ["じーっ", "チラッ"],
    meaning: ["Stare", "Glance"],
    explanation: "凝视 vs 瞥一眼。",
    examples: [{ sentence: "じーっと見る。", translation: "盯着看。", nuance: "专注。" }]
  },
  {
    id: "s-gun-gun",
    title: "ぐんぐん",
    pair: ["ぐんぐん", "...."],
    meaning: ["Steadily/Rapidly", "...."],
    explanation: "突飞猛进。",
    examples: [{ sentence: "背がぐんぐん伸びる。", translation: "个子长得飞快。", nuance: "成长。" }]
  },
  {
    id: "s-peko-peko",
    title: "ペコペコ",
    pair: ["ペコペコ", "...."],
    meaning: ["Hungry/Bowing", "...."],
    explanation: "饿扁了/点头哈腰。",
    examples: [{ sentence: "お腹がペコペコだ。", translation: "肚子饿扁了。", nuance: "饥饿。" }]
  },
  {
    id: "s-goro-goro",
    title: "ゴロゴロ",
    pair: ["ゴロゴロ", "...."],
    meaning: ["Rolling/Thunder/Lazy", "...."],
    explanation: "滚动/雷声/无所事事。",
    examples: [{ sentence: "家でゴロゴロする。", translation: "在家躺尸。", nuance: "闲散。" }]
  },
  {
    id: "s-boko-boko",
    title: "ボコボコ",
    pair: ["ボコボコ", "...."],
    meaning: ["Beaten up/Uneven", "...."],
    explanation: "揍得鼻青脸肿/坑坑洼洼。",
    examples: [{ sentence: "ボコボコにされた。", translation: "被打惨了。", nuance: "暴力。" }]
  },
  {
    id: "s-nuru-nuru",
    title: "ヌルヌル",
    pair: ["ヌルヌル", "...."],
    meaning: ["Slimy", "...."],
    explanation: "黏滑(液体/触手)。",
    examples: [{ sentence: "ヌルヌルして気持ち悪い。", translation: "滑溜溜的好恶心。", nuance: "触感。" }]
  },

  // ==========================================
  // 6. 汉字微差与特殊词汇 (Kanji Nuance) - 10条
  // ==========================================
  {
    id: "s-tatakau",
    title: "戦う vs 闘う",
    pair: ["戦う", "闘う"],
    meaning: ["War", "Struggle"],
    explanation: "战争 vs 奋斗。",
    examples: [{ sentence: "病気と闘う。", translation: "与病魔抗争。", nuance: "精神。" }]
  },
  {
    id: "s-mamoru",
    title: "守る vs 護る",
    pair: ["守る", "護る"],
    meaning: ["Keep/Defend", "Protect (Love)"],
    explanation: "规则/防守 vs 守护(爱)。",
    examples: [{ sentence: "君を護る。", translation: "守护你。", nuance: "深情。" }]
  },
  {
    id: "s-hajime",
    title: "始め vs 初め",
    pair: ["始め", "初め"],
    meaning: ["Start (Action)", "First (Time/Exp)"],
    explanation: "开始(动作) vs 最初/初次。",
    examples: [{ sentence: "初めまして。", translation: "初次见面。", nuance: "时间。" }]
  },
  {
    id: "s-hitori",
    title: "一人 vs 独り",
    pair: ["一人", "独り"],
    meaning: ["One person", "Alone/Solitude"],
    explanation: "人数 vs 孤独。",
    examples: [{ sentence: "独りぼっち。", translation: "孤零零一人。", nuance: "寂寞。" }]
  },
  {
    id: "s-kage",
    title: "影 vs 陰",
    pair: ["影", "陰"],
    meaning: ["Shadow (Shape)", "Shade (Hidden)"],
    explanation: "影子(形状) vs 阴凉处/背后。",
    examples: [{ sentence: "お陰様で。", translation: "托您的福(在暗处庇护)。", nuance: "恩惠。" }]
  },
  {
    id: "s-moto",
    title: "元 vs 基 vs 本",
    pair: ["元", "基/本"],
    meaning: ["Origin/Former", "Basis/Foundation/Main"],
    explanation: "原来/前任 vs 基础 vs 根本。",
    examples: [{ sentence: "元カノ。", translation: "前女友。", nuance: "过去。" }]
  },
  {
    id: "s-tsukuru",
    title: "作る vs 造る vs 創る",
    pair: ["作る", "造る/創る"],
    meaning: ["Make (General)", "Build (Big)/Create (New)"],
    explanation: "一般制作 vs 建造/酿造 vs 创造(神/艺术)。",
    examples: [{ sentence: "新世界を創る。", translation: "创造新世界。", nuance: "宏大。" }]
  },
  {
    id: "s-nobiru",
    title: "伸びる vs 延びる",
    pair: ["伸びる", "延びる"],
    meaning: ["Grow/Stretch", "Postpone/Extend"],
    explanation: "生长/变长 vs 延期/延时。",
    examples: [{ sentence: "試合が延びた。", translation: "比赛延期了。", nuance: "时间。" }]
  },
  {
    id: "s-kawaru-change",
    title: "変わる vs 替わる",
    pair: ["変わる", "替わる"],
    meaning: ["Change (State)", "Exchange/Replace"],
    explanation: "变化 vs 替换。",
    examples: [{ sentence: "季節が変わる。", translation: "季节变换。", nuance: "自然。" }]
  },
  {
    id: "s-kotaeru",
    title: "答える vs 応える",
    pair: ["答える", "応える"],
    meaning: ["Answer", "Respond/Resonate"],
    explanation: "回答问题 vs 响应/报答/受打击。",
    examples: [{ sentence: "期待に応える。", translation: "回应期待。", nuance: "行动。" }]
  }
];