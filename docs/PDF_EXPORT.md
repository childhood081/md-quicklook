# PDF Export / PDF 导出

## 技术路线

AI 文档快看的 PDF 导出使用 **系统打印对话框** 方案：

1. 前端使用 `renderMarkdown()` + `highlightCodeBlocks()` 生成与阅读模式完全一致的 HTML
2. 构建自包含 HTML 文档，嵌入阅读模式 CSS 和打印 CSS
3. 在隐藏 `<iframe>` 中加载该文档
4. 调用 `iframe.contentWindow.print()` 打开系统打印对话框
5. 用户选择"保存为 PDF"完成导出

### 为什么不使用 Puppeteer/Playwright

- 不引入 Chromium（体积 >300MB，违反"不引入特别大的依赖"原则）
- 不要求用户安装外部命令行工具
- 系统打印是所有现代操作系统的内置功能

### 为什么使用 iframe 而非弹窗

- iframe 不会产生可见的弹窗闪烁
- 打印完成后自动清理 iframe
- 与 Tauri WebView 兼容性好

## macOS 上保存为 PDF

1. 点击工具栏"PDF"按钮或菜单"文件 → 导出 PDF…"
2. 系统打印对话框打开
3. 点击左下角 **PDF** 下拉菜单
4. 选择 **"存储为 PDF…"**
5. 选择保存路径，点击"存储"

macOS 原生打印对话框的"存储为 PDF"功能完整保留所有 CSS 样式（包括背景色、Shiki 代码高亮）。

## Windows 上保存为 PDF

1. 点击工具栏"PDF"按钮或菜单"File → Export PDF…"
2. 系统打印对话框打开
3. 在打印机列表中选择 **"Microsoft Print to PDF"**
4. 点击"打印"
5. 选择保存路径，点击"保存"

> 注意：Windows 的 Microsoft Print to PDF 可能在处理 `print-color-adjust: exact` 时有差异。
> 如果背景色丢失，请检查打印对话框中的"背景图形"选项是否已启用。

## 是否支持直接选择 PDF 保存路径

第一版（v2.0）**不支持**直接选择 PDF 保存路径。用户需要在系统打印对话框中手动选择"保存为 PDF"和目标路径。

原因：
- 浏览器/WebView 的 `window.print()` API 不提供编程式 PDF 保存路径
- 使用 `@page` 和 CSS 打印媒体查询是跨平台最可靠的方式
- Tauri 2 没有内置的 HTML-to-PDF 转换功能

未来可能的改进方向：
- 如果 Tauri 生态中出现轻量级 HTML-to-PDF 插件，可以考虑集成
- 目前系统打印方案已经满足"视觉一致"的核心需求

## 当前限制

1. **需要用户在打印对话框中操作** — 不能一键静默保存
2. **依赖系统打印到 PDF 功能** — macOS 有原生支持，Windows 需要 Microsoft Print to PDF（Windows 10+ 内置）
3. **不支持自定义页面大小** — 固定 A4（210mm × 297mm）
4. **页眉/页脚** — 系统打印对话框可能默认添加页眉页脚（文件名、日期、页码），用户需要手动关闭
5. **打印引擎差异** — macOS WebKit 和 Windows WebView2 的打印渲染可能有细微差异

## 依赖

- 无外部依赖
- 使用浏览器内置 `window.print()` API
- 纯前端实现，不涉及 Rust/Tauri 端
