# DOCX Font Testing

本文档用于手动检查 md-quicklook 导出 Word 时的中文字体设置。

## 测试步骤

1. 用 md-quicklook 打开 `docs/test-docx-font.md`。
2. 在源码模式修改一处正文内容。
3. 切换到编辑模式，再修改一处正文或列表内容。
4. 点击工具栏或菜单中的 `导出 Word`。
5. 用 Word / WPS 打开生成的 `docs/test-docx-font.docx`。
6. 点击正文中文，检查字体是否为宋体 / SimSun。
7. 点击标题，检查字体是否为微软雅黑 / Microsoft YaHei。
8. 点击表格中文，检查字体是否为宋体 / SimSun。
9. 点击代码块，检查字体是否为 Consolas。
10. 检查正文、标题、表格、列表、引用中是否还出现等线。

## 预期字体

| 内容 | 西文字体 | 中文字体 |
| --- | --- | --- |
| 正文、列表、引用、表格 | Times New Roman | SimSun |
| H1-H4 标题 | Arial | Microsoft YaHei |
| 行内代码、代码块 | Consolas | Consolas |

## XML 抽查方式

`.docx` 本质是 ZIP 文件，可以解压后检查 `word/document.xml`：

```bash
unzip -q docs/test-docx-font.docx -d /tmp/md-quicklook-docx-font
grep -o 'w:eastAsia="[^"]*"' /tmp/md-quicklook-docx-font/word/document.xml | sort | uniq -c
grep -o 'w:ascii="[^"]*"' /tmp/md-quicklook-docx-font/word/document.xml | sort | uniq -c
```

预期至少能看到：

```text
w:eastAsia="SimSun"
w:eastAsia="Microsoft YaHei"
w:eastAsia="Consolas"
```

## 回归检查

- 从编辑模式修改后导出 Word，字体仍应正确。
- 从源码模式修改后导出 Word，字体仍应正确。
- 未保存但内存中已修改的内容导出 Word，字体仍应正确。
- Excel 导出不受 Word 字体设置影响。
- 切换 zh-CN / en-US 后再导出 Word，文档内容和字体设置不应变化。
- 导出路径选择只影响输出位置，不应影响 DOCX 结构或字体设置。
