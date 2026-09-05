# 加藤惠首页主视觉

用户明确要求以《路人女主的养成方法》的加藤惠替换此前原创人物。采用角色同人插画，更新日景和夜景两套素材。

## 设计计划与审查

- 角色：加藤惠，短棕发、白色贝雷帽、红色开衫、白裙；表情自然克制，清楚保留角色辨识度。
- 场景：樱花坡道与春日微风。右侧人物用较舒展的半身至膝上构图，头部比例收小，左侧留给真实页面标题和学习按钮。
- 色彩：沿用雪白 `#fff9fc`、深靛 `#24283f`、晴空蓝 `#87b9e2`、樱粉 `#e980a8`，角色开衫的红色作为视觉焦点；夜景为同一构图的柔和蓝调。
- 字体：继续使用现有日文明朝体标题、中文无衬线正文。
- 排版：标题/主操作左对齐，角色位于右侧，下方课程对话框沿用现有学习数据。

```text
标题与学习入口      樱花 / 加藤惠（白帽、红开衫、白裙）
──────────────── 真实下一课 / 今日进度 ────────────────
```

审查：只给原来的泛化人物换衣服不能满足这次要求。重新生成加藤惠的角色场景，以短发轮廓、五官、服饰和安静神态共同建立辨识度，同时减少头像占比。日夜编辑时锁定身份、表情、服饰和构图。

参考：[动画角色页](https://www.saenai.tv/character/)、[Aniplex 发布的白色贝雷帽造型说明](https://prtimes.jp/main/html/rd/p/000001949.000016356.html)。图片为重新生成的角色同人插画。

## 交付与验证

- 当前素材：`public/assets/visual-novel/megumi-day.webp`（141,958 字节）、`megumi-night.webp`（171,826 字节），1536×1024。源图存档为 `output/imagegen/visual-novel/megumi-day-original.png`、`megumi-night-original.png`。
- 转换：`node scripts/prepare-visual-novel-assets.mjs <生成原图目录> megumi`；WebP 质量 82。旧素材保留，首页已使用新文件名。
- 图片尺寸提示按实际 cover 裁切计算：手机 520px 高的画幅需要约 780px 宽的源图，避免以 320px 图片放大而导致人物发虚；平板和桌面也设定了相应尺寸。
- PWA 缓存升级为 v13，场景仍按访问缓存；严格离线回归通过，包括清空浏览器缓存后的首页和离线主题切换。记录：`output/megumi-pwa.log`。
- 数据验证、Lint、生产构建、23 项首页/PWA 契约测试通过。
- 320 / 390 / 768 / 1440px × 日夜主题共 8 个视图通过资源加载和溢出检查，4 个桌面/手机无障碍扫描状态自动违规 0；图片背景上的人工复核项已结合截图检查。记录：`output/playwright/megumi-20260905/evidence.json`。
- 新项目截图：`docs/screenshots/home-megumi.png`、`home-megumi-night.png`。已刷新用户当前预览页并实际确认加藤惠夜景显示。

## 生成提示词

模式：内置 imagegen。日景为新生成作品，夜景以选定日景作为编辑目标。

### 日景

```text
Use case: illustration-story.
Asset type: final production artwork for a Japanese-learning website hero, landscape 1536 x 1024.
Primary request: Draw the recognizable character Kato Megumi (加藤恵 / 加藤惠) from Saekano: How to Raise a Boring Girlfriend (冴えない彼女の育てかた), in a refined Japanese anime key visual. Be faithful to her character design, not a generic brown-haired anime girl.
Character: her neat short straight chestnut-brown bob with inward-turning ends and natural bangs, softly shaped brown eyes with restrained highlights, her characteristic understated calm expression and a very slight gentle smile. She wears her iconic WHITE beret, a coral-red cardigan over a modest white knee-length dress, fully clothed. One hand lightly holds the brim of the white beret against the spring breeze, the other rests naturally at her side. Natural anatomy, no fanservice.
Scene: a quiet Japanese residential cherry-blossom hill road in spring, distant rooftops, railings and bright pale blue sky; the feeling of a gentle chance meeting on a sunny slope. Delicate floating cherry petals, sparingly used.
Composition: medium-long three-quarter figure, framed from the white beret to around the knees; the character is on the RIGHT, face center near x=74%, y=26%, entire head including hat only about 20-22% of image height. Her complete head, both eyes and hand must remain inside the frame. Figure from roughly x=58% to x=88%. Keep LEFT 46% as calm, pale airy negative space with sky and soft distant scenery, suitable for overlaid website text; no foreground branches or busy details there. Camera eye-level, natural proportions, no portrait close-up, no oversized head.
Rendering: crisp fine anime linework, clean controlled cel shading, delicate watercolor-like environmental atmosphere, restrained hair shine, elegant 2D TV-anime character fidelity rather than glossy 3D game rendering. Warm white daylight, sky blue, sakura pale pink, the cardigan as a single coral-red accent.
Constraints: NO text, captions, lettering, logo, watermark, UI, frames, notebook, blue hair ribbon, school uniform, extra people, exaggerated sparkling eyes, chibi proportions, photorealism, 3D or sensual framing.
```

### 夜景

```text
Use case: lighting-weather / identity-preserve.
Input image: the attached approved Kato Megumi daytime website hero is the EDIT TARGET.
Create its matching nighttime version for the same Japanese-learning website.
Keep absolutely the same Kato Megumi character design, face, eye shapes, calm expression, white beret, short straight chestnut bob, coral-red cardigan, white dress, hand holding the beret, other hand, body proportions, placement and framing. Keep the same cherry-blossom residential hill road, buildings, railings and left-side negative space.
Change ONLY the time of day, lighting and corresponding environment colors: peaceful romantic blue hour with a soft indigo sky, sparse delicate stars, warm house windows in the distant city, faint warm streetlight on the right, pale pink blossoms catching cool moonlight. Preserve the white hat and dress as recognizable white fabric under cool blue light, and the cardigan as muted coral. Her face must stay clearly readable, gently lit, with the same natural eyes and understated smile.
Maintain the same crisp 2D anime linework and restrained cel shading. Do not turn it into a glossy portrait or 3D render. Keep the same 1536 x 1024 canvas and exact composition so a light/dark theme switch feels like time passing in one scene.
No text, logo, watermark, UI, extra people, changed clothing, blue hair ribbon, notebook, neon cyberpunk, horror mood or sensual framing.
```
