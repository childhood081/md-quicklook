# App Store Metadata Draft

md-quicklook Mac App Store 上架元数据草案（中英双语）。

> 当前状态：草案。所有字段需要在 App Store Connect 中填写前最终确认。
> 实际提交前需配合截图、隐私政策 URL 和支持 URL 一起完成。

## 1. App 名称

**英文**：`md-quicklook`

**简体中文推荐**：`Markdown 快看`

### 中文名称备选

| 候选名称 | 优点 | 风险 |
|----------|------|------|
| Markdown 快看 | 英文关键词保留，中文直觉易懂 | "快看"可能被关联到其他产品 |
| MD 快看 | 简短，中文用户熟悉 MD 缩写 | "MD"不够正式，可能被 App Review 质疑 |
| 轻量 Markdown 快看 | 突出"轻量"定位 | 名称偏长（review 可能要求缩短） |

> 建议优先使用 **Markdown 快看**。App Store Connect 支持为不同语言设置不同名称，可在中国区使用中文名称。

## 2. 副标题 (Subtitle)

**English**: `Lightweight Markdown Viewer`

**简体中文**: `轻量 Markdown 阅读与导出工具`

副标题的长度限制为 30 个字符。当前中文副标题 15 个字符，英文 29 个字符，均符合要求。

## 3. 中文简介 (Description — zh-Hans)

```
md-quicklook 是一款轻量、离线、原生性能的 Markdown 文件阅读与编辑工具。

无需联网，无需账号。打开任何 .md 或 .markdown 文件即可开始工作。

核心功能：
• 阅读模式 — 类 Word 排版，支持代码块 Shiki 语法高亮
• 编辑模式 — 所见即所得 Markdown 编辑器，支持常用格式工具栏
• 源码模式 — 完整 CodeMirror 6 代码编辑器，Markdown 语法支持
• 目录面板 — 根据标题自动生成文档大纲，支持快速跳转
• 智能保存 — 800ms 防抖自动保存，使用原子写入防止文件损坏
• Word 导出 — 将 Markdown 转换为 .docx 文档，优化中文字体
• Excel 导出 — 提取 Markdown 表格生成 .xlsx，支持多 Sheet 和数字识别
• 双语界面 — 完整中英文菜单和界面语言切换

所有文件仅在本地处理，不会上传到任何服务器。
```

> 说明：使用克制、事实性的语气，不夸张，不提"最强""最好"等主观评价词。

## 4. 英文简介 (Description — en)

```
md-quicklook is a lightweight, offline, native Markdown file viewer and editor.

No internet required. No account needed. Just open any .md or .markdown file and start working.

Core features:
• Reading Mode — Word-style typography with Shiki syntax highlighting for code blocks
• Editing Mode — WYSIWYG Markdown editor with formatting toolbar
• Source Mode — Full CodeMirror 6 editor with Markdown syntax support
• Outline Panel — Auto-generated table of contents from headings with quick navigation
• Smart Auto-Save — 800ms debounced save with atomic writes to prevent file corruption
• Word Export — Convert Markdown to .docx with Chinese font optimization
• Excel Export — Extract Markdown tables to .xlsx with multi-sheet support and number detection
• Bilingual UI — Complete zh-CN and en-US menu and interface language switching

All files are processed locally. Nothing is uploaded to any server.
```

## 5. 关键词 (Keywords)

**建议关键词**（逗号分隔，上限 100 字符）：

```
Markdown,md,viewer,editor,Word,Excel,export,document,markdown editor,markdown viewer,docx,xlsx,table,offline,plain text
```

> 策略：覆盖功能词 (viewer/editor/export)、格式词 (Markdown/md/docx/xlsx)、场景词 (offline/plain text/document)。避免品牌词和竞品名称。

## 6. 分类建议

| 分类 | 理由 |
|------|------|
| **Productivity**（推荐） | 应用定位是文档工具，面向需要阅读和编辑 Markdown 文件的普通用户。与 Notes、Text Editor 等同属于 Productivity 类别。 |
| Developer Tools | Markdown 常用于技术写作，语法高亮和源码模式是开发者场景。但应用整体设计偏向通用文档工具，非纯开发者工具。 |

> **建议选择 Productivity 作为主分类**，Developer Tools 作为次要分类（App Store Connect 支持选择主要和次要两个分类）。

取舍原因：
- Productivity 类别用户基数更大，覆盖面更广
- Developer Tools 类别用户更挑剔且竞品更多
- 应用界面设计（阅读模式类 Word 排版、WYSIWYG 编辑）偏向 Productivity 场景
- Word/Excel 导出功能更贴近办公场景而非纯开发工具

## 7. 隐私说明草案

以下内容对应 App Store Connect 的隐私标签：

