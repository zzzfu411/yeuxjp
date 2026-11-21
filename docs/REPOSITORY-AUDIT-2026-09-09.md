# Yasashi Japanese 仓库审计报告

> 本文是 2026-09-09 的历史审计快照。F01–F08、D01–D08 已在后续整改中落实并通过最终发布检查，当前结论见 [2026-09-12 整改验收报告](REMEDIATION-ACCEPTANCE-2026-09-12.md)。下文保留当时的缺陷证据，不表示这些问题仍存在。

审计日期：2026-09-09。审计对象：`D:/Develop/Gemini/yasashiJapanese/web` 当前工作区，包括尚未提交的课程、插画、布局及测试变更；Git HEAD 为 `4ab5d4e`。本报告评估当前实现，不将历史报告中的“已完成”直接当作验证结果。

## 1. 总体结论

**项目已经具备较完整的自学工具框架，但还不适合把当前的练习分数和课程进度当作可靠的学习达标证据。** 主要不足集中在题目有效性、评分含义、课程与复习的连接，以及个性化路径的实际实现。基础页面、学习记录、失败回滚、备份恢复和离线页面方面，本轮检查结果相对稳定。

本轮整理出 **8 项已确认的代码、题目或测试缺陷，另有 8 项学习路径和产品设计缺口**。未发现本轮已验证流程中的数据丢失或必现崩溃；这不代表穷尽所有故障。尤其不能用“728 项测试通过”推导出语言内容正确或测评有效。

最应优先处理的是：

1. 消除答案泄漏：语法专项题固定首项正确、听力题标题直接给答案。
2. 修正错误判题：同义词、同音假名、合理组句变体，以及第 92 课的语法规则与答案。
3. 区分课程完成、知识掌握和表达能力，避免选择题成绩被当成输出能力。
4. 建立本课词汇补练、正确知识点的间隔复习及阶段达标流程。
5. 修复已失效的移动端测试，使发布检查恢复可用。

优先级定义：P1 为应在下一次正式发布前处理的核心有效性或发布阻塞问题；P2 为影响学习正确性、效率或可理解性的正常优先级问题。这里没有将教学缺口冒充安全漏洞。

## 2. 检查范围与结果

### 2.1 实际检查内容

- 课程数据与目录、四阶段顺序、前置解锁、假名跳过、课程重练、断点恢复、历史成绩。
- 选择、输入、听写、组句、语法专项、词汇回忆、听音辨字的生成与评分。
- 学习状态、技能推荐、能力均分、每日目标、复习队列、SRS 与错题记录。
- 本地写入协调、事务回滚、备份恢复、数据异常提示的实现及现有验证。
- 首页、学习路径、课程、词汇、语法、复习、设置等界面的浏览器流程。
- 数据校验、类型检查、单元测试、HTTP 检查、浏览器回归、PWA 与无障碍检查。

静态和程序化检查覆盖全量课程与题库；语言内容采用重点抽查，并对发现的争议规则核对外部教学资料。没有声称逐句完成 175 课的母语教师审校。

### 2.2 数据规模

| 项目 | 当前数量 | 解释 |
| --- | ---: | --- |
| 主题单元 | 35 | 每单元 5 课，共享一组对话和一篇阅读 |
| 课程 | 175 | 基础 45、N4 参考 45、N3 参考 45、N2 参考 40 |
| 课程步骤 | 2,104 | 包括讲解、例文、小结和练习 |
| 课程练习步骤 | 1,579 | 919 选择、188 输入、175 听写、297 组句 |
| 新增理解题 | 175 | 88 阅读、87 听力，已经包含在上述选择题数量中 |
| 词库词条 | 1,066 | 不能直接等同于课程逐项教授和检测的词数 |
| 课程声明涉及的独立词条 | 450 | 对 `newItemIds` 去重 |
| 语法资料条目 | 187 | 包含资料页的各分类，非全部属于 N5–N2 主线 |
| 语法资料页专项题 | 369 | 与课程中的 919 道选择题是不同入口 |

