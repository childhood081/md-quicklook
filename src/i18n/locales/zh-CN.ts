export default {
  // ── App / Global ──
  app: {
    name: 'AI 文档快看',
  },

  // ── Modes ──
  mode: {
    reading: '阅读',
    editing: '编辑',
    source: '源码',
    readingMode: '阅读模式',
    editingMode: '编辑模式',
    sourceMode: '源码模式',
  },

  // ── Toolbar ──
  toolbar: {
    read: '阅读',
    edit: '编辑',
    source: '源码',
    save: '保存',
    pdf: 'PDF',
    excel: 'Excel',
    word: 'Word',
    exporting: '导出中',
  },

  // ── Save status ──
  save: {
    idle: '',
    waiting: '即将保存...',
    saving: '保存中...',
    saved: '已保存',
    error: '保存失败',
    fileSaved: '文件已保存',
  },

  // ── Welcome page ──
  welcome: {
    eyebrow: 'AI 文档查看',
    tagline: 'AI 产出的 Markdown 文档查看与导出工具。支持阅读、轻量编辑、源码模式，可导出 Word 与 Excel。',
    dragDrop: '拖拽 .md 文件到这里',
    dragDropActive: '松开以打开',
    supportNote: '支持 .md 和 .markdown 文件。',
    chooseFile: '选择文件',
    recentFiles: '最近文件',
    noRecentFiles: '暂无最近文件',
    tokens: '色板',
    typography: '字体',
    body: '正文',
    caption: '说明',
    controls: '控件',
    primary: '主要',
    secondary: '次要',
  },

  // ── Outline ──
  outline: {
    outline: '目录',
    headings: '文档标题',
    noHeadings: '暂无标题',
    showOutline: '显示目录',
    hideOutline: '隐藏目录',
  },

  // ── File dialogs ──
  dialog: {
    openTitle: '打开 Markdown 文件',
    saveAsTitle: '保存 Markdown 文件',
    exportWordTitle: '导出 Word',
    exportExcelTitle: '导出 Excel',
    exportPdfTitle: '导出 PDF',
    markdownFilter: 'Markdown',
    wordFilter: 'Word 文档',
    excelFilter: 'Excel 工作簿',
    allFiles: '所有文件',
  },

  // ── Export ──
  export: {
    exportWord: '导出 Word',
    exportExcel: '导出 Excel',
    exportPdf: '导出 PDF',
    exportSuccess: '导出成功',
    exportFailed: '导出失败',
    exportCancelled: '已取消导出',
    noTables: '当前 Markdown 文档中没有可导出的表格',
    notTableOnly: '当前文档不是纯表格 Markdown，建议导出为 Word 或 PDF',
    chooseExportPath: '选择导出路径',
    exportedTo: '已导出到',
    savedAs: '已另存为',
    preparingPdf: '正在准备 PDF',
    pdfInstruction: '请在系统打印窗口中选择"保存为 PDF"',
    pdfFailed: 'PDF 导出失败',
    pdfUnsupported: '当前环境暂不支持直接导出 PDF',
  },

  // ── Rich editor toolbar ──
  editor: {
    paragraph: '段落',
    heading1: '标题 1',
    heading2: '标题 2',
    heading3: '标题 3',
    heading4: '标题 4',
    bold: '粗体',
    italic: '斜体',
    inlineCode: '行内代码',
    bulletList: '无序列表',
    orderedList: '有序列表',
    blockquote: '引用',
    codeBlock: '代码块',
    link: '链接',
    table: '表格',
    boldTitle: '粗体 (Cmd+B)',
    italicTitle: '斜体 (Cmd+I)',
    inlineCodeTitle: '行内代码',
    bulletListTitle: '无序列表',
    orderedListTitle: '有序列表',
    blockquoteTitle: '引用',
    codeBlockTitle: '代码块',
    linkTitle: '插入链接',
    tableTitle: '插入 3x3 表格',
  },

  // ── Edit menu actions ──
  edit: {
    find: '查找',
    undo: '撤销',
    redo: '重做',
    unsupportedMode: '当前模式不支持此操作',
    findUnsupported: '当前模式暂不支持查找',
    findPrompt: '查找',
    findNoMatch: '未找到匹配内容',
  },

  // ── View menu actions ──
  view: {
    zoomIn: '放大',
    zoomOut: '缩小',
    actualSize: '实际大小',
    fullScreen: '全屏',
  },

  // ── Front Matter operations ──
  frontMatter: {
    insert: '插入 Front Matter',
    edit: '编辑 Front Matter',
    clear: '清空 Front Matter',
    generateTitle: '从 Front Matter 生成标题',
    inserted: '已插入 Front Matter',
    updated: '已更新 Front Matter',
    cleared: '已清空 Front Matter',
    notFound: '未找到 Front Matter',
    alreadyExists: '当前文档已有 Front Matter',
    confirmClear: '确定清空文档开头的 Front Matter？',
    titleGenerated: '已从 Front Matter 生成标题',
    cannotGenerateTitle: '无法生成标题：未找到 Front Matter 标题，或正文已有有效 H1',
    promptTitle: 'Front Matter title',
    promptSubtitle: 'Front Matter subtitle',
    promptAuthor: 'Front Matter author',
    promptDate: 'Front Matter date',
    promptTags: 'Front Matter tags（用逗号分隔）',
  },

  // ── Errors / warnings ──
  error: {
    openFileFailed: '打开文件失败',
    saveFileFailed: '保存文件失败',
    unsupportedFileType: '不支持的文件类型',
    fileNotFound: '文件不存在',
    permissionDenied: '没有权限',
    unknownError: '未知错误',
    unsavedChanges: '当前文件有未保存的更改，无法保存',
    needOpenFile: '请先打开 Markdown 文件',
    onlyMarkdown: '仅支持 .md 和 .markdown 文件',
    backupSkipped: '备份创建已跳过',
    readFailed: '读取文件失败',
    manualSaveFailed: '手动保存失败',
    autoSaveFailed: '自动保存失败',
  },

  // ── Help ──
  help: {
    guide: '使用说明',
    testing: '测试清单',
    about: '关于',
    version: '版本',
    guideText: '通过菜单或工具栏打开 AI 生成的 Markdown 文档，查看、编辑和导出为 Word / Excel。',
    testingText: '测试项：验证打开/保存/导出/模式切换/语言切换功能。',
  },

  // ── Source editor ──
  source: {
    placeholder: '在此输入 Markdown...',
  },
}
