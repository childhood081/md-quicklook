# Front Matter Edge Case Tests

> 本文件用于验证阅读模式、目录大纲、Word/PDF/Excel 导出对 Front Matter 各种边界情况的正确处理。

---

## Case 1: `---` delimited FM with empty values + empty heading

Expected: `title:` and `subtitle:` NOT displayed. Empty `# ` NOT displayed. `**深圳故事**` shown as bold. `---` shown as HR.

```markdown
---
title:
subtitle:
---

#
**深圳故事**

---
```

---

## Case 2: Loose metadata without `---` delimiters

Expected: `title: Loose Metadata Test` and `author: Test Author` NOT displayed as paragraph text. `## 第一节` shown as H2 heading.

```markdown
title: Loose Metadata Test
author: Test Author

## 第一节

这是正文内容，前面的 loose metadata 不应该显示。

### 1.1 小节

更多正文。
```

---

## Case 3: `---` delimited FM with actual values

Expected: `title:` and `subtitle:` NOT displayed in body. `# From FM Title` generated heading shown normally.

```markdown
---
title: A Real Document
subtitle: With a Subtitle
date: 2026-06-14
author: Test Author
tags:
  - testing
  - frontmatter
---

# From FM Title

This document has full Front Matter with all fields populated.

## Section One

Content goes here.
```

---

## Case 4: Empty headings mixed with real headings

Expected: `# ` and `### ` NOT displayed. `## Real H2` and `#### Real H4` shown normally.

```markdown
#
## Real H2

Content after real H2.

###

#### Real H4

More content.

##

## Another Real H2
```

---

## Case 5: Mixed loose metadata with empty headings

Expected: `title: Mixed Test` stripped. `# ` empty heading removed. `**bold**` rendered as bold.

```markdown
title: Mixed Test
date: 2026-01-01

#

**bold text here**

## Real Section

Content after real section heading.
```

---

## Case 6: Front Matter with Chinese values + table + body HR

Expected: Front Matter is hidden. `# 深圳故事` and `## 第一章` appear in outline. The table renders normally. The `---` between body and table remains an HR.

```markdown
---
title: 深圳故事
subtitle: 城市更新与产业记忆
author: AI 文档快看
date: 2026-06-13
tags:
  - markdown
  - test
---

# 深圳故事

这是一段普通正文。

## 第一章

**这是加粗文字**

---

| 项目 | 内容 |
| --- | --- |
| 城市 | 深圳 |
| 类型 | 故事 |
```

---

## Case 7: Loose Chinese metadata with Chinese colons

Expected: All leading metadata lines (English + Chinese keys, `:` and `：`) are hidden. `# 第一集` appears as H1 in reading/outline. `李明：` and `陈雨：` dialogue lines are PRESERVED as body text.

```markdown
title: 《山水有归期》完整剧本
subtitle: 两个湖南人的深圳故事
集数：共20集（完整版）
出品：广东尚佳文创信息科技有限公司 x 虾滑AI工作室
类型：都市情感 / 文旅创业 / 家庭励志
风格：甜宠轻喜剧 + 家庭情感 + 正剧质感
主题曲基调：参考《漠河舞厅》风格——深情、克制、带有岁月感

# 第一集

正文开始。

李明：你终于回来了。
陈雨：我一直都在。
```