各阶段 `newItemIds` 去重词数分别为 116、92、159、137；阶段之间有重复，不能相加作为独立词汇总量。当前整套建议课时合计 5,650 分钟，约 94.2 小时；这是代码设置的学习时间，不是经过学习者实测的达标时长。

### 2.3 本轮验证结果

| 检查 | 结果 | 边界 |
| --- | --- | --- |
| `npm run validate:data` | 通过 | 引用、结构、字段、材料长度、选项文本等检查；不判断语义是否唯一正确 |
| `npm run lint` | 通过 | 无 ESLint 错误 |
| `npm test` | 728/728 通过 | 146 个测试文件，其中 72 个文件名带 `contract`；不能把所有测试都理解为端到端功能验证 |
| `npx tsc --noEmit --incremental false` | 通过 | 无类型错误 |
| `npm run e2e` | 通过 | 13 路由、3 个 404 路由；元数据、385 项 sitemap、robots、自定义 404 检查通过，脚本使用 3210 服务 |
| `npm run e2e:browser:required` | **失败** | 在 320×300 首页检查中引用已删除元素，详见 F08 |
| 完整浏览器脚本在失败前的流程 | 顺序执行通过 | 并发写入、课程、完整性、复习、问答/错题、键盘操作、保存失败、备份恢复、PWA 更新提示等；后续步骤不能算作同一次完整通过 |
| 独立补跑课程界面检查 | 通过 | 10 个阅读视图、听力记录保持、开放表达自查 |
| 独立补跑 axe 检查 | 通过 | 32 个明暗主题页面/弹窗状态，无该检查规则集的违规项 |
| `npm run e2e:pwa:required` | 通过 | 使用 3217 生产服务的离线流程；不代表真实日语语音离线可播放 |
| 专门构造的逻辑复现 | 成功复现问题 | 固定首项答案、同义词误判、同音假名误判、组句变体、能力统计、零分通关、听力标题泄漏 |

本轮没有修改业务逻辑、没有提交或推送。复现脚本使用独立浏览器上下文，不修改用户日常浏览器中的学习记录。没有另行重建 3217 的生产服务；浏览器检查使用当前已经运行的生产版本，源码检查针对工作区。

## 3. 已确认的缺陷

### F01 · P1 · 369 道语法专项题全部首项正确

**位置：** [grammar-practice.ts:44](D:/Develop/Gemini/yasashiJapanese/web/src/lib/grammar-practice.ts:44)、[grammar-practice-panel.tsx:20](D:/Develop/Gemini/yasashiJapanese/web/src/components/reference/grammar-practice-panel.tsx:20)、[quiz-option-grid.tsx:28](D:/Develop/Gemini/yasashiJapanese/web/src/components/quiz/quiz-option-grid.tsx:28)。

数据检查得到：369 道专项题中，369 道的 `options[0]` 等于正确答案。转换函数和界面都保留这个顺序，开始练习及重新练习没有打乱。浏览器中进入 N3「ように」专项，连续点第一项，得到 2/2。

**影响：** 用户无需理解题目即可获得高分，记录还会进入知识点能力统计。这是测评失效，不只是随机性不足。课程播放器有单独的打乱机制，本问题特指语法资料页的专项练习。

**修复与验收：** 每次专项练习建立稳定的题目/选项种子，同一次作答不跳动，重练可变；为整个题库检查答案位置分布；浏览器验证固定点击第一项不能稳定满分，同时确认题目判分、错题记录仍指向正确答案值。

### F02 · P2 · 词汇回忆题可能把合理同义答案判错

**位置：** [review-questions.ts:248](D:/Develop/Gemini/yasashiJapanese/web/src/lib/review-questions.ts:248)、[review-questions.ts:255](D:/Develop/Gemini/yasashiJapanese/web/src/lib/review-questions.ts:255)。

回忆方向只显示中文意思，选项按日文显示文本去重，评分只接受目标词条 ID。实际生成的题目提示为“说”，选项同时包含「話す（はなす）」与「言う（いう）」；选择「言う」被判错。提示未给出足以区分两个动词的语境。

