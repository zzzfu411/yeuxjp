# 加藤惠表情修正

根据用户对角色气质的反馈，替换首页加藤惠插画：较自然的眼睛比例、放松的眼神、轻微笑意，以及随手搭着包带的日常姿态。移除爱心、夸张腮红、抱本子和刻意害羞的姿势。沿用漫画线稿和现有左文右图构图，红莉栖与爱蜜莉雅不变。

工具为内置 imagegen；最终资产 `public/assets/visual-novel/megumi-calm-manga.webp`，1536×1024，60746 字节。原图保存在 `output/imagegen/visual-novel/megumi-calm-manga-original.png`。转换命令为 `node scripts/prepare-visual-novel-assets.mjs <生成目录> megumi-calm`，仅做网页格式压缩。

## 验证

生产构建、相关 ESLint 和 4 项首页契约测试通过。生产端口 3217 已更新；明暗两种主题下的 320/390/1440px 页面共 6 个视图通过图片加载和无横向溢出检查，课程入口、复习入口、学习设置弹窗均可用。截图保存在 `output/playwright/megumi-calm-20260909/`，已查看手机浅色与桌面暗色效果。

## 最终提示词

Create a fresh website hero illustration of MEGUMI KATO from Saekano / Saenai Heroine no Sodatekata, faithful to her understated everyday character rather than a generic bashful moe girl. Landscape 3:2 composition. She has a neat short dark brown bob with natural bangs, ordinary softly almond-shaped brown anime eyes, relaxed upper eyelids, a composed observant gaze looking toward the viewer, almost neutral expression with just a tiny knowing closed-mouth smile. Her charm is quiet, grounded, natural and subtly amused. Normal anime proportions, NOT oversized sparkling eyes or baby face. White beret, simple coral-red cardigan over a plain modest white blouse without frilly neckline. Casual three-quarter waist-up pose, shoulders relaxed, one hand resting loosely on a simple shoulder bag strap near her shoulder, other arm resting naturally down out of frame. No clutching books, no hands together, no coy head tilt, no flushed embarrassed pose, no blush stripes, no saturated pink cheeks, no romantic hearts or sparkles. Only an extremely faint natural warmth on cheeks if any. Style: beautiful crisp hand-inked Japanese slice-of-life manga, tasteful flat cel shading, restrained black contours, a little subtle screentone on fabric, recognizably 2D drawn anime, no photographic or painterly realism. Layout: LEFT 53% completely empty solid warm white #fffdf9 for real website text. Entire character within RIGHT 44%, hat top fully visible with margin, head center x=78% y=28%, head including beret roughly 34% of canvas height, torso to bottom edge. Plain warm white backdrop with just a very pale gray-blue screen tone patch behind right-side shoulder, no scenery, no other objects. No text, logos, speech bubbles, frames, hearts or watermark. Cute through natural expression and distinctive personality, calmly present rather than performing cuteness.
