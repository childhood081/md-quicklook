# i18n Testing Checklist

全应用中英双语测试清单 — 验证原生菜单 + 前端 UI 语言切换一致性。

## 测试准备

1. 构建应用：`npm run build && cargo check`
2. 启动应用：`npx tauri dev`
3. 打开一个 Markdown 测试文件

## 测试用例

### 1. 初始语言加载

**操作**：
1. 首次启动应用（无 settings.json 或已删除）
2. 观察界面语言

**预期**：
- 默认显示中文（zh-CN）
- 原生菜单为中文
- 所有前端 UI 为中文

### 2. 语言持久化

**操作**：
1. 切换到英文（English）
2. 关闭应用
3. 重新启动应用

**预期**：
- 重新启动后保持英文
- 原生菜单为英文
- 所有前端 UI 为英文

### 3. 原生菜单 ↔ 前端 UI 同步

**操作**：
1. 通过原生菜单切换语言（English → 中文）
2. 观察前端 UI

**预期**：
- 原生菜单立即切换为中文
- 工具栏按钮文案切换为中文（阅读/编辑/源码）
- 保存状态文案切换为中文
- 所有按钮和标签切换为中文

### 4. 工具栏文案

**操作**：在英文和中文模式下分别检查工具栏

| 元素 | 英文 | 中文 |
|------|------|------|
| 模式切换 | Read / Edit / Source | 阅读 / 编辑 / 源码 |
| Excel 按钮 | Excel | Excel |
| Word 按钮 | Word | Word |
| Save 按钮 | Save | 保存 |
| 保存状态 | Saved / Saving... / Save failed | 已保存 / 保存中... / 保存失败 |

### 5. 欢迎页文案

**操作**：无文件打开时，切换语言观察欢迎页

| 元素 | 英文 | 中文 |
|------|------|------|
| 眉题 | Markdown Workspace | Markdown 工作区 |
| 描述 | Lightweight Markdown file viewer... | 轻量级 Markdown 文件查看与编辑器... |
| 拖拽区 | Drag and drop .md here | 拖拽 .md 文件到这里 |
| 拖拽激活 | Drop to open | 松开以打开 |
| 支持说明 | Supports .md and .markdown documents. | 支持 .md 和 .markdown 文件。 |
| 选择按钮 | Choose File | 选择文件 |
| 最近文件 | Recent Files | 最近文件 |
| 色板 | Tokens | 色板 |
| 字体 | Typography | 字体 |
| 控件 | Controls | 控件 |

### 6. 目录面板

**操作**：在阅读模式下切换语言，观察目录面板

| 元素 | 英文 | 中文 |
|------|------|------|
| 标题 | Outline | 目录 |
| 副标题 | Document headings | 文档标题 |
| 空状态 | No headings | 暂无标题 |

### 7. 富文本编辑器工具栏

**操作**：切换到编辑模式，切换语言观察工具栏

| 元素 | 英文 | 中文 |
|------|------|------|
| 段落 | Paragraph | 段落 |
| 标题 1-4 | Heading 1-4 | 标题 1-4 |
| 粗体 | B | 粗体 |
| 斜体 | I | 斜体 |
| 行内代码 | </> | 行内代码 |
| 无序列表 | • List | 无序列表 |
| 有序列表 | 1. List | 有序列表 |
| 引用 | "Quote | 引用 |
| 代码块 | Code | 代码块 |
| 链接 | Link | 链接 |
| 表格 | Table | 表格 |
| 工具提示 | Bold (Cmd+B) 等 | 粗体 (Cmd+B) 等 |

### 8. 文件对话框

**操作**：通过菜单或工具栏触发文件对话框

| 场景 | 英文 | 中文 |
|------|------|------|
| 打开文件标题 | Open Markdown File | 打开 Markdown 文件 |
| 保存文件标题 | Save Markdown File | 保存 Markdown 文件 |
| 导出 Word 标题 | Export Word | 导出 Word |
| 导出 Excel 标题 | Export Excel | 导出 Excel |
| 文件过滤器 | Markdown / All Files | Markdown / 所有文件 |

### 9. 错误提示

**操作**：触发各种错误场景并切换语言

| 场景 | 英文 | 中文 |
|------|------|------|
| 打开非 Markdown 文件 | Only .md and .markdown files are supported | 仅支持 .md 和 .markdown 文件 |
| 未打开文件时导出 | Please open a Markdown file first | 请先打开 Markdown 文件 |
| 无表格时导出 Excel | No exportable tables found... | 当前 Markdown 文档中没有可导出的表格 |

### 10. Toast 提示

**操作**：触发成功提示并切换语言

| 场景 | 英文 | 中文 |
|------|------|------|
| 保存成功 | File saved | 文件已保存 |
| 导出成功 | Exported to xxx | 已导出到 xxx |
| 另存为成功 | Saved as xxx | 已另存为 xxx |
| 帮助-使用说明 | Guide: Use the menu... | 通过菜单或工具栏来打开... |
| 帮助-测试清单 | Testing: Verify open/save... | 测试项：验证打开/保存... |

### 11. 导出取消

**操作**：
1. 触发 Word 或 Excel 导出
2. 在保存对话框中点击取消

**预期**：
- 不显示任何错误提示
- 编辑器状态不受影响
- 英文/中文模式下均正常

### 12. 语言切换不丢失状态

**操作**：
1. 打开一个 Markdown 文件
2. 切换到编辑模式，修改内容
3. 切换语言

**预期**：
- 文件内容不变
- 编辑模式保持不变
- 修改状态（未保存）保持不变

### 13. 回归检查

- Word 导出功能正常
- Excel 导出功能正常
- 源码模式正常
- 阅读模式正常
- 自动保存功能正常
- `npm run build` 通过
- `cargo check` 通过

### 14. V1.8.1 硬编码文案检查

**操作**：

1. 在 zh-CN 模式打开应用。
2. 检查工具栏不再显示 `Read / Edit / Source / Save`。
3. 检查欢迎页、目录面板、源码模式 placeholder、编辑模式工具栏。
4. 切换到 English，再重复检查。

**预期**：

- zh-CN 下显示：阅读 / 编辑 / 源码 / 保存 / 导出中 / 暂无标题。
- en-US 下显示：Read / Edit / Source / Save / Exporting / No headings。
- 文件对话框标题尽量跟随应用语言；系统按钮可能跟随操作系统语言。

### 15. 语言切换状态保持

**操作**：

1. 打开一个 Markdown 文件。
2. 在编辑模式修改正文但不要手动保存。
3. 通过原生菜单切换语言。
4. 再切换阅读 / 源码 / 编辑模式。

**预期**：

- 当前文件路径不变。
- 当前编辑内容不丢失。
- 当前模式不因语言切换被重置。
- 不应因为语言切换触发额外保存。
