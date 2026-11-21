# 首页设计：文字回廊

## 设计与落地

参考用户提供的动画画面中“人物奔跑在文字回廊”的空间构图，将场景改为日语学习的视觉隐喻。首页沿用清晰的学习入口、大标题、留白和漫画描边按钮。

1. 用原生 SVG 构建墙面、天花板、地板与透视网格，加入「あいうえお」「ありがとう」「話す」「聞く」「読む」等日文。文字保留为代码，可随主题调色。
2. 新生成抱着学习笔记奔跑的加藤惠插画。使用透明背景，保留平静的神情、轻微脸红与白色贝雷帽；与回廊组合，避免矩形贴图的背景色差。
3. 桌面采用左侧标题与课程入口、右侧场景的结构。手机采用标题、回廊、课程入口的顺序；标题与短句并排，缩短首屏高度。
4. 浅色使用暖白、墨色与莓红；深色使用炭灰、暖白与淡金。人物适度降低饱和度与亮度以融入深色场景。
5. 只提供 850ms 的一次性入场动画，不使用持续位移或逐帧跑步动画。尊重 reduced-motion 设置。装饰场景对屏幕阅读器隐藏，课程名称与按钮继续使用真实学习数据。

## 文件

- `src/components/home/word-corridor.tsx`：文字、透视结构与人物图层。
- `src/components/home/home-scene.tsx`：首页布局及真实课程入口。
- `src/app/word-corridor.css`：布局、主题和响应式样式；在根 layout 引入。
- `public/assets/visual-novel/megumi-word-corridor.webp`：透明插画，800 × 1200，77,492 字节。
- `scripts/verify-word-corridor.mjs`：主题、响应式、无障碍、减少动画和课程入口验证。
- `tests/unit/home-onboarding-contract.test.mjs`：更新装饰场景与真实课程数据的契约。
- `tests/e2e/browser-flow-mobile.mjs`：首页副标题检查对应新的实际元素。

## 图像生成记录

方式：内置 `image_gen.imagegen`，新生成透明人物素材；未将参考截图直接裁切或当作站点背景。

原始输出：`C:/Users/zfu/.codex/generated_images/01a07030-dfce-74b1-97f4-143ce6200110/exec-8719ce8a-68e8-4768-bede-82ef1a8f5591.png`，1024 × 1536 RGBA。通过 Sharp 缩放并转换为 WebP，quality 88、alphaQuality 100、effort 6。

完整提示词：

> Generate a production-ready transparent-background anime character asset for a Japanese-learning website. Single figure only: Megumi Kato from Saekano, recognizable short dark-brown bob with subtle side bangs, soft brown eyes, her white beret, coral-red cardigan over modest white blouse, cream pleated knee-length skirt, opaque dark tights and brown loafers. Faithful understated personality: small closed-mouth smile, slightly rosy cheeks, calm warm determination, not exaggerated idol expression. Dynamic full-body running toward camera at slight three-quarter angle, mid-stride with one knee raised and opposite leg trailing, natural believable anatomy. Holding two pale mustard study notebooks securely against chest with one arm, other arm moving naturally; cardigan hem and short hair move in breeze. Eye-level camera, whole figure including hat and shoes visible with generous 8 percent margins, no cropping. Clean Japanese TV-anime cel animation drawing, appealing face, crisp varied dark ink outlines, flat color with only 2-tone cel shadows, delicate face linework. No realism, no 3D, no glossy painterly rendering, no hearts, no chibi proportions, no extra people, no props beyond two books, no text, no logo. Isolate cleanly on actual transparent background with alpha; no white rectangle, no floor, no cast shadow, no scenery. Portrait 2:3 composition. Character will be composited by website code into a perspective corridor built from Japanese typography.

## 验证

- ESLint 通过，728 项单元测试通过，生产构建通过。
- 在本地生产预览 `http://127.0.0.1:3217` 验证浅色/深色 × 320/390/768/1440px 共 8 种组合，无横向溢出，标题未被导航遮挡，按钮点击区域满足检查，减少动画设置生效。
- 浅色/深色的 390px、1440px 页面通过 axe 的 WCAG 2 A/AA 与 WCAG 2.1 AA 自动检查；自动检查不能代替完整人工无障碍审计。
- 两种主题下均可通过首页按钮进入实际课程，没有页面运行异常。
- 现有 `npm run e2e:browser:required` 在生产预览通过，覆盖学习流程、移动端、课程阅读与听力状态等，并完成 32 种浅色/深色页面和对话框状态的无障碍检查。日志为 `output/corridor-browser.log`。
- 截图和数值记录保存在 `output/playwright/word-corridor-20260909/`。已人工查看桌面浅色/深色与手机浅色截图并调整手机文案间距。

本次范围为首页设计融合，未将此前仓库审计中的全部业务问题视为已经修复。
