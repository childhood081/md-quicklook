# md-quicklook 测试文档

## 项目简介

这是一个 **AI 时代的轻量 Markdown 文件打开器**。用户双击 `.md` 文件，即可获得 Word 风格的阅读体验。

### V1.1 稳定性目标

第一版 Word 导出优先保证 *结构正确*，再逐步增加复杂样式。

#### 导出边界

链接示例：[Tauri 官网](https://tauri.app/) 会在 Word 中尽量保留为可点击链接。

## 核心功能

- 🚀 **阅读模式** — Word 风格排版，目录大纲自动生成
- ✏️ **源码模式** — 使用 CodeMirror 6 编辑器
- 💾 **自动保存** — 编辑后自动回写原文件

## 技术栈表格

| 层 | 技术 | 说明 |
|---|---|---|
| 桌面框架 | Tauri 2 | Rust 后端，轻量高效 |
| 前端框架 | Vue 3 + TypeScript | 响应式数据流 |
| Markdown 渲染 | markdown-it + Shiki | 服务端级别代码高亮 |
| 源码编辑器 | CodeMirror 6 | 模块化设计 |

---

## 代码示例

```typescript
// Pinia store - 文件状态管理
export const useEditorStore = defineStore('editor', () => {
  const filePath = ref('')
  const mode = ref<'reading' | 'source'>('reading')
  return { filePath, mode }
})
```

```python
def greet(name: str) -> str:
    """Say hello to the user."""
    return f"Hello, {name}! Welcome to md-quicklook."
```

## 下一步计划

1. 集成 Milkdown 富文本编辑器（编辑模式）
2. 支持导出 Word / Excel
3. 多标签页支持
4. 深色主题

> "好的工具应该让人感觉不到工具的存在。" — 设计哲学