| 数据类型 | 是否收集 | 用途 |
|----------|----------|------|
| 联系方式（姓名、邮箱等） | 不收集 | 无需账号 |
| 健康与健身 | 不收集 | 不相关 |
| 财务信息 | 不收集 | 不相关 |
| 位置 | 不收集 | 不相关 |
| 敏感信息 | 不收集 | 不相关 |
| 联系人 | 不收集 | 不相关 |
| 用户内容（文件内容） | 不收集 | 文件仅在本地处理，不上传 |
| 浏览历史 | 不收集 | 不相关 |
| 搜索历史 | 不收集 | 不相关 |
| 标识符 | 不收集 | 无设备 ID 获取 |
| 购买记录 | 不收集 | 无内购 |
| 使用数据 | 不收集 | 无埋点、无分析 SDK |
| 诊断数据 | 不收集 | 无崩溃报告 SDK |
| 其他数据 | 不收集 | — |

**App Store Connect 隐私标签应全部标记为"Data Not Collected"。**

简洁版隐私声明（可用于 App Store Connect）：

```
md-quicklook 不需要用户账号，不上传任何文件内容，不收集任何个人数据。
所有文件仅在用户本地设备上处理。导出文件保存到用户自己选择的位置。
应用不包含第三方分析 SDK，不追踪用户行为，不包含广告。
```

## 8. 支持网址

```
TODO — 建议使用 GitHub Issues 页面或项目主页：
https://github.com/<org>/md-quicklook/issues
```

## 9. 隐私政策网址

```
TODO — 需要准备公开可访问的隐私政策页面。
草案已编写在 docs/PRIVACY_POLICY_DRAFT.md 中，可直接发布为 GitHub Pages。
```

> 不能伪造隐私政策 URL。App Store Connect 提交前必须先准备一个真实、公开、无需登录即可访问的 URL。

## 9.1 版本策略

当前项目内部版本为 `1.9.0-beta / 1.9.0`。

Mac App Store 建议：

| 字段 | 建议值 | 说明 |
|------|--------|------|
| Marketing Version | `1.0.0` | App Store 正式版本号使用稳定数字版本 |
| Build Number | `1` | TestFlight 第一个构建 |
| Beta 状态 | 写入 TestFlight 测试说明 | 不放进正式版本号字段 |

如果 App Store Connect 已经创建了 `1.9.0` 版本，也可以继续使用 `1.9.0` 作为 marketing version，但不要使用 `1.9.0-beta` 作为正式 App Store 版本号。

## 10. 截图清单

Mac App Store 截图要求：
- 至少 1 张（建议 4-6 张）
- 分辨率：1280x800 / 1440x900 / 2560x1600 / 2880x1800
- 格式：PNG 或 JPEG（建议 PNG）
- 不可包含透明区域、不可包含设备外框

| 截图 | 内容 | 分辨率建议 |
|------|------|-----------|
| 1. 欢迎页 | 拖拽区域 + 最近文件列表 + Choose File 按钮 | 2560x1600 |
| 2. 阅读模式 | 打开示例 Markdown，显示 Shiki 高亮代码块 + 目录面板 | 2560x1600 |
| 3. 编辑模式 | Milkdown WYSIWYG 编辑器 + 格式工具栏 | 2560x1600 |
| 4. 源码模式 | CodeMirror 6 编辑器，Markdown 语法着色 | 2560x1600 |
| 5. Word 导出 | 导出对话框 + 生成的 .docx 预览（或导出过程的界面） | 2560x1600 |
| 6. Excel 导出 | 导出包含表格的 Markdown，展示多 Sheet 结果 | 2560x1600 |
| 7. 中英双语 | 语言切换菜单展示（中文界面 + English 界面分屏或两张） | 2560x1600 |

> 截图建议在 macOS 15 (Sequoia) 或当前最新稳定版 macOS 上捕获，使用浅色外观（Light Appearance）。

## 11. 版权与年龄分级

- **版权**：`Copyright 2026 md-quicklook contributors`
- **年龄分级**：建议 `4+`（无用户生成内容、无网络访问、无内购、无广告）

## 12. App Store Connect 填写清单

| 字段 | 值 | 状态 |
|------|-----|------|
| 名称 | `md-quicklook`（全球）/ `Markdown 快看`（中国区可选） | 草案 |
| 副标题 | `Lightweight Markdown Viewer` / `轻量 Markdown 阅读与导出工具` | 草案 |
| 描述 | 见上文第 3 节（中文）和第 4 节（英文） | 草案 |
| 关键词 | 见上文第 5 节 | 草案 |
| 主要分类 | Productivity | 草案 |
| 次要分类 | Developer Tools | 草案 |
| 支持网址 | TODO | 待创建 |
| 隐私政策网址 | TODO | 待发布 |
| Marketing Version | `1.0.0`（建议） | 待确认 |
| Build Number | `1`（建议） | 待确认 |
| 版权 | `2026 md-quicklook contributors` | 已确定 |
| 年龄分级 | 4+ | 建议 |
| 截图 | 7 张（见清单） | 待截取 |
| App 图标 | 1024x1024 PNG | 已有 `icon.png` |

> 以上所有内容在下发到 App Store Connect 之前仍需人工最终审核。
