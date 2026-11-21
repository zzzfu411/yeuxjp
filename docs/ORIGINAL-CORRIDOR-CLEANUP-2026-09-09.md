# 原图去字幕版本

按用户最新要求，首页改用用户原始动画截图的清理版本，替代此前重新绘制的加藤惠插画。

使用内置 `image_gen.imagegen` 编辑原图：移除顶部中文覆盖字幕，修补对应背景，去除上下黑边，保留原人物与日文日程表场景。图像编辑模型输出不是原文件的逐像素无损裁切；原始截图未覆盖。

- 输入：`C:/Users/zfu/AppData/Local/Temp/codex-clipboard-82d4029a-43b8-4d01-bfd9-a0ca9a7b66d1.png`
- 编辑输出：`C:/Users/zfu/.codex/generated_images/01a07030-dfce-74b1-97f4-143ce6200110/exec-82644977-6048-41dd-b1cb-e5a6073328bb.png`
- 项目素材：`public/assets/visual-novel/original-corridor-clean.webp`，1586 × 992，121,814 字节，WebP quality 92。
- 首页保留图片自然比例，继续直接加载预压缩文件。正式课程信息与入口仍在图片外。

## 编辑提示词

验证：生产构建、4 项首页契约测试、3217 生产预览的 8 组尺寸/主题检查通过，包含图片比例、无障碍与课程入口检查。

> Edit this exact supplied anime screenshot with minimal localized cleanup only. Remove ONLY the overlaid Chinese fansub sentence along the upper left/top (这里背景所显示的是动画制作的日程表。字幕组就不一一翻译了。), reconstructing the small underlying ceiling paper/table lines naturally. Crop away the solid black letterbox strips above and below the actual anime frame. Preserve the original orange-haired girl exactly: same face, eyes, worried expression, hair, pose, coral clothing, hands, yellow folders, original linework and colors. Preserve all native Japanese schedule lettering, numbers, grid columns, curved corridor walls and perspective exactly. Do not replace the girl with Megumi or any other character. Do not redraw or reinterpret the scene, do not beautify, change style, add words, remove Japanese lettering, change composition or sharpen into a different drawing. Output only the cleaned original full anime frame, approximately 16:9 landscape without black bars or Chinese overlay.
