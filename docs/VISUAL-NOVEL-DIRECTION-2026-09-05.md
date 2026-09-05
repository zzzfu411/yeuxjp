# 日漫视觉小说风格改版

后续角色调整：用户要求以加藤惠替换本文的原创人物，当前首页素材和验证见 [加藤惠主视觉记录](KATO-MEGUMI-DIRECTION-2026-09-05.md)。本文保留共享界面方案和上一阶段素材记录。

用户确认：角色与恋爱视觉小说感更强，接近《路人女主》《五等分》的青春氛围。此前纸面杂志风不满足这一方向。本次围绕原创角色、日常场景和视觉小说式学习入口改版。

## 视觉方案

- 配色：雪白 `#fff9fc`、深靛 `#24283f`、草莓粉 `#e980a8`、晴空蓝 `#87b9e2`、日光黄 `#f3da87`、藤紫 `#8f82c3`。装饰色与可读文字色分开，暗色为同一场景的温柔夜间氛围。
- 字体：日文主标题用本机日文明朝体栈，正文使用中日无衬线栈；标题保留日漫片名的节奏，字号不遮挡角色。所有关键功能仍用中文清楚标注。
- 首页：原创角色是视觉中心，背景是晴空、校园附近的日常场景；标题与继续学习在左侧，右侧角色留完整脸部，下方为含真实学习数据的剧情式课程卡。手机保留角色和主要操作，内容自然向下展开。
- 内页：对话式标题、细双线边框、柔和色块、清楚的选项按钮；移除纸角、粗硬投影、满屏网点和胶带装饰。课程正文和词卡第一屏目标继续保持。
- 动态：只保留轻微场景入场和用户触发的翻卡/选项反馈，尊重减少动态设置。背景不反复漂浮，不自动播放语音。

桌面草图：

```text
标志             导航                         主题 / 菜单
┌──────────────────────────────────────────────────────┐
│ 日文标题                天空 / 原创角色主视觉            │
│ 中文学习定位               完整脸部 / 手持笔记             │
│ [继续学习] [课程目录]                                  │
│ ┌ 下一课 · 真实课名 / 进度 ────────────────────────┐   │
│ └───────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
学习进度         课程章节 / 今日复习 / 薄弱项
```

自我审查：仅把旧页换粉色、加圆角仍不足以形成日漫感，因此以原创角色主视觉和场景化首页为第一视觉锚点；其余页面减少装饰，借助同一套边框、色彩与选项语言延续风格。不会让角色图替代可访问文字或动态学习数据。

## 素材与验证

采用内置 imagegen 生成原创场景图，最终素材保存在 `public/assets/visual-novel/`，保留源图并生成面向网页的压缩版本。素材不作为全量安装预缓存；首屏资源有固定尺寸和加载优先级。

验证桌面/手机、亮/暗、对话框、课程和词卡；保留既有学习数据协议。运行数据/类型/构建、适当的浏览器及离线回归，确认风格调整没有退回全量词卡、失去焦点指示或破坏离线资源加载。

## 生成素材与提示词

模式：内置 imagegen。先生成日景，再以该图为编辑目标生成同一角色的夜景。原图为 1536 × 1024；通过 Sharp 转为质量 82 的 WebP，日景 143,876 字节、夜景 133,670 字节，两张合计约 271 KiB。页面使用 Next Image 的响应式尺寸与优先加载；素材按访问缓存，不加入安装预缓存。

- 发布素材：`public/assets/visual-novel/study-day.webp`、`study-night.webp`。
- 源图存档：`output/imagegen/visual-novel/study-day-original.png`、`study-night-original.png`。
- 转换脚本：`scripts/prepare-visual-novel-assets.mjs`，输入为保留生成文件名的原图目录。

日景提示词规格：

