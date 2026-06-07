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

export const grammarData: Record<Level, GrammarPoint[]> = {
  // --- N5 (基础生存) ---
  N5: [
    { id: "n5-wa", title: "主题: は (Wa)", structure: "N + は", explanation: "标记主题。", examples: [{ japanese: "私はルフィ。", romaji: "Watashi wa Rufi.", meaning: "我是路飞。" }], level: "N5" },
    { id: "n5-desu", title: "判断: です (Desu)", structure: "N/Adj + です", explanation: "标准断定。", examples: [{ japanese: "海賊です。", romaji: "Kaizoku desu.", meaning: "我是海盗。" }], level: "N5" },
    { id: "n5-da", title: "简体判断: だ (Da)", structure: "N/Adj + だ", explanation: "男性或简体断定。", examples: [{ japanese: "そうだ。", romaji: "Sou da.", meaning: "是那样。" }], level: "N5" },
    { id: "n5-ka", title: "疑问: か (Ka)", structure: "S + か", explanation: "疑问句。", examples: [{ japanese: "元気か？", romaji: "Genki ka?", meaning: "还好吗？" }], level: "N5" },
    { id: "n5-no", title: "所属: の (No)", structure: "N + の", explanation: "表示所属。", examples: [{ japanese: "俺の仲間", romaji: "Ore no nakama", meaning: "我的伙伴" }], level: "N5" },
    { id: "n5-wo", title: "宾语: を (Wo)", structure: "O + を", explanation: "动作对象。", examples: [{ japanese: "肉を食う。", romaji: "Niku o kuu.", meaning: "吃肉。" }], level: "N5" },
    { id: "n5-ni-loc", title: "存在: に (Ni)", structure: "Place + に", explanation: "存在的场所。", examples: [{ japanese: "船にいる。", romaji: "Fune ni iru.", meaning: "在船上。" }], level: "N5" },
    { id: "n5-de-action", title: "场所: で (De)", structure: "Place + で", explanation: "动作的场所。", examples: [{ japanese: "海で泳ぐ。", romaji: "Umi de oyogu.", meaning: "在海里游。" }], level: "N5" },
    { id: "n5-e", title: "方向: へ (E)", structure: "Place + へ", explanation: "移动方向。", examples: [{ japanese: "グランドラインへ。", romaji: "Gurandorain e.", meaning: "去伟大航路。" }], level: "N5" },
    { id: "n5-to", title: "和: と (To)", structure: "N + と", explanation: "并列或伴随。", examples: [{ japanese: "ナミと行く。", romaji: "Nami to iku.", meaning: "和娜美去。" }], level: "N5" },
    { id: "n5-ga", title: "主语: が (Ga)", structure: "S + が", explanation: "强调主语或对象。", examples: [{ japanese: "腹が減った。", romaji: "Hara ga hetta.", meaning: "肚子饿了。" }], level: "N5" },
    { id: "n5-mo", title: "也: も (Mo)", structure: "N + も", explanation: "类推。", examples: [{ japanese: "お前も来るか？", romaji: "Omae mo kuru ka?", meaning: "你也来吗？" }], level: "N5" },
    { id: "n5-kara", title: "从/因为: から (Kara)", structure: "S/N + から", explanation: "起点或原因。", examples: [{ japanese: "危ないから離れろ。", romaji: "Abunai kara hanarero.", meaning: "因为危险快离开。" }], level: "N5" },
    { id: "n5-made", title: "直到: まで (Made)", structure: "N + まで", explanation: "终点。", examples: [{ japanese: "死ぬまで戦う。", romaji: "Shinu made tatakau.", meaning: "战斗到死。" }], level: "N5" },
    { id: "n5-masu", title: "敬语动词: ます (Masu)", structure: "V-stem + ます", explanation: "礼貌体。", examples: [{ japanese: "行きます。", romaji: "Ikimasu.", meaning: "我去。" }], level: "N5" },
    { id: "n5-masen", title: "敬语否定: ません (Masen)", structure: "V-stem + ません", explanation: "礼貌否定。", examples: [{ japanese: "知りません。", romaji: "Shirimasen.", meaning: "不知道。" }], level: "N5" },
    { id: "n5-mashita", title: "敬语过去: ました (Mashita)", structure: "V-stem + ました", explanation: "礼貌过去。", examples: [{ japanese: "勝ちました。", romaji: "Kachimashita.", meaning: "赢了。" }], level: "N5" },
    { id: "n5-nai", title: "简体否定: ない (Nai)", structure: "V-nai", explanation: "普通体否定。", examples: [{ japanese: "行かない。", romaji: "Ikanai.", meaning: "不去。" }], level: "N5" },
    { id: "n5-ta", title: "简体过去: た (Ta)", structure: "V-ta", explanation: "普通体过去。", examples: [{ japanese: "見たか？", romaji: "Mita ka?", meaning: "看见了吗？" }], level: "N5" },
    { id: "n5-te", title: "连接: て (Te)", structure: "V-te", explanation: "动作相继或请求。", examples: [{ japanese: "待って。", romaji: "Matte.", meaning: "等等。" }], level: "N5" },
    { id: "n5-arimasu", title: "有(物): ある/あります", structure: "N + がある", explanation: "非生物存在。", examples: [{ japanese: "夢がある。", romaji: "Yume ga aru.", meaning: "我有梦想。" }], level: "N5" },
    { id: "n5-imasu", title: "有(人): いる/います", structure: "N + がいる", explanation: "生物存在。", examples: [{ japanese: "敵がいる。", romaji: "Teki ga iru.", meaning: "有敌人。" }], level: "N5" },
    { id: "n5-tai", title: "想做: たい (Tai)", structure: "V-stem + たい", explanation: "第一人称愿望。", examples: [{ japanese: "王になりたい。", romaji: "Ou ni naritai.", meaning: "想成为王。" }], level: "N5" },
    { id: "n5-mashou", title: "吧: ましょう (Mashou)", structure: "V-stem + ましょう", explanation: "提议。", examples: [{ japanese: "帰りましょう。", romaji: "Kaerimashou.", meaning: "回去吧。" }], level: "N5" },
    { id: "n5-ya", title: "列举: や (Ya)", structure: "A や B", explanation: "不完全列举。", examples: [{ japanese: "剣や槍。", romaji: "Ken ya yari.", meaning: "剑啊枪啊之类的。" }], level: "N5" }
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