词库中查到 20 组“规范化中文释义相同、日文表记不同”的词条。这是歧义候选组数，不代表每一题都出错或每组词在所有语境可互换。复现使用真实词条和实际 `loadVocabularyReviewPool`，不是构造不存在的词。

**影响：** 无法依据题面做出唯一选择，正确语言知识可能被记为错题，SRS 和能力分数也受到影响。

**修复与验收：** 按题目方向检查语义唯一性；同释义词不作互斥干扰项，或增加明确场景/词性/搭配。确实允许多个答案时存储所有允许的词条 ID。保留「話す／言う」回归样例。

### F03 · P2 · 听音辨字可能要求区分同音假名

**位置：** [quiz-question-builders.ts:45](D:/Develop/Gemini/yasashiJapanese/web/src/lib/quiz-question-builders.ts:45)、[quiz-question-builders.ts:67](D:/Develop/Gemini/yasashiJapanese/web/src/lib/quiz-question-builders.ts:67)。

听力题按不同罗马字标签取干扰项，没有按发音分组。实际生成器可生成播放「じ」、选项同时包含「じ／ぢ」的题目，只接受 `ji`，选择标记为 `di` 的「ぢ」会判错。

现代共通语一般将「じ／ぢ」「ず／づ」「お／を」视为同音，不能仅靠一个孤立音可靠判断写法。这里针对项目默认的共通语学习，不否认方言等差异。[文化厅说明](https://www.bunka.go.jp/seisaku/kokugo_nihongo/kokugo_shisaku/pdf/94340701_01.pdf)

**修复与验收：** 建立听力用发音等价组，排除同音干扰项；需要练习书写差别时改用词语、词源或句子语境。测试分别覆盖三组同音假名，避免只验证选项字符串不重复。

### F04 · P1 · 41 道听音选择题在标题中直接显示答案

**位置：** [days-01-21.ts:108](D:/Develop/Gemini/yasashiJapanese/web/src/data/lessons/days-01-21.ts:108)、[lesson-runner.tsx](D:/Develop/Gemini/yasashiJapanese/web/src/components/lesson/lesson-runner.tsx)。

例如第 2 课标题为“听音辨き”，题目要求听声音选择假名，正确选项正是「き」。该标题直接显示在课程主标题位置。全量扫描确认有 41 道听音选择题的标题包含完整正确答案，浏览器也已复现该例。

**影响：** 用户不用播放音频即可答对，但系统仍按 listening 累加成绩，听力掌握记录失真。第 1 课已使用中性标题“听音辨字”，说明需要处理的是剩余数据，而不是只改一次组件文案。

**修复与验收：** 测试阶段统一使用不含目标答案的标题；若保留示范题，则明确为带提示练习、不计独立听力成绩。扫描题目标题、提示、辅助文本及无障碍标签，浏览器在未答题状态检查泄漏。

### F05 · P1 · 第 92 课存在错误绝对规则，并据此拒绝合理答案

**位置：** [days-91-135.ts:175](D:/Develop/Gemini/yasashiJapanese/web/src/data/lessons/days-91-135.ts:175)、[days-91-135.ts:184](D:/Develop/Gemini/yasashiJapanese/web/src/data/lessons/days-91-135.ts:184)、[days-91-135.ts:190](D:/Develop/Gemini/yasashiJapanese/web/src/data/lessons/days-91-135.ts:190)。

原文写“ない形表目的必须用 ように，不能说 忘れないために”。随后的 `d92-mc-nai` 题目为「遅れない＿早く出ます」，把「ために」列作错误选项，只接受「ように」。实际评分函数拒绝「ために」。

国际文化论坛的教学答疑明确说明，否定目的的两种表达在很多语境都可用，并给出与本题高度接近的「遅れないように／ないために」例子，区别在表达重心。因此本题缺乏唯一正确答案，不能用“课堂里先这样记”处理。[国际文化论坛教学答疑](https://www.tjf.or.jp/hidamari/4_mondou/mondou06_02.html)

同课还将「聞こえる」解释为“可能形”。应区分作为自动态感知动词的「聞こえる」与「聞く」的可能形「聞ける」。[国际交流基金教学说明](https://www.jpf.go.jp/j/urawa/j_rsorcs/textbook/dl/setsumei/setsumei_all.pdf)

**修复与验收：** 重写规则边界和本题语境，核对对应资料页、复习题、解释与旧错题。建立教师审校的规则记录，特别复查“必须、只能、不能、绝对”等断言。新增 coursebook 讲解不能自动消除播放器仍展示的旧说明。

### F06 · P2 · 动词变形选择题被计入“输出掌握度”

**位置：** [quiz-question-builders.ts:147](D:/Develop/Gemini/yasashiJapanese/web/src/lib/quiz-question-builders.ts:147)、[learning-progress-model.ts](D:/Develop/Gemini/yasashiJapanese/web/src/lib/learning-progress-model.ts)、[skill-tree-page.tsx:70](D:/Develop/Gemini/yasashiJapanese/web/src/components/path/skill-tree-page.tsx:70)。

变形题显示四个选项，却设置 `mode: "production"`。通过实际题目和进度函数复现：同一道「たべる → ます形」选择题答对六次，在仅有这些记录的状态下，“输出掌握度”达到 100%。全程没有独立输入、写句子或说话。

**影响：** 指标名称与测量方法不一致。页面对“只计算已测题型”的提示不能解决把识别题归类为输出的问题。

**修复与验收：** 将选择、受限组句、独立输入、开放表达分别标记；统计同时呈现样本量和覆盖范围。修复需要考虑历史 production 记录的来源，不能只改未来题目。验收要求只做选择题时，独立输出仍显示未测。

### F07 · P2 · 组句只能接受一条字符串，合理语序变体被拒绝

**位置：** [lesson-types.ts](D:/Develop/Gemini/yasashiJapanese/web/src/data/lesson-types.ts)、[lesson-session.ts:45](D:/Develop/Gemini/yasashiJapanese/web/src/lib/lesson-session.ts:45)、[days-91-135.ts:5868](D:/Develop/Gemini/yasashiJapanese/web/src/data/lessons/days-91-135.ts:5868)。

`SentenceBuildStep` 没有 `acceptedAnswers`，转换成判题对象时也只传入一个答案。第 135 课提供的块可以组成「毎日少しずつ続けることです」，也可组成「少しずつ毎日続けることです」。后一表达仍保留“每天一点点地继续”的意思，但实际评分拒绝。

**影响：** 自由度看似来自组块操作，实际上只能复现作者的一种排列；学习者无法区分“语言上不成立”和“没有按教材指定顺序”。这不意味着所有排列都应接受。

**修复与验收：** 为人工审定的自然变体提供允许列表；若题目只测复现，明确要求按示范顺序复现，并避免将偏离示范统一解释为语法错误。不建议以宽松词袋匹配接受任意语序。

### F08 · P1 · 移动端 E2E 与当前布局不一致，发布门禁会失败

**位置：** [browser-flow-mobile.mjs:32](D:/Develop/Gemini/yasashiJapanese/web/tests/e2e/browser-flow-mobile.mjs:32)、[quality.yml:160](D:/Develop/Gemini/yasashiJapanese/web/.github/workflows/quality.yml:160)。

`assertCoverCopyBelowNavbar` 强制查找 `.vn-scene-intro`，当前首页已经删除该介绍元素。严格浏览器测试在这里中断；该测试也是 CI 浏览器门禁及 release 检查的一部分。

同尺寸 320×300 的独立测量显示导航底部 y=66、标题顶部 y=106，页面没有该检查所担心的标题被导航遮挡；错误原因是失效断言，不能写成“已确认手机标题遮挡”。

**修复与验收：** 用当前必需内容（主标题、正文或开始按钮）验证布局，保留导航遮挡和横向溢出检查；恢复整条严格 E2E 通过。不要只删除检查，或者因后续单独补跑通过就称 release 已全绿。

## 4. 学习路径与产品设计缺口

### D01 · P2 · 学完与达标之间缺少补练决策

**证据：** [lesson-navigation-bar.tsx](D:/Develop/Gemini/yasashiJapanese/web/src/components/lesson/lesson-navigation-bar.tsx)、[lesson-attempt.ts](D:/Develop/Gemini/yasashiJapanese/web/src/lib/lesson-attempt.ts)、[path-page-model.ts:227](D:/Develop/Gemini/yasashiJapanese/web/src/lib/path-page-model.ts:227)。

浏览器实测第一课四题全错，仍写入 `status: completed, score: 0`，并提供第二课入口。语法阶段状态只看主线推进到哪个阶段，不读取该阶段得分或知识点覆盖。

允许低分用户继续阅读本身可以是合理策略，现有界面也有“完成不代表掌握”的说明。问题是系统没有给出相应补练决策：低分和高分用户基本获得同一条后续路径。

**建议：** 保留阅读完成记录，增加“待巩固/可进阶”的教学判断；低分时给出具体错因、少量变式题和再次检查入口。阶段达标用新题与必要能力覆盖判断，不用全题强制 100% 把用户锁死，也不只依据完成次数。

### D02 · P2 · 目标设置的承诺大于实际路径差异

**证据：** [onboarding-panel.tsx:10](D:/Develop/Gemini/yasashiJapanese/web/src/components/home/onboarding-panel.tsx:10)、[learning-recommendation.ts](D:/Develop/Gemini/yasashiJapanese/web/src/lib/learning-recommendation.ts)、[learning-entry.ts](D:/Develop/Gemini/yasashiJapanese/web/src/lib/learning-entry.ts)。

“旅行实用”说明先学点餐、问路和求助，但主线下一课仅由完成集合与假名自评决定，目标不参与排序；目标只改变部分专项推荐阈值。只要还有主线课，主要入口始终优先主线。动漫目标在一些推荐分支中甚至要等主线全部完成才进入语用推荐。

**建议：** 明确选择“共同主线 + 目标专项”，并让首页同时显示目标专项；或真正建立旅行/动漫任务序列与所需前置知识。考试目标还需要目标等级、当前程度及独立阶段检测。未实现前，应收窄设置文案，避免用户以为已经切换课程体系。

### D03 · P2 · 课程词汇覆盖与课后补练没有连接完整

**证据：** [lesson-item-coverage.ts](D:/Develop/Gemini/yasashiJapanese/web/src/lib/lesson-item-coverage.ts)、[lesson-recap-model.ts](D:/Develop/Gemini/yasashiJapanese/web/src/lib/lesson-recap-model.ts)、[learning-session.ts](D:/Develop/Gemini/yasashiJapanese/web/src/lib/learning-session.ts)。

450 个主线声明词条中，206 个在全量课程练习步骤中都没有以该词条 ID 被考查；另有 39 个声明假名也没有对应条目级练习。它们可能出现在课文、词表或整句中，**不能据此说这些词没有被展示或教授**；但这种接触不能自动产生该词的答题证据或 SRS 记录。

课后按钮“用闪卡把本课词评成记住”只跳往整个词汇等级或总词汇页，没有传递本课词条集合。用户需要重新寻找目标词，并自行决定怎样补练。

**建议：** 课程完成后直接创建“本课词汇”集合，区分已接触、未测、需复习；允许添加复习而不自动标为掌握。为 `newItemIds`、教学材料、练习、复习入口建立覆盖矩阵，并为只做阅读接触的词明确标注用途。

### D04 · P2 · 正确的语法和句子没有常规间隔复习路径

**证据：** [learning-session.ts](D:/Develop/Gemini/yasashiJapanese/web/src/lib/learning-session.ts)、[review-questions.ts](D:/Develop/Gemini/yasashiJapanese/web/src/lib/review-questions.ts)、[coursebook/index.ts:76](D:/Develop/Gemini/yasashiJapanese/web/src/data/coursebook/index.ts:76)。

自动常规 SRS 支持假名和词汇。语法、句子答错后可以作为错题复习，因此并非“语法无法复习”；但一次答对的语法或理解题没有对应的到期计划。小结链接到前一课和前五课是固定编号规则，跟实际遗忘、薄弱点或学习间隔无关。

**建议：** 复习对象扩展为知识点/任务，不直接永久复用同一个题面；按近期表现和时间安排变式题。课后显示“本课哪些内容已进入复习、哪些仍未测”，避免仅有一个“去复习”总入口。

### D05 · P2 · 开放表达与阶段毕业没有可追踪证据

**证据：** [lesson-study-materials.tsx:25](D:/Develop/Gemini/yasashiJapanese/web/src/components/lesson/lesson-study-materials.tsx:25)、[coursebook/index.ts](D:/Develop/Gemini/yasashiJapanese/web/src/data/coursebook/index.ts)。

开放任务现在提供题目、示范和自查，要求在纸上写或开口说；没有保存草稿、录音、作品、完成自查或教师反馈的状态。第 175 课目标是完成综合作品，但系统无法确认用户是否做过。每单元五课共用阅读，理解题还会再次考查已读材料，阶段评价中缺少未见过的迁移材料。

已有界面明确说明开放表达不计选择题分数，这是正确边界，应保留。缺口是任务完成无法追踪、阶段毕业不能据此判断任务能力。

**建议：** 支持本地作品/草稿和针对本课目标的自评量表；毕业阶段使用独立新材料，分开呈现知识题结果与表达作品。没有可靠评分时，可以记录完成和人工自查，不应制造自动“口语达标分”。

### D06 · P2 · 学习时长设置实际控制题量，没有形成学习预算

**证据：** [daily-goal.ts:26](D:/Develop/Gemini/yasashiJapanese/web/src/lib/daily-goal.ts:26)、[coursebook/index.ts:71](D:/Develop/Gemini/yasashiJapanese/web/src/data/coursebook/index.ts:71)、[home-page.tsx](D:/Develop/Gemini/yasashiJapanese/web/src/components/home/home-page.tsx)。

每日目标等于分钟数乘 2。默认 10 分钟对应 20 次练习，课程建议时长却是 25–40 分钟；第一课 25 分钟只有 4 个评分步骤。认真阅读、听对话、写开放任务不贡献相同的练习计数。页面现在写的是“今日练习”，并非错误计时，但“学习时长”设置对实际任务安排作用很弱。

**建议：** 按预算生成“复习若干题 + 一个课程片段 + 一项可选表达”的任务包；分开显示完成任务、答题次数和估计时间。阅读/表达允许用户自报完成，不将浏览停留时长直接等同有效学习。

### D07 · P2 · 教材版本变化缺少结构化补课信息

**证据：** [lesson-session.ts](D:/Develop/Gemini/yasashiJapanese/web/src/lib/lesson-session.ts)、[lesson-runner.tsx](D:/Develop/Gemini/yasashiJapanese/web/src/components/lesson/lesson-runner.tsx)、[coursebook-migration.test.mjs](D:/Develop/Gemini/yasashiJapanese/web/tests/unit/coursebook-migration.test.mjs)。

当前主动保留旧完成记录，并在小结提醒新增内容可重练；这不是丢失历史或错误迁移。问题是没有课程内容版本和逐题内容版本，不能列出“这次新增而你没做的部分”。答案恢复主要看 step ID，未来若直接修改同 ID 题目，旧回答仍可能按旧 correct 状态恢复。

**建议：** 保留首次学习记录，同时记录完成的内容版本、题目版本和新增任务差集；提供“仅补新增内容”。本次发现的错误题修正后，也要有失效旧错题/重算相关证据的规则。不要简单清空所有学习数据。

### D08 · P2 · 分级、入学定位与能力覆盖仍需细化

**证据：** [lesson-skip.ts](D:/Develop/Gemini/yasashiJapanese/web/src/lib/lesson-skip.ts)、[course-phases.ts](D:/Develop/Gemini/yasashiJapanese/web/src/lib/course-phases.ts)、[skill-tree.ts](D:/Develop/Gemini/yasashiJapanese/web/src/lib/skill-tree.ts)、[path-page-model.ts](D:/Develop/Gemini/yasashiJapanese/web/src/lib/path-page-model.ts)。

当前是清晰的 175 课顺序，但入学定位只有假名自评，最多跳过前 21 课；已具备 N4/N3 知识的学习者没有主线定位测试或按阶段进入的诊断路径。技能树部分状态由比例推导，部分直接由课程阶段推导，听力、语用等节点又长期只是“可练习”，没有一致的能力完成标准。

汉字主要借助词汇表记和阅读出现，尚未形成与阶段同步的认读、常见读音及检验路径。N2 参考阶段有较长阅读，但当前整体还不能说明词汇、汉字、语法、听读速度和真实任务能力的覆盖程度。

页面已经注明等级为教学参考、不保证达标，这应保留。**不能因为这里使用 N5–N2 标签，就指称项目虚假宣称官方完整考纲；也不能因为有提示，就认为课程设计问题已解决。**

**建议：** 为每阶段提供进入条件、应能完成的任务、知识覆盖、毕业证据和补救路径；诊断结果允许跳过已会内容，同时保留查阅与复习。明确专项节点是推荐入口还是可达成能力，避免两种用途混用。

## 5. 工程、界面与维护评估

### 5.1 当前值得保留的实现

- 学习写入有统一锁与事务边界；已有同题重复、跨页面状态、失败回滚、恢复等检查，不宜为追求简单而随意拆掉。
- 课程已支持答题恢复、提示辅助标记、重练轮次与首次成绩保留。
- 有效的假名和词汇答题能进入复习，错题保留题干、答案和解析等上下文。
- 词汇按等级延迟加载，有分页和加载失败重试；没有在首页直接引入整个聚合词库。
- 全文课程与轻量目录分离；数据校验能发现目录引用与步骤数量等漂移。
- 明暗主题的主要页面与弹窗通过本轮 axe 检查；课程在 390 和 1440 宽度的阅读视图通过检查。
- 目前所见首页插画、文字和卡片能正常布局；320×300 的标题避让问题没有复现。主要发布问题是旧测试断言，而非已确认的新视觉溢出。

### 5.2 测试为什么没有发现上面的核心问题

当前测试对结构、持久化及组件约定覆盖较多，对题目是否能唯一作答、选项位置是否泄漏、指标是否代表所标能力覆盖不足。

例如 [validate-coursebook.mjs](D:/Develop/Gemini/yasashiJapanese/web/scripts/validate-coursebook.mjs) 验证选项文本不同、指定答案出现一次、解析长度足够；它没有能力据此证明干扰项在语义上错误。把说明写到 70 字、课文写到 350 字，也只能证明长度满足要求。

新增测试应针对真实反例，而不是再堆叠“源码包含某个函数名”的断言：固定首项猜题、同音音频、同释义词、允许的组句变体、零分后的推荐结果、本课词汇集合、正确语法的到期复习，以及修改题目后的旧记录恢复。

### 5.3 需要进一步验证的边界

| 边界 | 当前判断 | 后续验证 |
| --- | --- | --- |
| 真实日语 TTS | 依赖系统语音；课程调用没有完整展示播放失败状态。PWA 通过不等于语音可离线使用 | 真机测试有/无日语语音、断网、播放中导航、语音引擎错误；提供明确提示和替代流程 |
| 跨浏览器 | 本轮以 Chromium 为主 | Safari/iOS、Firefox、手机输入法及实际 Web Locks 支持；README 已说明不支持锁时拒绝写入，不能把该策略本身当成未知 bug |
| 内容准确性 | 已确认第 92 课问题；没有完成全量教师审校 | 审核全部规则、读音、语域、干扰项和中日译文，保存审校状态与依据 |
| 长期与多设备学习 | 本地存储和手动备份已实现，未见账号同步链路 | 多设备需求需明确；大量错题、长期使用、存储配额压力需单独测试 |
| 依赖安全与线上部署 | 仓库有依赖审计 CI；本轮未重新取得实时漏洞数据库结果，亦未检查远端运行状态 | 不应从本报告推导“零漏洞”或“线上版本与工作区一致” |

## 6. 建议实施顺序与验收标准

| 顺序 | 工作包 | 覆盖问题 | 可以验收的结果 |
| --- | --- | --- | --- |
| 1 | 恢复发布检查 | F08 | 当前布局的遮挡/溢出检查保留，完整严格浏览器流程通过 |
| 2 | 修复测评有效性 | F01–F05 | 语法选项无固定位置；听力无标题泄漏/同音互斥；同义词及第 92 课反例不再误判 |
| 3 | 修复评分与答案模型 | F06、F07、D07 | 独立输出不由选择题累加；组句接受审定变体；旧错误记录有可验证的迁移策略 |
| 4 | 打通课程到复习 | D03、D04 | 一键进入本课词汇集合；未测项目可见；正确语法和句子也有复习安排 |
| 5 | 建立阶段学习路径 | D01、D02、D08 | 完成与达标分开；低分有补救；已有基础能诊断定位；旅行/动漫目标改变可见任务 |
| 6 | 完善日常任务与作品 | D05、D06 | 时间预算映射到可完成的任务；表达草稿/自评可恢复；毕业使用独立材料 |
| 7 | 教学审校与设备验收 | 边界项 | 核心语法、例句、音频和题目有审校记录；目标真机测试通过 |

建议先以一个基础单元和一个进阶单元完成新的教学流程验收，再向全课程扩展。扩充数量之前，应先证明“知道该学什么、能可靠作答、答错后知道怎么办、过一段时间还能复习”这条完整流程成立。

## 7. 可复查证据

以下均为本轮生成的本地证据，`output` 目录通常被 Git 忽略；提交报告时若需要长期复现，应将关键反例转为正式回归测试。

- [数据与覆盖统计](D:/Develop/Gemini/yasashiJapanese/web/output/audit-20260909-analysis.json)：全部 245 个未被条目级考查的声明项目、20 组同释义候选、课程统计。
- [确定性逻辑复现结果](D:/Develop/Gemini/yasashiJapanese/web/output/audit-20260909-repros.json)：固定答案位置、同义词、同音假名、组句、能力统计、标题泄漏与第 92 课评分。
- [逻辑复现脚本](D:/Develop/Gemini/yasashiJapanese/web/output/audit-20260909-repros.mjs)：在应用根目录执行 `node output/audit-20260909-repros.mjs`。
- [浏览器零分通关与补跑结果](D:/Develop/Gemini/yasashiJapanese/web/output/audit-20260909-browser-extra.json)。
- [语法首项作答与听力标题的界面复现](D:/Develop/Gemini/yasashiJapanese/web/output/audit-20260909-ui-repros.json)。
- [听力标题截图](D:/Develop/Gemini/yasashiJapanese/web/output/audit-20260909-listening-leak.png)、[零分完成截图](D:/Develop/Gemini/yasashiJapanese/web/output/audit-20260909-zero-score.png)、[当前手机首页](D:/Develop/Gemini/yasashiJapanese/web/output/audit-20260909-mobile-home.png)。
- [完整浏览器测试失败日志](D:/Develop/Gemini/yasashiJapanese/web/output/audit-20260909-browser.log)、[单元测试日志](D:/Develop/Gemini/yasashiJapanese/web/output/audit-20260909-tests.log)、[课程与无障碍补跑日志](D:/Develop/Gemini/yasashiJapanese/web/output/audit-20260909-browser-extra.log)、[PWA 日志](D:/Develop/Gemini/yasashiJapanese/web/output/audit-20260909-pwa.log)。

外部语言规则核对先尝试 Agent Reach/Exa；该连接受限后使用内置网页搜索与阅读。结论只引用实际返回并核对的来源，没有以搜索失败代替语言判断。
