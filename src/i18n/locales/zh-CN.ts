export default {
  // ── App / Global ──
  app: {
    name: 'md-quicklook',
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
    eyebrow: 'Markdown 工作区',
    tagline: '轻量级 Markdown 文件查看与编辑器，支持阅读、源码编辑、自动保存与导出。',
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
    markdownFilter: 'Markdown',
    wordFilter: 'Word 文档',
    excelFilter: 'Excel 工作簿',
    allFiles: '所有文件',
  },

  // ── Export ──
  export: {
    exportWord: '导出 Word',
    exportExcel: '导出 Excel',
    exportSuccess: '导出成功',
    exportFailed: '导出失败',
    exportCancelled: '已取消导出',
    noTables: '当前 Markdown 文档中没有可导出的表格',
    chooseExportPath: '选择导出路径',
    exportedTo: '已导出到',
    savedAs: '已另存为',
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
    guideText: '通过菜单或工具栏来打开、编辑和导出 Markdown 文件。',
    testingText: '测试项：验证打开/保存/导出/模式切换/语言切换功能。',
  },

  // ── Source editor ──
  source: {
    placeholder: '在此输入 Markdown...',
  },
}
