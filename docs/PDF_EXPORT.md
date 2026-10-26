# PDF Export / PDF 导出

## 技术路线

AI 文档快看的 PDF 导出使用 **系统打印对话框** 方案：

1. 前端使用 `renderMarkdown()` + `highlightCodeBlocks()` 生成与阅读模式完全一致的 HTML
2. 构建自包含 HTML 文档，嵌入阅读模式 CSS 和打印 CSS
3. 在当前 WebView 中创建临时的打印专用内容区域
4. 使用当前 Markdown 文件名设置打印文档标题，作为系统保存 PDF 时的默认文件名提示
5. 通过 Tauri 当前窗口调用系统原生打印对话框
6. 前端导出状态在打印对话框打开后恢复；用户在系统打印窗口中选择"保存为 PDF"和保存路径完成导出

打印前会将当前 WebView 的 `document.title` 临时设为 Markdown 文件名（去掉 `.md` / `.markdown`），不再沿用“AI 文档快看”。结束打印或取消后恢复应用标题。系统 PDF 驱动可能仍要求手动输入名称，不能据此前端请求声称文件已经保存。

### 为什么不使用 Puppeteer/Playwright

- 不引入 Chromium（体积 >300MB，违反"不引入特别大的依赖"原则）
- 不要求用户安装外部命令行工具
- 系统打印是所有现代操作系统的内置功能

### 为什么使用当前 WebView 的打印区域

- macOS 的 WKWebView 可能忽略隐藏、零尺寸 iframe 发起的打印请求
- 当前方案由主 WebView 的原生打印 API 打开对话框，避免点击后无响应
- 打印时只显示临时阅读内容；回调可用时立即清理，否则使用延迟兜底清理

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

## 当前限制

1. **需要用户在打印对话框中操作** — 不能一键静默保存
2. **依赖系统打印到 PDF 功能** — macOS 有原生支持，Windows 需要 Microsoft Print to PDF（Windows 10+ 内置）
3. **不支持自定义页面大小** — 固定 A4（210mm × 297mm）
4. **页眉/页脚** — 系统打印对话框可能默认添加页眉页脚（文件名、日期、页码），用户需要手动关闭
5. **打印引擎差异** — macOS WebKit 和 Windows WebView2 的打印渲染可能有细微差异
6. **无法可靠等待保存完成** — WebView 的 `afterprint` 事件不稳定，应用只确认系统打印对话框已被请求

## 依赖

- 无外部依赖
- macOS 使用 Tauri 当前 `WebviewWindow` 的原生打印 API
- 其他平台通过当前 WebView 调用 `window.print()`
