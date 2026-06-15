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