```text
Use case: illustration-story.
Asset type: 1536 × 1024 original Japanese romance visual novel website hero artwork.
Scene: a coastal university terrace in spring, open blue sky, cherry blossoms in the upper right, distant campus buildings and sea.
Subject: one original adult university student, age 20; short cocoa-brown hair with a blue ribbon, warm amber eyes, ivory cardigan over a powder-blue blouse, navy skirt, holding a pink notebook. Gentle, inviting expression.
Style: polished fine-lined anime illustration with elegant cel shading and delicate lighting, a youthful romantic visual novel atmosphere.
Composition: character centered near the right 75% of the frame, face around 29% of the height, body extending to the lower portion; keep the left 43% mostly open sky for readable real HTML text. Preserve a complete face and natural hands.
Palette: porcelain white, sky blue, soft cherry pink and warm daylight.
Constraints: no text, UI, logos, watermarks, 3D rendering, chibi proportions, paper collage, or existing franchise characters.
```

夜景编辑提示词规格：

```text
Use case: lighting-weather, identity-preserve.
Input image: the approved daytime artwork, used as the edit target.
Change only the time of day and lighting to a soft romantic blue hour: indigo night sky, delicate stars, softly lit coast and warm campus windows.
Keep the same character identity, expression, pose, face, hands, hair ribbon, clothing, notebook, framing, scenery and negative space. Preserve the original fine-lined anime illustration style.
Mood: peaceful, intimate, gently luminous; the night scene belongs to the same romantic visual novel world.
Constraints: no science-fiction interface, neon cyberpunk, ominous mood, added characters, text, logo or watermark.
```

## 实现范围

首页重构为可交互的角色场景和课程对话框；课程完成后卡片能切换为专项练习或复习，不继续显示虚构的下一课。全站同步柔和配色、按钮、词卡、假名卡片、复习/测验插图、弹窗和焦点状态；移除纸张颗粒、纸角和胶带视觉。离线页、浏览器主题色和 PWA 清单同步，缓存版本更新为 v12。

移动端以 320 / 390 / 768px 验证角色裁切和标题，桌面检查 1440px。学习页保持内容优先，不在答题区叠加角色或背景图片。原有功能、学习数据存储协议和备份格式沿用此前修复版本。

## 验收结果

| 检查 | 结果与证据 |
| --- | --- |
| 数据、Lint、单元测试、构建、HTTP | `npm run check` 通过；725 项测试通过，13 条正常路由、3 条不存在路由通过。记录：`output/visual-novel-check.log`。 |
| 完整浏览器回归 | 通过学习、保存失败恢复、备份恢复、跨页面并发、手机导航与弹窗等流程。记录：`output/visual-novel-browser.log`。 |
| 布局与交互 | 18 个页面/尺寸组合通过；390px 词库只挂载 24 张卡，首词底部 824px，在 844px 首屏内；课程正文从约 296px 开始。记录：`output/playwright/visual-novel-20260905/evidence.json`。 |
| 亮暗无障碍扫描 | 28 个页面/弹窗状态，自动违规 0。24 个状态仍有自动工具不能判定的项目，包括插画/渐变背景上的对比度；已结合截图检查文字遮罩、字号与角色位置，不将自动通过等同于完整无障碍认证。 |
| 最后交互细节 | 修正暗色课程悬停和文本选择颜色，补足测验选项行距；最终构建、3 项测验组件契约、6 个亮暗交互状态扫描通过。记录：`output/visual-novel-final-build.log`、`output/visual-novel-final-states.log`。 |
| 离线与 PWA | 严格离线回归通过，覆盖清除浏览器缓存后的首页、离线主题切换与两幅场景图、已访问课程、笔顺及安装资源。记录：`output/visual-novel-pwa.log`。安装预缓存仍只有 7 项、约 0.03 MiB。 |
| 本地开发 | 为 Next 的 `allowedDevOrigins` 添加精确的 `127.0.0.1`，修正本机 IP 访问时开发资源被拦截、页面未完成客户端加载的问题。开发模式加载与主题交互验证通过。记录：`output/visual-novel-dev.log`。 |

项目截图已保存为 `docs/screenshots/*-vn.png`，首页夜景为 `docs/screenshots/home-vn-night.png`，README 使用这些新版截图。原有审计、成熟度计划与修复结果文档保留为本次视觉调整之前的阶段记录。
