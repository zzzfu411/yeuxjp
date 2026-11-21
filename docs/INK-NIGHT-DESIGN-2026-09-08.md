# や：暗色与漫画按钮改造计划

## 设计目标

保留日漫人物与简洁阅读布局，重建暗色主题、左上角标志和按钮。记忆点集中在原创平假名书法「や」和主要行动按钮，阅读正文周围保持安静。「や」取自「やさしい」，以简单笔画、粗细变化和不对称重心形成辨识度。课程内容与学习记录沿用当前版本。

## 视觉规范

| 用途 | 色值 | 处理 |
| --- | --- | --- |
| 夜间底色 | #191B20 | 中性炭灰，减少原有紫灰偏色 |
| 夜间纸面 | #272A30 | 卡片、输入和弹窗与底色形成层级 |
| 文字 | #F2EFE7 | 柔和纸白，正文保持清晰 |
| 印刷墨线 | #08090B | 明暗主题都使用黑色轮廓，不在暗色中反转成白框 |
| 主要行动 | #E4C180 | 低饱和纸金，配黑色文字与墨影 |
| 次要提示 | #A9C5D4 | 雾蓝，用于链接、聚焦与冷色辅助 |

字体继续使用现有中日文无衬线系统，正文 17px，按钮 14–17px。书法仅用于导航标志，避免妨碍课程阅读。明亮主题保留现有纸白与樱色，但同样升级黑色描边。

布局：导航左侧为 52px 书法小方印与简短文字，中央为主要路径，右侧保留听力/主题/菜单；手机收起副文案。首页仍由标题、人物和课程对话构成一张扉页，夜间用炭灰遮罩融合现有插画。

```text
[ や ]  Yasashi      今日 / 路径 / 假名 / 复习      听力 / 主题 / 菜单
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ 大标题                  人物插画              ┃
┃ 课程对话框                                   ┃
┃ [ 开始学习 → ]━━                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  进度面板                     专项练习
```

按钮分层：主要行动为 2px 黑框、4px 硬墨影、边缘第二道细线；首页主行动额外使用两三条速度线。普通按钮较轻，选择题保留正确/错误颜色和文字图标反馈，导航工具按钮保持紧凑。按下时按钮向墨影方向移动；减少动态效果设置下取消过渡。

## 实施与验收顺序

1. 检查全局颜色、首页局部颜色、按钮覆盖规则与已有可访问性约束。
2. 用内置 imagegen 生成原创「や」字；核对字形、飞白和缩小后的识别，保存项目资产。
3. 更新全局暗色变量、Logo、按钮基础变体和首页主要按钮；同步卡片、弹窗与导航边线。
4. 检查浅色与深色、320/390/1440 宽度、按钮悬停/按下/禁用/答题反馈，修正冲突。
5. 执行内容校验、单元测试、构建、浏览器与离线回归，保存截图与结果；达到验收条件后完成 Goal。

## 原创标志

使用内置 imagegen，参考图模式，最终资产：`public/assets/brand/ya-calligraphy.png`。以用户提供的书法照片为笔触参考，生成独立字形。

生成提示：Make a minimal original Japanese calligraphy website logo. The exact and ONLY character is the HIRAGANA 「や」. NOT a kanji. NOT 凛. Only the three simple strokes of や, with very few gestures. Use attached photograph solely as expressive ink-brush reference. One bold irregular curved main stroke, small decisive upper mark, long confident descending stroke, unmistakably や. Thick/thin contrast, rich black ink, natural dry-brush texture, energetic off-center balance, not regular font. No extra loops, flourishes, splashes, lines, frame, seal, signature. Recognizable at 48px. Black ink on clean white square background, entire character 85% canvas. One mark.

生成结果为白底黑墨 PNG；52px 展示，轻微倾斜。2026-09-09 修正 Logo 色块：容器背景透明，浅色模式以 multiply 将白底融入导航背景；暗色模式反转笔画并以 screen 混合，呈现柔白书法。混合放在带旋转的容器上，避免子图层的混合被局部堆叠上下文隔离。

## 验证结果

已完成暗色变量、导航 Logo、漫画按钮、首页插画夜间遮罩、卡片及离线页面的统一；Service Worker 更新为 v17，使新版资源进入更新流程。

- `npm run check`：数据及课程内容校验、ESLint、728 项单元测试、生产构建、13 条路由及 3 条 404 HTTP 检查通过。
- 听力设置的透明按钮补充主题文字颜色，修复新按钮样式继承造成的暗色对比度冲突；修复后重新构建成功。
- WCAG 自动检查：32 个浅色/暗色页面与弹窗状态通过；不代表完整人工无障碍认证。
- 生产截图：浅色和暗色各检查 320、390、1440px 首页，无横向溢出，Logo 图片加载成功。最终截图位于 `output/playwright/ink-night-20260908/`。
- 按钮状态：明暗主题均验证黑色边框、键盘可见焦点、悬停、按下和禁用状态，证据为上述目录的 `button-states.json`。
- PWA 离线浏览器回归通过。
- 完整生产浏览器回归 `npm run e2e:browser:required` 通过：学习并发、课程与复习、测验和错题、保存失败处理、键盘操作、10 个课程阅读视图、听力持久化、输出自检、手机布局以及 32 状态可访问性检查均通过。

预览运行于 `http://127.0.0.1:3217/`。生成的 PNG 原图约 1.1MB，通过 Next Image 按显示尺寸优化传输；没有用图片替代课程正文。视觉验收已查看手机与桌面截图，但书法审美仍以用户实际反馈为准。
