# DOCX 导出测试 H1

这是一个中文段落，用于验证 Word 导出时中文内容不会乱码，并且中文标点、全角字符、数字 123 都能正常显示。

This is an English paragraph for validating mixed Markdown to Word export. It includes plain text, punctuation, and a short phrase: Markdown Quicklook.

这里包含 **加粗文本**、*斜体文本*，以及 [OpenAI](https://openai.com/) 链接。相对链接 [本地说明](./DOCX_EXPORT_TESTING.md) 应当至少保留为普通文本。

## 二级标题 H2

- 无序列表第一项
- 无序列表第二项，包含 **加粗**
- 无序列表第三项，包含 *斜体*

### Ordered List H3

1. First ordered item
2. Second ordered item with 中文
3. Third ordered item with `inline code`

#### 四级标题 H4

> 这是一段引用内容，用于验证 blockquote 是否能被识别。
> 第二行引用应当仍然出现在 Word 文档中。

```ts
const message = 'Hello, Word 导出';
function greet(name: string) {
  return `${message}: ${name}`;
}
```

| Name | Type | Status |
| --- | --- | --- |
| Title | H1-H4 | Supported |
| Table | Markdown table | Supported |
| Link | Hyperlink or plain text | Degraded |

| 模块 | 中文说明 | 中英文混排 | 数值 | 备注 |
| --- | --- | --- | ---: | --- |
| 阅读模式 | 验证导出不影响阅读 | Reader + Markdown | 100 | 正常 |
| 源码模式 | 验证当前内存内容导出 | Source Editor 源码 | 200 | 包含 **加粗** |
| 表格导出 | 验证多个表格都存在 | Excel / Word | 300 | 中文复杂表格 |

---

水平分割线后的段落，用于确认后续内容不会丢失。
