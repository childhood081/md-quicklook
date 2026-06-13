# Front Matter Operations

本文档说明 md-quicklook 第一版 YAML Front Matter 操作能力。

## 识别规则

Front Matter 只在文档开头识别：

1. 第一行必须是单独的 `---`。
2. 后续行为简单 `key: value`。
3. 遇到下一行单独的 `---` 结束。
4. 支持字段：`title`、`subtitle`、`author`、`date`、`tags`。
5. 空字段合法，不会报错。
6. `tags` 支持列表形式：

```markdown
tags:
  - markdown
  - test
```

正文中的 `---` 仍按 Markdown 水平分割线处理，不会被 Front Matter 操作误删。

## 插入 Front Matter

菜单：`编辑 -> 插入 Front Matter`

如果当前文档没有 Front Matter，会在文档开头插入模板：

```markdown
---
title:
subtitle:
author:
date:
tags:
---
```

如果已经存在 Front Matter，不会重复插入。

## 编辑 Front Matter

菜单：`编辑 -> 编辑 Front Matter`

第一版使用轻量系统输入框，依次编辑：

- `title`
- `subtitle`
- `author`
- `date`
- `tags`

`tags` 使用逗号分隔，例如：

```text
markdown, test, draft
```

保存后会回写到 Markdown 开头，并通过现有 `setContent()` 标记为已修改，继续复用自动保存逻辑。

## 清空 Front Matter

菜单：`编辑 -> 清空 Front Matter`

清空前会弹出确认。确认后只删除文档开头符合识别规则的 Front Matter，不会删除正文中的水平分割线。

## 从 Front Matter 生成标题

菜单：`编辑 -> 从 Front Matter 生成标题`

满足以下条件时，会在 Front Matter 后插入一级标题：

1. Front Matter 存在；
2. `title` 有值；
3. 正文开头没有有效 H1。

示例：

```markdown
---
title: 深圳故事
---

# 深圳故事
```

如果正文已经以有效 H1 开头，不会重复插入标题。

## 当前限制

- 这不是完整 YAML 编辑器，只支持当前列出的简单字段。
- 不支持嵌套对象、复杂数组、quoted multiline string。
- 编辑模式会把 Markdown 重新序列化，复杂 Front Matter 建议在源码模式中维护。
- 第一版编辑弹窗使用系统输入框，不提供复杂表单校验。
