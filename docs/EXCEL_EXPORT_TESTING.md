# Excel Export Testing / Excel 导出测试清单

## 重要：Excel 导出边界

Excel 导出**只用于纯表格 Markdown 文件**。如果文档包含段落、列表、代码块等非表格内容，导出将被拒绝并提示用户导出为 Word 或 PDF。

## 测试文件

- `docs/test-excel-table-only.md` — 纯表格文件，**应该可以**导出 Excel
- `docs/test-excel-not-table-only.md` — 含段落和表格的文档，**不应该**导出 Excel
- `docs/test-export-visual-consistency.md` — 含所有元素的测试文档，**不应该**导出 Excel

## 纯表格导出测试

### 使用 test-excel-table-only.md

- [ ] 打开文件，阅读模式正常显示表格
- [ ] 点击工具栏"Excel"按钮或菜单"文件 → 导出 Excel…"
- [ ] 保存对话框打开，默认文件名 `test-excel-table-only.xlsx`
- [ ] 保存成功，toast 提示"已导出到 test-excel-table-only.xlsx"
- [ ] 打开导出的 .xlsx 文件：
  - [ ] **Sheet 名**: "项目预算表"（来自 Front Matter title）
  - [ ] **表头**: 加粗，背景色 `#f0f0ed`
  - [ ] **表头文字**: 颜色 `#111214`
  - [ ] **数据单元格**: 字体 SimSun 16px，颜色 `#222321`
  - [ ] **边框**: `#d8d8d4` 细线，四周可见
  - [ ] **偶数行**: 背景 `#fafaf8`（斑马条纹）
  - [ ] **中文**: 无乱码
  - [ ] **数字**: 数量/单价/小计列为数字类型（右对齐）
  - [ ] **列宽**: 自动适应，不过窄也不过宽
  - [ ] **表头冻结**: 滚动时表头行不动
  - [ ] **自动筛选**: 表头有筛选下拉箭头

### Sheet 名优先级

创建测试文件验证 Sheet 名优先级：
- [ ] Front Matter title → 用作 Sheet 名
- [ ] 无 Front Matter 但有 H1 → H1 文本用作 Sheet 名
- [ ] 无 Front Matter 且无 H1 → 文件名（不含扩展名）用作 Sheet 名
- [ ] 以上均无 → "Sheet1"

### 多表格纯表格文件

创建一个包含多个表格的 .md 文件（表格之间用空行分隔）：
- [ ] 每个表格导出为单独 Sheet
- [ ] Sheet 名合理（第一个用 title/H1/文件名，后续用 heading 或 "SheetN"）
- [ ] 无重复 Sheet 名

## 非纯表格文档测试

### 使用 test-excel-not-table-only.md

- [ ] 打开文件
- [ ] 点击工具栏"Excel"按钮
- [ ] **不弹出保存对话框**
- [ ] Toast 显示提示（中文）: "当前文档不是纯表格 Markdown，建议导出为 Word 或 PDF"
- [ ] 切换英文后显示: "This document is not a table-only Markdown file. Please export it as Word or PDF instead."
- [ ] 不生成 Excel 文件

### 使用 test-export-visual-consistency.md

- [ ] 打开文件
- [ ] 点击工具栏"Excel"按钮
- [ ] 显示"不是纯表格 Markdown"提示
- [ ] 文档中嵌入的表格不被自动抽取

## 样式对齐对比

打开 test-excel-table-only.md 的阅读模式，与 Excel 导出对比：

- [ ] 表头背景色接近阅读模式 `#f0f0ed`
- [ ] 表头文字色接近阅读模式 `#111214`
- [ ] 边框色接近阅读模式 `#d8d8d4`
- [ ] 偶数行背景接近阅读模式 `#fafaf8`
- [ ] 文字大小接近（Excel 用 SimSun，阅读模式用 Avenir Next/Noto Sans SC）

## 边界情况

- [ ] 空文件 → 提示无表格
- [ ] 只有 Front Matter 无表格 → 提示无表格
- [ ] 只有标题无表格 → 提示"不是纯表格 Markdown"
- [ ] Front Matter + 标题 + 空表格 → 正常导出
- [ ] 编辑模式修改后导出 → 使用最新内容
- [ ] 源码模式修改后导出 → 使用最新内容
- [ ] 取消保存对话框 → 不生成文件，不显示错误

## 已知差异

- Excel 中文字体为 SimSun（阅读模式使用 Avenir Next + Noto Sans SC 网页字体）
- Excel 数字单元格自动右对齐（阅读模式统一左对齐）
- Sheet 名最长 31 个字符，非法字符会被清理
