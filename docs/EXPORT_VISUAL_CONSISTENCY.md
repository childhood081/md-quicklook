# Export Visual Consistency / 导出视觉一致性

## 概述

AI 文档快看的导出功能（Word、Excel、PDF）遵循统一的视觉标准：**当前阅读模式**。

阅读模式 (`src/styles/reader.css` + `src/style.css`) 是所有导出格式的唯一视觉来源。所有颜色、字体、字号、间距提取自 `src/utils/documentExportTheme.ts`。

## 设计原则

1. **阅读模式是唯一视觉标准** — 所有导出格式从同一个主题文件读取样式参数
2. **Word 是文档格式** — 接受打印/排版上的合理差异，目标是"交付效果接近阅读模式"
3. **PDF 复用阅读模式 HTML/CSS** — 最接近阅读模式，通过系统打印生成
4. **Excel 只用于纯表格 Markdown** — 不从普通文档中抽取表格

## 导出路径规则

- Word 和 Excel 使用系统保存对话框选择输出路径。
- 默认文件名来自当前 Markdown 文件名。
- 用户取消保存对话框时，不生成文件，也不显示错误。
- Excel 会先判断当前文档是否为纯表格 Markdown；非纯表格文档不会弹出保存对话框。
- PDF 使用系统打印对话框，应用不能直接指定保存路径；用户需要在系统打印窗口中选择"保存为 PDF"。

## Word 导出对齐方式

Word 导出读取 `documentExportTheme.ts` 中的所有样式参数：

- **标题 H1-H4**: 显式设置字号（半磅单位）、颜色、加粗，同时保留 Word 内置标题样式（用于导航窗格）
- **正文**: Times New Roman（英文）+ SimSun 宋体（中文 eastAsia），颜色 `#222321`
- **代码块**: 深色背景 `#2f3b42` + 浅色文字 `#e1e4e8`，Consolas 14px
- **表格**: 表头背景 `#f0f0ed`，边框色 `#d8d8d4`，偶数行背景 `#fafaf8`，单元格显式边框
- **引用块**: 左边框 `#353183`（indigo），背景 `#f4f3f0`，文字色 `#2f3b42`
- **内联代码**: 背景 `#f1f1ef`，文字色 `#b9242a`（danger red）
- **Front Matter**: 不导出
- **空标题**: 不导出

### Word 无法完全一致的地方

- 网页 CSS 中的 `text-transform: uppercase` 在 Word 中无法程序化设置
- 阅读模式使用 CSS grid 背景图案，Word 无法复刻
- 代码块语法高亮无法在 Word 中实现（Word 不支持 Shiki 级别的 token 着色）
- 行距的精确像素值在 Word 中有轻微偏差

## Excel 导出边界

Excel 导出**只**用于"纯表格 Markdown 文件"：

- 文档开头可以有 YAML Front Matter
- Front Matter 后可以有可选 H1 标题
- 正文主体必须是 Markdown 表格（一个或多个）
- 如果文档包含段落、列表、代码块等非表格内容，点击导出 Excel 时会显示提示，建议导出为 Word 或 PDF

### 判断逻辑

参见 `src/utils/exportExcel.ts` 中的 `isTableOnlyMarkdown()` 函数：

1. 剥离 Front Matter
2. 忽略空行
3. 忽略可选单一 H1 标题
4. 验证所有剩余非空行均为 Markdown 表格
5. 至少找到一个表格

### 样式对齐

- 表头: 加粗、背景 `#f0f0ed`、文字色 `#111214`
- 数据单元格: SimSun 16px、边框色 `#d8d8d4`
- 偶数行: 背景 `#fafaf8`
- 数字列: 保持数字类型
- Sheet 名优先级: Front Matter title → H1 → 文件名 → "Sheet1"

## PDF 导出

PDF 通过系统打印对话框生成：

1. 前端渲染 Markdown 为 HTML（含 Shiki 代码高亮）
2. 构建自包含 HTML 文档（嵌入阅读模式 CSS + 打印 CSS）
3. 在隐藏 iframe 中加载，等待文档完成后由 iframe `onload` 触发一次 `window.print()`
4. 前端导出状态在打印对话框打开后恢复，用户在系统打印窗口中选择"保存为 PDF"

### 接近程度

PDF 是最接近阅读模式的导出方式，因为：
- 使用真实的 HTML/CSS 渲染（与阅读模式相同的 CSS）
- Shiki 代码高亮完整保留
- 通过 `print-color-adjust: exact` 保留背景色
- A4 纸张 + 合理边距

### 差异

- @page 边距由打印设置决定（无法完全控制）
- 代码块强制换行以避免截断（阅读模式使用滚动条）
- URL 在打印时会追加显示（`a[href]::after`）
- 浏览器打印引擎可能在细微处与屏幕渲染有差异

## 相关文件

| 文件 | 用途 |
|------|------|
| `src/utils/documentExportTheme.ts` | 主题配置（所有视觉参数） |
| `src/utils/exportDocx.ts` | Word 导出（读取主题） |
| `src/utils/exportExcel.ts` | Excel 导出（读取主题） |
| `src/utils/exportPdf.ts` | PDF 导出（读取主题 + 内联 reader/print CSS） |
| `src/styles/reader.css` | 阅读模式样式（视觉标准） |
| `src/styles/print.css` | 打印样式（PDF 规则来源；当前导出实现以内联方式镜像这些规则） |
