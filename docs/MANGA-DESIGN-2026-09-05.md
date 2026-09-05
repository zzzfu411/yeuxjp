# 日漫彩页设计与验收

本次反馈：简约版字号偏小，文字与留白比例不协调，配图摆放生硬；希望保留插画，形成整体日漫漫画风格。此设计替代上一版极简编辑风格，继续使用用户指定的加藤惠角色方向。

## 设计与实现

首页采用日漫单行本的彩色扉页构图。加藤惠、樱花、天空、网点和斜向分镜是同一张插画；整张插画覆盖纸面，左侧留白承接真实 HTML 标题，今日课程以对白框叠入画面。下方进度、复习、薄弱项形成三格分镜。主操作仍只有一个，设置保持按需打开。

色彩以纸白 #fffdf9、漫画墨色 #26263b、深樱桃粉 #ac3758、淡樱 #f1bbc9、晴蓝 #d9edf8、网点灰 #666477 为主。主要按钮使用较深的粉色保证白字对比。深色模式使用 #1e202b 阅读背景，扉页保留原画与纸白，学习区的背景、文字、线条随主题变换。

| 元素 | 上版 | 本版 |
| --- | --- | --- |
| 全站字体 | 包含楷体/衬线回退 | 中文黑体、日文 Gothic、拉丁无衬线 |
| 首页标题 | 53–72 px，较细 | 桌面约 80 / 102 px，手机约 36 / 46 px，粗体 |
| 导航 | 约 13 px | 16 px |
| 首页课程名 | 约 18 px | 桌面 24 px，手机 20–22 px |
| 首页说明 | 13–15 px | 16–19 px |
| 全站 xs / sm / base | 12 / 14 / 16 px | 14 / 16 / 17 px |
| 进度数字 | 约 17 px | 21–24 px |
| 页面标题 | 28–40 px | 32–44 px |

字体渲染通过 Chromium 的实际字体信息核对：本机中文使用 Microsoft YaHei，日文标题使用 Yu Gothic Bold。不同操作系统按指定中日文字体栈回退，不依赖在线字体服务。

手机单独构图：人物与大字标题并列组成短彩页，课程对白紧接下方，主要文字不压人物脸部；按钮全宽。320 px 窄屏允许课程名自然换行。平板采用铺满纸面的插画，修正了 contain 布局导致的横向素材边缘断层。

五十音、词卡、课程例句、测验模式和弹窗共用墨线、方角和少量错位边影。网点限于装饰区域；正文和学习内容保持清楚、稳定的背景。测验模式卡片增加行间距，避免边框挤在一起。

## 插画素材

- 生成方式：内置 image_gen，参考已生成的加藤惠形象，重新生成整页彩色插画。
- 原图：C:/Users/zfu/.codex/generated_images/01a07030-dfce-74b1-97f4-143ce6200110/exec-8358a8b2-531e-4c80-b1ba-0ec8178bffcd.png
- 项目素材：[megumi-manga.webp](../public/assets/visual-novel/megumi-manga.webp)
- 大小：1536 × 1024，127,940 bytes，约 125 KiB。Sharp 仅用于 WebP 格式压缩，quality 86；未做程序化背景移除或重绘。
- 可复现处理：`node scripts/prepare-visual-novel-assets.mjs <原图目录> manga`。
- Next Image 使用响应式 sizes、eager 和 high fetch priority。全站只加载一张首页角色图，深浅主题复用。
- 最初两次透明人物试图输出真实 alpha，但实际返回的是无 alpha 的 RGB 棋盘背景，未采用。最终改为纸白背景完整彩页，页面不宣称使用透明素材。
- 此为 AI 生成的角色同人视觉，不是官方素材或官方合作。

最终采用的完整提示词：

> Create a polished wide Japanese manga COLOR FRONTISPIECE illustration for a Japanese learning website, landscape 1536x1024. Character is Kato Megumi from Saekano, recognizable short dark brown bob hair and warm brown eyes, white beret, coral-red cardigan over white summer dress, holding a small school notebook in one arm and touching her beret naturally with the other. Restrained charming romance manga tone, fine dark ink outlines, delicate cel color and halftone accents. IMPORTANT COMPOSITION: character head to mid-thigh occupies the RIGHTMOST 43 percent, head top at 10 percent height, feet/dress cut at canvas bottom. LEFT 55 percent must remain completely empty solid warm off-white #fffdf9 negative space for HTML headings and controls; NO text, lettering, speech bubbles, logo, watermark or symbols anywhere. Behind character on the right only, airy pastel blue sky and faint sakura branch drawn with sketchbook thin ink, fading naturally into the same warm white paper toward center. Two subtle diagonal manga panel ink lines BEHIND character on right, not enclosing the entire illustration, character crosses those lines. Scene colors pale muted blue and blossom pink, coral character is focal. All LEFT edge and TOP edge pure warm white #fffdf9. No checkerboard, no transparency, no grayscale checker pattern. Actual solid warm white paper background. No frame or border around entire image. Editorial professional anime art with meticulous hands and eyes. This is a continuous illustrated page, not a photo pasted on a card. Use reference ONLY for character visual identity, replace the checker background entirely.

## 验收

- `npm run check`：通过数据校验、ESLint、724 项单元检查、生产构建、13 条主路由与 3 条 404 路由、385 条 sitemap 入口。
- 首页：320 / 390 / 768 / 1440 px，深浅主题共 8 个视图；插画加载正常，无横向溢出，4 个首页 axe 扫描通过。
- 内页：五十音、词库、课程、路径、测验、复习，桌面与手机、深浅主题共 24 张截图。
- 交互回归：`npm run e2e:browser:required` 通过，包括学习记录并发写入、课程继续与答题、假名与词库、测验和复习、设置保存与失败重试、弹窗键盘与焦点行为、手机布局。18 个布局记录均无横向溢出，390 px 手机的学习按钮与首个词卡单词完整进入首屏。
- 无障碍回归：32 个深浅主题页面和弹窗状态，自动扫描均无违规项。4 张设置与导航弹窗截图补充视觉核对。
- PWA 离线验证：通过。缓存版本更新到 v15，使页面、主题色和插画更新可被已安装客户端获取。
- 视觉记录：`output/playwright/manga-20260905/`；正式流程记录：`output/playwright/manga-regression-20260905/`。

自动无障碍扫描只能覆盖可检测规则；配图比例、文字避让、阅读顺序与视觉层次另行实看。历史审计、极简方案和旧截图保留用于追溯。

当前截图：[桌面首页](screenshots/home-manga.png)、[手机首页](screenshots/home-manga-mobile.png)、[深色首页](screenshots/home-manga-night.png)、[五十音](screenshots/kana-manga.png)、[课程](screenshots/lesson-manga.png)、[测验](screenshots/quiz-manga.png)。
