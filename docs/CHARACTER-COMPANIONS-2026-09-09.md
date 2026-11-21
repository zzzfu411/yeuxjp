# 可爱角色配图与动作区分

加藤惠已按后续反馈改为从容的日常姿态，当前使用 `megumi-calm-manga.webp`；下文脸红版为历史设计记录。现行版本见 [加藤惠表情修正](MEGUMI-CALM-2026-09-09.md)。

## 设计

参考用户网站 [ddlVocab](https://ddlvocab.yeuxark.com/) 的登录页漫画近景、明显脸红，以及存档页面的小角色点缀。浏览器实际查看了这两个页面；没有读取账户内容或复制站内图片。

采用三种性格和不同动作：

| 人物 | 动作与表情 | 页面位置 | 装饰 |
| --- | --- | --- | --- |
| 加藤惠 | 抱着笔记本、微微歪头，明显脸红与安静微笑 | 首页大图 | 少量爱心和网点 |
| 牧濑红莉栖 | 抱臂侧身回望，挑眉、轻微脸红、嘴硬的傲娇表情 | 今日复习 | 一个小漫画情绪符号，无爱心 |
| 爱蜜莉雅 | 张开手掌挥手、眨眼微笑 | 学习进度 | 手势运动线，无爱心 |

角色保留各自服装与发色，不使用统一的捧脸、抱书、爱心模板。文字与课程入口仍为 HTML，小插画采用黑框漫画窗口，不遮挡操作。

沿用纸白 #FFFDF9、墨线 #08090B、炭灰 #191B20 和纸金 #E4C180；粉红腮红、红棕头发与淡紫服装只作为插画色彩。现有中日文字体与正文大小不变。布局为首页左文右图，下方进度卡与复习卡各有一张小图；手机卡片单列，配图 108px，桌面 144px。

```text
[ 标题 / 今日课程 ] [ 脸红的加藤惠 ]
[ 学习进度   爱蜜莉雅 ] [ 今日复习  红莉栖 ]
[ 进度数据          ] [ 薄弱项练习      ]
```

## 文件和工具

均由内置 imagegen 生成，再用项目 sharp 脚本做 WebP 编码；无第三方图片 API。

- `public/assets/visual-novel/megumi-blush-manga.webp`：1536×1024，91680 字节。
- `public/assets/visual-novel/kurisu-tsundere.webp`：640×640，31736 字节。
- `public/assets/visual-novel/emilia-wave.webp`：640×640，49474 字节。
- 项目原图：`output/imagegen/visual-novel/` 中对应的 `*-original.png`。
- 生成记录映射及转换入口：`scripts/prepare-visual-novel-assets.mjs` 的 `companions` 组。

## 验证

- ESLint、4 项首页契约测试和生产构建通过。
- 320/390/1440px，明暗两种主题共 6 个视图通过图片加载和横向溢出检查；已查看手机浅色与桌面明暗截图。
- 生产服务 `http://127.0.0.1:3217/` 已更新。复习入口、课程入口和学习设置弹窗验证通过。
- 32 个明暗主题页面与弹窗的 WCAG 自动检查通过。
- 生产截图与证据：`output/playwright/companions-20260909/`。

## 最终生成提示

### 加藤惠

Create a very cute Japanese romantic comedy manga website hero illustration, landscape 3:2. Megumi Kato from Saekano, recognizable short dark brown bob and white beret, coral red cardigan and modest white blouse. EXTREMELY CUTE soft round face, very big bright brown anime eyes, prominent rosy pink blush patches and several fine diagonal blush lines on BOTH cheeks, small bashful happy smile, head tilted, holds a little notebook close to her chest with both hands. Expressive moe manga face is the centerpiece, visibly embarrassed but happy, wholesome. Upper body portrait, large head, no full-length figure. Composition for webpage: left 53% completely empty uniform #fffdf9 paper white for real HTML text; character contained on right 44%, full beret inside frame, face center around 78% x / 30% y, head including hat about 40% canvas height, torso reaches bottom. Two small hand-drawn pink hearts near her on far right and a few tiny ink sparkles, sparse pale pink manga screentone behind right-side character only. Crisp hand-inked variable-width black lines, flat cel color, large graphic shadow shapes, simplified cute rounded face, flat blush, airy Japanese manga print look. No realistic anatomy rendering, no painterly airbrush, no glossy 3D, no detailed scenery, no text, no speech bubbles, no labels, no watermark, no frame. A strikingly adorable expressive manga close-up rather than a distant composed fashion pose.

### 牧濑红莉栖

Single square Japanese manga character illustration for a study website: Makise Kurisu from Steins;Gate. Recognizable long reddish chestnut hair, blue-violet eyes, white collared shirt, red tie, tan jacket. A distinct TSUNDERE pose: BOTH ARMS CROSSED firmly over chest, body turned three-quarter away to the left, face turned back toward viewer, one eyebrow raised, eyes slightly narrowed in a skeptical sideways glance, small stubborn pout, only subtle pink blush with a few fine cheek hatch marks. Expression says reluctantly pleased, clever and proud, affectionate but trying to hide it, not sad or angry, cute and lightly comic. Half-body from head to waist, entire head and crossed arms in view with generous 9% outer margins. Natural anime proportions with appealing rounded facial lines, no baby face, not chibi. Crisp black manga ink linework, flat cel colors, sparse screentone shadow, plain warm paper-white background. A tiny black manga irritation tick near temple is optional, at most one. ABSOLUTELY NO HEARTS, sparkles, flowers, text, speech bubbles, notebooks, cards, hands clasped near chest, bashful head tilt, shy forward pose or logos. Distinctive body gesture and tsundere attitude are the primary design. Wholesome fully clothed, polished professional anime comic portrait, no realistic rendering or soft painting.

### 爱蜜莉雅

One square cute Japanese manga half-body portrait of Emilia from Re:Zero. Recognizable long silver-white hair, braided section, violet flower hair ornament, purple eyes, pointed elf ears, fully clothed modest white and lavender high-neck fantasy dress. A lively DISTINCT action pose: she leans slightly toward viewer and raises ONE OPEN HAND beside her face in a friendly waving hello gesture, fingers naturally spread, other arm relaxed below. One eye playfully WINKING, other bright violet eye open, happy open-mouth smile, a light pink blush across cheeks. Warm playful cheerful personality, not bashful clasped hands. Head, hair ornament and waving hand completely inside square with 10% margins. Waist-up composition to show the wave clearly, soft cute anime facial shape, professional black manga ink lines and clean simple flat cel shading, sparse screentone shadow, no painterly realism. Plain warm paper-white background with ONLY two short hand-drawn black movement arcs near the waving hand. NO HEARTS, stars, floating decorations, speech bubbles, text, words, logos, flowers in the background, notebooks, clasped hands, arms crossed or shy pout. Character's own violet flower hair ornament stays. Wholesome kawaii anime smile and expressive gesture, clean illustration for a study progress companion.
