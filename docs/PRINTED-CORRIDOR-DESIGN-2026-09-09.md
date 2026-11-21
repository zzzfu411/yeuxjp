# 完整插画版文字回廊

本版替代之前的 SVG 回廊与独立人物叠层。根据用户要求，通过内置 `image_gen.imagegen` 以原动画截图为构图参考，生成一张人物、日文表格墙面和天花板融为一体的完整插画。

## 展示方式

- 桌面左侧保留课程信息，右侧展示完整 3:2 插画；1023px 以下按标题、插画、课程入口顺序排列。
- 图片使用自然比例，宽度 100%、高度 auto，不裁切、不叠加额外日文字、不用 CSS 或 SVG 绘制回廊，也不单独移动人物。
- 沿用站点日文字体与主题色：暖白 #fffdf9、墨色 #26263b、莓红 #ac3758、炭灰 #191b20、淡金 #e4c180。深色模式保留插画原色，以漫画画幅呈现。
- 图中表格文字作为场景装饰，不作为正式课程内容、日期或学习记录。实际课程名称、说明与按钮仍来自原有学习状态。

## 资产

站点文件：`public/assets/visual-novel/megumi-printed-corridor.webp`，1536 × 1024，327,232 字节。Sharp 转换 WebP，quality 92 / effort 6。

原始生图：`C:/Users/zfu/.codex/generated_images/01a07030-dfce-74b1-97f4-143ce6200110/exec-0623ec13-d329-4462-baf8-b7f203c7be41.png`。

参考：用户提供的 `codex-clipboard-82d4029a-43b8-4d01-bfd9-a0ca9a7b66d1.png`，仅用于构图与环境方向。

## 验证记录

ESLint 与 728 项单元测试通过。`scripts/verify-word-corridor.mjs` 检查 320、390、768、1440px 的浅色/深色组合，确认无横向溢出、图片原比例展示、没有旧 SVG、课程入口可用，并进行桌面/手机 axe 自动无障碍检查。截图位于 `output/playwright/printed-corridor-20260909/`。

生产构建通过，3217 预览已更新。生产复查发现 Next 图片优化接口的 828px 缩放请求持续等待，插画已改为直接使用预压缩 WebP（`unoptimized`），避免重复压缩密集文字并消除该加载依赖。

修正后在 3217 生产预览重新完成全部 8 组组合检查、无障碍检查与课程入口验证，全部通过。

## 生图提示词

> Use case: illustration-story. Generate one finished wide 3:2 anime illustration for a Japanese learning homepage. Use the supplied animation screenshot ONLY as a composition/environment reference: an immersive curved corridor constructed entirely from densely printed Japanese timetable sheets, with a girl running toward the camera. Deliver a cohesive fully painted scene, NOT an isolated character, NOT a website mockup.
> Character: Megumi Kato from Saekano, short dark brown bob, soft brown eyes, white beret, coral cardigan, white blouse, cream pleated skirt. She runs toward the viewer holding pale yellow study notebooks to her chest. Calm small smile, faint rosy cheeks, reserved gentle personality, hair and cardigan fluttering, natural running gesture. Medium close shot from beret down to upper thighs, character occupying central 45 percent of image width and 82 percent of image height, no distant tiny full-body figure.
> Environment is the main requirement: both walls AND ceiling covered edge to edge with LARGE dense black Japanese typography inside ruled rectangular timetable cells, thick black column headers, varied text scale, occasional muted gray vertical columns. The typography is printed FLAT ON THE SURFACES, following the curved walls and strong one-point perspective, shrinking consistently toward the vanishing point behind the girl. At least 12 visible densely filled table columns across each foreground wall, not sparse floating kana. Enveloping tunnel, broad curved left wall, right wall receding, ceiling covered in tables, very little blank floor. Use repeated correctly formed Japanese text for the wall headings and cell entries, such as 月 火 水 木 金 土 日, 1 2 3 4 5 6 7, 五十音, 音読, 復習, 文法, 単語, 会話, 読解, 聴解, 日本語, 練習, 学習, こんにちは, ありがとう, あいうえお, かきくけこ. These are environmental decorative timetable entries, not subtitles. Strong legible dark ink shapes close to camera, fine text in the distance. Keep tables coherently aligned in perspective.
> Style: Japanese TV anime frame, crisp expressive ink drawing, clean two-tone cel shadows, flat warm colors, pleasing face, detailed hand-drawn background, white/ivory paper and black print with muted gray bands, coral character as sole main color accent. Integrated shared perspective and light, no photorealism, no 3D, no glossy rendering, no hearts, no stickers, no floating extra text. Full bleed illustration, landscape 3:2, no letterbox bars, no watermark, no Chinese subtitle from reference, no web UI, no title overlay. Preserve the reference's dense enveloping typography and close cinematic camera while making a new original scene with Megumi.
