# Front Matter Testing / Front Matter 测试

本文档合并 Front Matter 使用说明、边界规则和手动测试步骤。综合测试文件保留为：

- `docs/test-frontmatter-edge-cases.md`

## 识别规则

AI 文档快看只在 Markdown 文档开头识别 YAML Front Matter：

1. 第一行必须是单独的 `---`。
2. 后续行为简单 `key: value`。
3. 遇到下一行单独的 `---` 结束。
4. 支持字段：`title`、`subtitle`、`author`、`date`、`tags`。
5. 空字段合法，例如 `title:` 不会报错，也不会显示空标题。
6. `tags` 支持简单列表：

```markdown
tags:
  - markdown
  - test
```

正文中的 `---` 仍按 Markdown 水平分割线处理，不会被 Front Matter 过滤误删。

## 渲染与导出规则

- 阅读模式隐藏 Front Matter 原文。
- 目录大纲忽略 Front Matter 和空标题。
- Word / PDF 导出不包含 Front Matter 原文。
- Excel 纯表格判断会先忽略 Front Matter，然后检查剩余正文是否为表格。
- 源码模式保留完整原文，不自动删除 Front Matter。
- 编辑模式不强化复杂 YAML 编辑；复杂 Front Matter 建议在源码模式中维护。

## Front Matter 操作

菜单中提供轻量 Front Matter 操作：

- 插入 Front Matter：当前文档没有 Front Matter 时，在文档开头插入模板。
- 编辑 Front Matter：第一版使用系统输入框编辑 `title`、`subtitle`、`author`、`date`、`tags`。
- 清空 Front Matter：只删除文档开头符合规则的 Front Matter，执行前会确认。
- 从 Front Matter 生成标题：当 `title` 有值且正文开头没有有效 H1 时，在 Front Matter 后插入 `# title`。

模板：

```markdown
---
title:
subtitle:
author:
date:
tags:
---
```

## 手动测试

1. 打开 `docs/test-frontmatter-edge-cases.md`。
2. 将每个 case 中的 Markdown 复制到新文档或源码模式。
3. 切换阅读模式，确认 Front Matter 不显示、空标题不显示、正文水平分割线正常显示。
4. 打开目录面板，确认只显示有效标题。
5. 导出 Word / PDF，确认 Front Matter 不进入导出内容。
6. 对纯表格 case 执行 Excel 导出，确认 Front Matter 不影响表格识别。
7. 切回源码模式，确认原始 Markdown 内容仍保留。

## 覆盖用例

- 空 `title` / `subtitle`
- 标准 `---` Front Matter
- loose metadata（开头无 `---` 的 `title:` / `author:`）
- 空标题：`#`、`# `、`##`、`### `
- Front Matter 有实际值
- 正文水平分割线
- Front Matter 后正文表格

## 当前限制

- 这不是完整 YAML 编辑器，不支持嵌套对象、多行字符串、复杂数组或锚点。
- Front Matter 编辑弹窗不提供复杂表单校验。
- 编辑模式会重新序列化 Markdown，复杂 Front Matter 建议在源码模式中维护。
