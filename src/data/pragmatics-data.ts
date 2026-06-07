export interface PragmaticScenario {
  id: string;
  title: string;
  situation: string;
  context: string;
  culturalNote: string;
  responses: {
    type: "Good" | "Bad" | "Native" | "Anime";
    expression: string;
    explanation: string;
  }[];
}

export const pragmaticsData: PragmaticScenario[] = [
  // ==========================================
  // 1. 寒暄与问候 (Greetings & Aisatsu) - 20条
  // ==========================================
  {
    id: "p-aisatsu-morning",
    title: "早安",
    situation: "早上见面",
    context: "对同事/邻居。",
    culturalNote: "元气满满的开始。",
    responses: [{ type: "Native", expression: "おはようございます。", explanation: "必须清晰响亮。对熟人可略为'おはよう'。" }]
  },
  {
    id: "p-aisatsu-day",
    title: "你好",
    situation: "白天见面",
    context: "一般场合。",
    culturalNote: "最通用的问候。",
    responses: [{ type: "Native", expression: "こんにちは。", explanation: "注意是ha读wa。" }]
  },
  {
    id: "p-aisatsu-night",
    title: "晚上好",
    situation: "晚上见面",
    context: "日落后。",
    culturalNote: "晚上好。",
    responses: [{ type: "Native", expression: "こんばんは。", explanation: "也是ha读wa。" }]
  },
  {
    id: "p-aisatsu-work-start",
    title: "工作开始",
    situation: "到公司/打工",
    context: "即使是下午或晚上到。",
    culturalNote: "业界惯例，只要是该人的一天开始，都说早安。",
    responses: [{ type: "Native", expression: "おはようございます。", explanation: "电视台/服务业尤甚。" }]
  },
  {
    id: "p-aisatsu-work-during",
    title: "辛苦了",
    situation: "同事擦肩而过",
    context: "在公司走廊。",
    culturalNote: "承认对方的劳动。",
    responses: [{ type: "Native", expression: "お疲れ様です。", explanation: "万能金句。千万别对长辈说'ご苦労様'（那是上对下）。" }]
  },
  {
    id: "p-aisatsu-leave",
    title: "先走一步",
    situation: "下班",
    context: "比别人先走。",
    culturalNote: "表示歉意。",
    responses: [{ type: "Native", expression: "お先に失礼します。", explanation: "我先失礼了。" }]
  },
  {
    id: "p-aisatsu-leave-reply",
    title: "送别同事",
    situation: "同事下班",
    context: "别人对你说'お先に'。",
    culturalNote: "慰劳。",
    responses: [{ type: "Native", expression: "お疲れ様でした。", explanation: "辛苦了（过去式）。" }]
  },
  {
    id: "p-aisatsu-go",
    title: "出门",
    situation: "离开家",
    context: "对家人。",
    culturalNote: "宣布我要出去并会回来。",
    responses: [{ type: "Native", expression: "行ってきます。", explanation: "我走了（还会回来）。" }]
  },
  {
    id: "p-aisatsu-go-reply",
    title: "送出门",
    situation: "家人出门",
    context: "送别。",
    culturalNote: "祝福平安。",
    responses: [{ type: "Native", expression: "行ってらっしゃい。", explanation: "慢走/路上小心。" }]
  },
  {
    id: "p-aisatsu-back",
    title: "回家",
    situation: "进家门",
    context: "对家人。",
    culturalNote: "宣布归来。",
    responses: [{ type: "Native", expression: "ただいま。", explanation: "我回来了（Tadaima kaerimashita缩略）。" }]
  },
  {
    id: "p-aisatsu-back-reply",
    title: "迎回家",
    situation: "家人归来",
    context: "迎接。",
    culturalNote: "慰劳在外辛苦。",
    responses: [{ type: "Native", expression: "お帰りなさい。", explanation: "欢迎回来。" }]
  },
  {
    id: "p-aisatsu-eat",
    title: "开动",
    situation: "饭前",
    context: "双手合十。",
    culturalNote: "领受生命。",
    responses: [{ type: "Native", expression: "いただきます。", explanation: "我领受了。" }]
  },
  {
    id: "p-aisatsu-eaten",
    title: "吃完",
    situation: "饭后",
    context: "离席。",
    culturalNote: "感谢奔波。",
    responses: [{ type: "Native", expression: "ごちそうさまでした。", explanation: "承蒙款待。" }]
  },
  {
    id: "p-aisatsu-sleep",
    title: "晚安",
    situation: "睡前",
    context: "家人/舍友。",
    culturalNote: "休息。",
    responses: [{ type: "Native", expression: "おやすみなさい。", explanation: "请休息吧。" }]
  },
  {
    id: "p-aisatsu-long-time",
    title: "久违",
    situation: "很久不见",
    context: "偶遇老友。",
    culturalNote: "确认关系依旧。",
    responses: [{ type: "Native", expression: "お久しぶりです。", explanation: "好久不见。" }]
  },
  {
    id: "p-aisatsu-new-year",
    title: "新年",
    situation: "过年",
    context: "1月1日。",
    culturalNote: "恭贺新禧。",
    responses: [{ type: "Native", expression: "明けましておめでとうございます。", explanation: "新年快乐。" }]
  },
  {
    id: "p-aisatsu-year-end",
    title: "年末",
    situation: "年底最后一次见面",
    context: "放假前。",
    culturalNote: "预祝明年。",
    responses: [{ type: "Native", expression: "良いお年を。", explanation: "祝过个好年。" }]
  },
  {
    id: "p-aisatsu-sorry",
    title: "对不起",
    situation: "道歉",
    context: "犯错/添麻烦。",
    culturalNote: "道歉文化。",
    responses: [{ type: "Native", expression: "申し訳ございません。", explanation: "最高级道歉，比すみません更正式。" }]
  },
  {
    id: "p-aisatsu-thanks",
    title: "谢谢",
    situation: "感谢",
    context: "受恩惠。",
    culturalNote: "感激。",
    responses: [{ type: "Native", expression: "ありがとうございます。", explanation: "现在时，或过去时(Arigatou gozaimashita)。" }]
  },
  {
    id: "p-aisatsu-first",
    title: "初次见面",
    situation: "初识",
    context: "自我介绍。",
    culturalNote: "开启关系。",
    responses: [{ type: "Native", expression: "初めまして、よろしくお願いします。", explanation: "初次见面，请多关照。" }]
  },

  // ==========================================
  // 2. 拒绝与请求 (Refusal & Request) - 20条
  // ==========================================
  {
    id: "p-refuse-drink",
    title: "拒绝喝酒",
    situation: "上司邀请",
    context: "不想去。",
    culturalNote: "不能直接说不。",
    responses: [{ type: "Native", expression: "今日はちょっと用事がありまして...", explanation: "我有事（省略了不能去）。" }]
  },
  {
    id: "p-refuse-date",
    title: "拒绝约会",
    situation: "被表白/邀约",
    context: "不喜欢对方。",
    culturalNote: "保持距离。",
    responses: [{ type: "Native", expression: "今は仕事（勉強）に集中したいので。", explanation: "我想专注工作（借口）。" }]
  },
  {
    id: "p-refuse-offer",
    title: "拒绝推销",
    situation: "店员推荐",
    context: "不想买。",
    culturalNote: "给面子。",
    responses: [{ type: "Native", expression: "ちょっと考えます。", explanation: "我再考虑一下（=不买）。" }]
  },
  {
    id: "p-refuse-help",
    title: "拒绝帮助",
    situation: "别人想帮你",
    context: "自己能行。",
    culturalNote: "不添麻烦。",
    responses: [{ type: "Native", expression: "大丈夫です。自分でやります。", explanation: "没事，我自己来。" }]
  },
  {
    id: "p-req-copy",
    title: "请求复印",
    situation: "求同事",
    context: "帮忙。",
    culturalNote: "给选择权。",
    responses: [{ type: "Native", expression: "コピーしていただけませんか？", explanation: "能帮我...吗？" }]
  },
  {
    id: "p-req-pass",
    title: "请求让路",
    situation: "下车",
    context: "前面有人挡着。",
    culturalNote: "礼貌。",
    responses: [{ type: "Native", expression: "降ります！", explanation: "我要下车！（暗示让路）。或 'すみません、通ります'。" }]
  },
  {
    id: "p-req-wait",
    title: "请求等待",
    situation: "稍等",
    context: "正在忙。",
    culturalNote: "具体时间。",
    responses: [{ type: "Native", expression: "少々お待ちください。", explanation: "请稍等（敬语）。" }]
  },
  {
    id: "p-req-repeat",
    title: "没听清",
    situation: "听不懂",
    context: "求重复。",
    culturalNote: "归咎自己。",
    responses: [{ type: "Native", expression: "もう一度お願いできますか？", explanation: "能再说一次吗？" }]
  },
  {
    id: "p-req-teach",
    title: "请教",
    situation: "不懂",
    context: "问前辈。",
    culturalNote: "低姿态。",
    responses: [{ type: "Native", expression: "教えていただけますか？", explanation: "能教我吗？" }]
  },
  {
    id: "p-req-photo",
    title: "求拍照",
    situation: "旅游",
    context: "请路人帮忙。",
    culturalNote: "客气。",
    responses: [{ type: "Native", expression: "シャッターを押していただけますか？", explanation: "能帮我按快门吗？" }]
  },
  {
    id: "p-refuse-soft",
    title: "软拒绝",
    situation: "被问行不行",
    context: "不行。",
    culturalNote: "模糊。",
    responses: [{ type: "Native", expression: "それはちょっと難しいですね。", explanation: "这有点难办啊（=不行）。" }]
  },
  {
    id: "p-req-lend",
    title: "借东西",
    situation: "借笔",
    context: "没带笔。",
    culturalNote: "归还承诺。",
    responses: [{ type: "Native", expression: "ペンを借りてもいいですか？", explanation: "可以借支笔吗？" }]
  },
  {
    id: "p-req-name",
    title: "问名字",
    situation: "初识",
    context: "忘了/没听清。",
    culturalNote: "先报己名。",
    responses: [{ type: "Native", expression: "お名前を伺ってもよろしいですか？", explanation: "可以请教尊姓大名吗？" }]
  },
  {
    id: "p-req-time",
    title: "问时间",
    situation: "没表",
    context: "路人。",
    culturalNote: "客气。",
    responses: [{ type: "Native", expression: "今、何時ですか？", explanation: "现在几点？" }]
  },
  {
    id: "p-req-toilet",
    title: "问厕所",
    situation: "商场/店",
    context: "内急。",
    culturalNote: "隐晦。",
    responses: [{ type: "Native", expression: "お手洗いはどこですか？", explanation: "洗手间在哪？" }]
  },
  {
    id: "p-refuse-food",
    title: "忌口",
    situation: "聚餐",
    context: "过敏/不吃。",
    culturalNote: "说明原因。",
    responses: [{ type: "Native", expression: "アレルギーがあるので...", explanation: "我有过敏..." }]
  },
  {
    id: "p-req-menu",
    title: "要菜单",
    situation: "餐厅",
    context: "点菜。",
    culturalNote: "举手。",
    responses: [{ type: "Native", expression: "メニューをお願いします。", explanation: "麻烦拿菜单。" }]
  },
  {
    id: "p-req-check",
    title: "结账",
    situation: "吃完",
    context: "买单。",
    culturalNote: "手势交叉。",
    responses: [{ type: "Native", expression: "お会計をお願いします。", explanation: "买单。" }]
  },
  {
    id: "p-refuse-bag",
    title: "不要袋子",
    situation: "便利店",
    context: "环保。",
    culturalNote: "简洁。",
    responses: [{ type: "Native", expression: "袋はいいです。", explanation: "袋子（我就）不用了。" }]
  },
  {
    id: "p-req-receipt",
    title: "要收据",
    situation: "报销",
    context: "买单时。",
    culturalNote: "领收书。",
    responses: [{ type: "Native", expression: "領収書（レシート）をください。", explanation: "请给我发票/小票。" }]
  },

  // ==========================================
  // 3. 商务与职场 (Business) - 20条
  // ==========================================
  {
    id: "p-biz-phone",
    title: "接电话",
    situation: "公司",
    context: "铃响。",
    culturalNote: "报社名。",
    responses: [{ type: "Native", expression: "はい、株式会社〇〇でございます。", explanation: "这里是某某公司。" }]
  },
  {
    id: "p-biz-care",
    title: "承蒙关照",
    situation: "开头",
    context: "邮件/电话。",
    culturalNote: "基础礼仪。",
    responses: [{ type: "Native", expression: "いつもお世話になっております。", explanation: "一直承蒙关照。" }]
  },
  {
    id: "p-biz-sorry",
    title: "商务道歉",
    situation: "失误",
    context: "严重错误。",
    culturalNote: "深度。",
    responses: [{ type: "Native", expression: "大変申し訳ございませんでした。", explanation: "万分抱歉。" }]
  },
  {
    id: "p-biz-wait",
    title: "让久等",
    situation: "迟到/忙碌",
    context: "对方等了。",
    culturalNote: "体贴。",
    responses: [{ type: "Native", expression: "お待たせいたしました。", explanation: "让您久等了。" }]
  },
  {
    id: "p-biz-hard",
    title: "辛苦",
    situation: "慰劳",
    context: "对下属/平辈。",
    culturalNote: "上对下。",
    responses: [{ type: "Native", expression: "ご苦労様。", explanation: "辛苦了（只能对下级说）。" }]
  },
  {
    id: "p-biz-understand",
    title: "明白了",
    situation: "接指令",
    context: "对上司/客户。",
    culturalNote: "不要说'分かりました'。",
    responses: [{ type: "Native", expression: "かしこまりました / 承知いたしました。", explanation: "遵命/知道了（谦逊）。" }]
  },
  {
    id: "p-biz-name",
    title: "自报家门",
    situation: "拜访",
    context: "前台。",
    culturalNote: "公司+名。",
    responses: [{ type: "Native", expression: "〇〇社の田中と申します。", explanation: "我是某公司的田中（自谦）。" }]
  },
  {
    id: "p-biz-card",
    title: "换名片",
    situation: "初见",
    context: "递名片。",
    culturalNote: "双手。",
    responses: [{ type: "Native", expression: "頂戴いたします。", explanation: "双手接过，说'我领受了'。" }]
  },
  {
    id: "p-biz-seat",
    title: "座位",
    situation: "会议室/车",
    context: "上座下座。",
    culturalNote: "离门最远是上座。",
    responses: [{ type: "Native", expression: "奥へどうぞ。", explanation: "请坐里面（上座）。" }]
  },
  {
    id: "p-biz-enter",
    title: "进房间",
    situation: "敲门",
    context: "进上司房间。",
    culturalNote: "失礼了。",
    responses: [{ type: "Native", expression: "失礼します。", explanation: "打扰了（进门时）。" }]
  },
  {
    id: "p-biz-intro-boss",
    title: "介绍老板",
    situation: "对客户",
    context: "提及自己社长。",
    culturalNote: "去敬称。",
    responses: [{ type: "Native", expression: "社長の田中は...", explanation: "我司田中（不加先生）。" }]
  },
  {
    id: "p-biz-busy",
    title: "百忙之中",
    situation: "拜托/感谢",
    context: "占用时间。",
    culturalNote: "缓冲语。",
    responses: [{ type: "Native", expression: "お忙しいところ恐縮ですが...", explanation: "百忙之中惶恐打扰..." }]
  },
  {
    id: "p-biz-clue",
    title: "没有线索",
    situation: "被问",
    context: "不知道。",
    culturalNote: "委婉。",
    responses: [{ type: "Native", expression: "分かりかねます。", explanation: "难以知晓（比'不知道'礼貌）。" }]
  },
  {
    id: "p-biz-memo",
    title: "做笔记",
    situation: "听指示",
    context: "重要。",
    culturalNote: "态度。",
    responses: [{ type: "Native", expression: "メモを取らせていただきます。", explanation: "请容我做个笔记。" }]
  },
  {
    id: "p-biz-check",
    title: "确认",
    situation: "复述",
    context: "防止听错。",
    culturalNote: "严谨。",
    responses: [{ type: "Native", expression: "確認させていただきます。", explanation: "请容我确认一下。" }]
  },
  {
    id: "p-biz-absent",
    title: "不在",
    situation: "电话",
    context: "找的人不在。",
    culturalNote: "离席。",
    responses: [{ type: "Native", expression: "ただいま席を外しております。", explanation: "现在暂时离席。" }]
  },
  {
    id: "p-biz-late",
    title: "迟到",
    situation: "会议",
    context: "晚了。",
    culturalNote: "道歉。",
    responses: [{ type: "Native", expression: "遅くなりまして申し訳ございません。", explanation: "来晚了非常抱歉。" }]
  },
  {
    id: "p-biz-leaving-first",
    title: "先走",
    situation: "下班",
    context: "问候大家。",
    culturalNote: "招呼。",
    responses: [{ type: "Native", expression: "お先に失礼します。", explanation: "先走了。" }]
  },
  {
    id: "p-biz-tea",
    title: "上茶",
    situation: "倒茶",
    context: "给客人。",
    culturalNote: "不说话。",
    responses: [{ type: "Native", expression: "失礼します（小声）。", explanation: "打扰了（放茶杯）。" }]
  },
  {
    id: "p-biz-elevator",
    title: "电梯",
    situation: "送客",
    context: "电梯门关。",
    culturalNote: "鞠躬直到门关。",
    responses: [{ type: "Native", expression: "失礼いたします（深鞠躬）。", explanation: "保持鞠躬姿势直到门完全关上。" }]
  },

  // ==========================================
  // 4. 动漫与御宅文化 (Anime & Otaku) - 20条
  // ==========================================
  {
    id: "p-ani-ore",
    title: "本大爷",
    situation: "自称",
    context: "俺様 (Ore-sama)。",
    culturalNote: "极度自大。",
    responses: [{ type: "Anime", expression: "俺様", explanation: "本大爷（反派或自信角色）。" }]
  },
  {
    id: "p-ani-kisama",
    title: "你这家伙",
    situation: "骂人",
    context: "贵様 (Kisama)。",
    culturalNote: "字面是'贵样'，实际是'混蛋'。",
    responses: [{ type: "Anime", expression: "貴様！", explanation: "你这混蛋！" }]
  },
  {
    id: "p-ani-ending",
    title: "句尾助词",
    situation: "口癖",
    context: "～だ手羽 (Dattebayo) / ～だぞ (Dazo)。",
    culturalNote: "角色标志。",
    responses: [{ type: "Anime", expression: "行くぞ！", explanation: "走啦！" }]
  },
  {
    id: "p-ani-tsundere",
    title: "傲娇",
    situation: "掩饰",
    context: "别误会。",
    culturalNote: "教科书台词。",
    responses: [{ type: "Anime", expression: "別にあんたのためじゃないんだからね！", explanation: "才不是为你做的呢！" }]
  },
  {
    id: "p-ani-yandere",
    title: "病娇",
    situation: "爱",
    context: "沉重的爱。",
    culturalNote: "恐怖。",
    responses: [{ type: "Anime", expression: "殺してあげる。", explanation: "我杀了你（为了爱）。" }]
  },
  {
    id: "p-ani-chuunibyou",
    title: "中二病",
    situation: "装逼",
    context: "绷带/右眼。",
    culturalNote: "自我设定。",
    responses: [{ type: "Anime", expression: "闇の炎に抱かれて消えろ！", explanation: "被漆黑烈焰吞噬殆尽吧！" }]
  },
  {
    id: "p-ani-senpai",
    title: "前辈",
    situation: "校园",
    context: "呼唤学长。",
    culturalNote: "敬仰。",
    responses: [{ type: "Anime", expression: "先輩！", explanation: "Senpai（已成为国际词汇）。" }]
  },
  {
    id: "p-ani-onii",
    title: "欧尼酱",
    situation: "兄妹",
    context: "妹妹。",
    culturalNote: "萌属性。",
    responses: [{ type: "Anime", expression: "お兄ちゃん！", explanation: "哥哥！" }]
  },
  {
    id: "p-ani-fight",
    title: "开战",
    situation: "战斗",
    context: "挑衅。",
    culturalNote: "热血。",
    responses: [{ type: "Anime", expression: "かかってこい！", explanation: "放马过来！" }]
  },
  {
    id: "p-ani-lose",
    title: "不甘心",
    situation: "战败",
    context: "咬牙切齿。",
    culturalNote: "悔恨。",
    responses: [{ type: "Anime", expression: "くそっ！", explanation: "可恶！" }]
  },
  {
    id: "p-ani-win",
    title: "胜利",
    situation: "赢了",
    context: "欢呼。",
    culturalNote: "庆祝。",
    responses: [{ type: "Anime", expression: "やった！", explanation: "太棒了/做到了！" }]
  },
  {
    id: "p-ani-promise",
    title: "约定",
    situation: "指勾",
    context: "幼驯染。",
    culturalNote: "Flag。",
    responses: [{ type: "Anime", expression: "約束だ。", explanation: "说好了哦。" }]
  },
  {
    id: "p-ani-ganbare",
    title: "加油",
    situation: "鼓励",
    context: "伙伴。",
    culturalNote: "应援。",
    responses: [{ type: "Anime", expression: "頑張れ！/ 負けるな！", explanation: "加油/别输啊！" }]
  },
  {
    id: "p-ani-itai",
    title: "痛",
    situation: "受伤",
    context: "战斗中。",
    culturalNote: "忍耐。",
    responses: [{ type: "Anime", expression: "ぐああっ！", explanation: "（惨叫声）" }]
  },
  {
    id: "p-ani-nani",
    title: "什么",
    situation: "惊讶",
    context: "意想不到。",
    culturalNote: "震惊。",
    responses: [{ type: "Anime", expression: "な、なんだと！？", explanation: "什、什么！？" }]
  },
  {
    id: "p-ani-yamero",
    title: "住手",
    situation: "阻止",
    context: "坏人行凶。",
    culturalNote: "命令。",
    responses: [{ type: "Anime", expression: "やめろ！", explanation: "住手！" }]
  },
  {
    id: "p-ani-nigeru",
    title: "快逃",
    situation: "危机",
    context: "打不过。",
    culturalNote: "急迫。",
    responses: [{ type: "Anime", expression: "逃げろ！", explanation: "快逃！" }]
  },
  {
    id: "p-ani-mamoru",
    title: "守护",
    situation: "誓言",
    context: "为了重要的人。",
    culturalNote: "核心价值观。",
    responses: [{ type: "Anime", expression: "俺が守る！", explanation: "我来守护！" }]
  },
  {
    id: "p-ani-shine",
    title: "去死",
    situation: "攻击",
    context: "绝招。",
    culturalNote: "极度攻击性。",
    responses: [{ type: "Anime", expression: "死ね！", explanation: "去死吧！" }]
  },
  {
    id: "p-ani-bakana",
    title: "不可能",
    situation: "被打败",
    context: "反派遗言。",
    culturalNote: "难以置信。",
    responses: [{ type: "Anime", expression: "バカな...", explanation: "怎么可能/蠢货..." }]
  },

  // ==========================================
  // 5. 恋爱与人际 (Relationships) - 20条
  // ==========================================
  {
    id: "p-love-kokuhaku",
    title: "告白",
    situation: "表白",
    context: "传达心意。",
    culturalNote: "正式。",
    responses: [{ type: "Native", expression: "好きです。付き合ってください。", explanation: "我喜欢你，请和我交往。" }]
  },
  {
    id: "p-love-moon",
    title: "月色真美",
    situation: "含蓄表白",
    context: "夏目漱石。",
    culturalNote: "文学。",
    responses: [{ type: "Native", expression: "月が綺麗ですね。", explanation: "我爱你（含蓄版）。" }]
  },
  {
    id: "p-love-date",
    title: "约会邀请",
    situation: "邀约",
    context: "周末。",
    culturalNote: "试探。",
    responses: [{ type: "Native", expression: "今度の日曜日、空いてる？", explanation: "这周日有空吗？" }]
  },
  {
    id: "p-love-reject",
    title: "发卡",
    situation: "拒绝",
    context: "好人卡。",
    culturalNote: "委婉。",
    responses: [{ type: "Native", expression: "いい友達でいたい。", explanation: "想和你做朋友。" }]
  },
  {
    id: "p-love-hold-hands",
    title: "牵手",
    situation: "散步",
    context: "想牵手。",
    culturalNote: "害羞。",
    responses: [{ type: "Native", expression: "手、繋いでもいい？", explanation: "可以牵手吗？" }]
  },
  {
    id: "p-love-breakup",
    title: "分手",
    situation: "结束",
    context: "谈话。",
    culturalNote: "决绝。",
    responses: [{ type: "Native", expression: "別れよう。", explanation: "分手吧。" }]
  },
  {
    id: "p-love-propose",
    title: "求婚",
    situation: "一生",
    context: "戒指。",
    culturalNote: "责任。",
    responses: [{ type: "Native", expression: "結婚してください。", explanation: "请跟我结婚。" }]
  },
  {
    id: "p-love-miss",
    title: "想念",
    situation: "电话",
    context: "异地。",
    culturalNote: "直率。",
    responses: [{ type: "Native", expression: "会いたい。", explanation: "想见你。" }]
  },
  {
    id: "p-love-cute",
    title: "夸可爱",
    situation: "夸奖",
    context: "女朋友。",
    culturalNote: "赞美。",
    responses: [{ type: "Native", expression: "可愛いね。", explanation: "真可爱。" }]
  },
  {
    id: "p-love-cool",
    title: "夸帅",
    situation: "夸奖",
    context: "男朋友。",
    culturalNote: "赞美。",
    responses: [{ type: "Native", expression: "かっこいい！", explanation: "好帅！" }]
  },
  {
    id: "p-rel-ne",
    title: "共鸣",
    situation: "闲聊",
    context: "天气。",
    culturalNote: "助词ne。",
    responses: [{ type: "Native", expression: "寒いですね。", explanation: "好冷啊（是吧）。" }]
  },
  {
    id: "p-rel-sou",
    title: "附和",
    situation: "听话",
    context: "点头。",
    culturalNote: "Aizuchi。",
    responses: [{ type: "Native", expression: "そうですか / なるほど。", explanation: "是吗/原来如此。" }]
  },
  {
    id: "p-rel-praise",
    title: "夸奖",
    situation: "赞赏",
    context: "很棒。",
    culturalNote: "Sugoii。",
    responses: [{ type: "Native", expression: "すごい！", explanation: "好厉害！" }]
  },
  {
    id: "p-rel-worry",
    title: "关心",
    situation: "生病",
    context: "感冒。",
    culturalNote: "保重。",
    responses: [{ type: "Native", expression: "お大事に。", explanation: "保重身体。" }]
  },
  {
    id: "p-rel-sorry-late",
    title: "抱歉联系晚了",
    situation: "回信",
    context: "隔了很久。",
    culturalNote: "礼貌。",
    responses: [{ type: "Native", expression: "返信が遅れてすみません。", explanation: "抱歉回晚了。" }]
  },
  {
    id: "p-rel-congrats",
    title: "祝贺",
    situation: "喜事",
    context: "生日/结婚。",
    culturalNote: "Omedetou。",
    responses: [{ type: "Native", expression: "おめでとうございます。", explanation: "恭喜。" }]
  },
  {
    id: "p-rel-invitation",
    title: "邀请",
    situation: "玩",
    context: "大家一起。",
    culturalNote: "一起。",
    responses: [{ type: "Native", expression: "一緒にどうですか？", explanation: "要不要一起？" }]
  },
  {
    id: "p-rel-cheer",
    title: "干杯",
    situation: "喝酒",
    context: "碰杯。",
    culturalNote: "Kampai。",
    responses: [{ type: "Native", expression: "乾杯！", explanation: "干杯！" }]
  },
  {
    id: "p-rel-joke",
    title: "玩笑",
    situation: "逗笑",
    context: "说了怪话。",
    culturalNote: "解释。",
    responses: [{ type: "Native", expression: "冗談だよ。", explanation: "开玩笑的。" }]
  },
  {
    id: "p-rel-secret",
    title: "秘密",
    situation: "八卦",
    context: "不告诉别人。",
    culturalNote: "守密。",
    responses: [{ type: "Native", expression: "ここだけの話ですが...", explanation: "这话只在这里说（保密）..." }]
  }
];
