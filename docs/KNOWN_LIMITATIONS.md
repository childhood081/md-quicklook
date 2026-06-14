# Known Limitations

本文档记录 V1.6 + V1.7 + V1.8 + V1.8.1 联合审查后保留的中低风险限制。这里不代表发布阻断项，但进入最终发布前应按手动验收清单复核。

## V1.6 编辑模式

- 类 Word 编辑模式基于 Milkdown，会把编辑结果重新序列化为 Markdown；复杂排版可能和原始 Markdown 的空行、缩进或表格对齐不完全一致。
- 基础标题、段落、列表、引用、代码块、表格可编辑；嵌套列表、多段列表项、复杂表格单元格不是当前强化方向。
- 编辑模式、源码模式、阅读模式共享 Pinia Store 的 `currentContent`；如果未来加入更多编辑入口，应继续避免新增第二份内容状态。
- 类 Word 编辑模式支持撤销 / 重做，但第一版不提供专用查找面板；菜单查找会提示当前模式暂不支持。
- 剪切 / 复制 / 粘贴依赖系统 WebView 的编辑命令和当前焦点，少数平台或安全策略下可能降级为提示。

## Front Matter 操作

- Front Matter 操作是轻量实现，只支持 `title`、`subtitle`、`author`、`date`、`tags`。
- 不支持完整 YAML 语法，例如嵌套对象、多行字符串、复杂数组或锚点。
- 编辑 Front Matter 第一版使用系统输入框，不提供复杂表单、校验器或侧栏 UI。
- “从 Front Matter 生成标题”只在正文开头没有有效 H1 时插入标题，不会重排已有正文结构。

## V1.7 / V1.8.1 菜单与全应用语言

- 原生菜单语言当前只支持 `zh-CN` 和 `en-US`。
- 顶部原生菜单是语言切换主入口；当前没有单独的 Vue 设置页。
- 系统原生文件对话框按钮由操作系统控制，可能不会跟随 md-quicklook 应用语言。
- 后端 Rust 错误和底层 OS 错误仍可能包含英文；前端业务提示已尽量使用 i18n key。
- 原生菜单语言切换失败目前主要记录在后端路径中；最终发布前应手动验证持久化配置目录可写。
- Windows / macOS 菜单的编辑命令会转发给当前前端模式；阅读模式没有编辑历史，因此撤销 / 重做会降级提示。
- 文档缩放是应用内 UI 缩放，不修改 Markdown 原文，也不等同于系统 WebView 缩放。

## V1.8 导出路径

- Word / Excel 导出使用系统保存对话框；系统按钮语言可能跟随操作系统。
- 原子写入依赖目标目录支持 temp file + rename；少数云盘或虚拟文件系统可能失败。
- 导出默认文件名来自当前 Markdown 文件名；未打开文件时导出会被前端拦截。

## V2.0 导出视觉一致性

- Word 导出不能 100% 复刻网页 CSS，字体渲染、行距、代码高亮有可接受的差异
- Word 导出不支持 Shiki 级别的语法高亮着色
- PDF 导出依赖系统打印对话框，用户需手动选择"保存为 PDF"
- PDF 无法通过代码指定保存路径，依赖系统打印 UI
- Excel 导出只处理纯表格 Markdown 文件，不从普通文档抽取局部表格
- Excel 样式通过 xlsx-js-style 实现，字体为 SimSun（阅读模式使用网页字体）

## V1.8 Excel 导出

- Markdown 表格解析覆盖常见 GFM 表格；复杂单元格块级内容不作为 Excel 富文本保留。
- 数字识别是启发式规则，百分比会转换成小数；带千分位或本地化数字格式不会自动转换。
- Sheet 名会清理非法字符、截断到 31 字符，并在重复时添加合法后缀；极端长名称可能被进一步截短。

## V1.7 Word 字体

- Word 导出显式指定字体名称，但不打包字体文件；目标机器缺少对应字体时，Word / WPS / Pages 仍可能 fallback。
- 正文中文使用 `SimSun`，标题中文使用 `Microsoft YaHei`，代码使用 `Consolas`；不同办公软件的字体名称显示可能略有差异。
- DOCX 导出仍是 Markdown 结构转换，不支持复杂 Word 样式、页眉页脚、批注、修订、文本框、图片真实嵌入。

## 构建体积

- 当前 bundle 包含 Milkdown、Shiki、SheetJS、docx 等依赖，生产构建会出现 Vite 大 chunk warning。该 warning 不直接阻断发布，但最终发布前建议做全量包体积确认。

## V1.9 分发与部署

### macOS 分发
- 未签名 .dmg 需用户手动绕过 Gatekeeper（右键→Open 或 xattr 移除 quarantine）
- 未公证 .dmg 首次启动有额外安全警告
- 当前 macOS 16 beta 环境中，Tauri 自动 `.dmg` 创建使用的 `create-dmg` 可能失败；beta DMG 使用 `scripts/build-macos-dmg.sh` 通过 `hdiutil` 生成
- 当前 hdiutil beta DMG 包含 `md-quicklook.app` 和 `Applications` 快捷方式，但不包含自定义安装背景、图标布局或签名
- 需要 Apple Developer Program 会员 + Developer ID 证书才能签名和公证
- 最低系统要求 macOS 11.0 (Big Sur)，不再支持 macOS 10.15

### Windows 分发
- 未签名的 NSIS 安装程序会触发 SmartScreen 警告
- Windows 安装包尚未在真实 Windows 机器上构建和验证
- 仅支持 `currentUser` 安装模式（单用户），企业部署可能需要 perMachine
- 当前无 WiX (.msi) 输出，仅 NSIS (.exe) 安装程序
- 卸载后用户数据（settings.json、最近文件）不会自动清理
- 卸载后 .md/.markdown 文件关联不会自动恢复
- Windows 上原子写入使用额外的 rollback 机制，极端磁盘故障下可能丢失数据

### Mac App Store
- 未通过 Mac App Store 审核
- App Sandbox 未配置和验证
- 自动保存的 security-scoped bookmark 适配未实现
- 需要独立的 App Store Bundle ID 和 entitlements 配置

### 代码签名
- macOS：无 Developer ID 签名，无 Notarization
- Windows：无代码签名证书
- 两个平台均以未签名状态构建

### 自动更新
- 当前版本无自动更新功能
- 用户需手动下载安装新版本
