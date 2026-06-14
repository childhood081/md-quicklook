export default {
  // ── App / Global ──
  app: {
    name: 'AI Doc QuickLook',
  },

  // ── Modes ──
  mode: {
    reading: 'Read',
    editing: 'Edit',
    source: 'Source',
    readingMode: 'Reading Mode',
    editingMode: 'Editing Mode',
    sourceMode: 'Source Mode',
  },

  // ── Toolbar ──
  toolbar: {
    read: 'Read',
    edit: 'Edit',
    source: 'Source',
    save: 'Save',
    pdf: 'PDF',
    excel: 'Excel',
    word: 'Word',
    exporting: 'Exporting',
  },

  // ── Save status ──
  save: {
    idle: '',
    waiting: 'Saving soon...',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Save failed',
    fileSaved: 'File saved',
  },

  // ── Welcome page ──
  welcome: {
    eyebrow: 'AI Document Viewer',
    tagline: 'View and export AI-generated Markdown documents. Read, light-edit, view source, and export to Word & Excel — all locally, fully offline.',
    dragDrop: 'Drag and drop .md here',
    dragDropActive: 'Drop to open',
    supportNote: 'Supports .md and .markdown documents.',
    chooseFile: 'Choose File',
    recentFiles: 'Recent Files',
    noRecentFiles: 'No recent files',
    tokens: 'Tokens',
    typography: 'Typography',
    body: 'Body',
    caption: 'Caption',
    controls: 'Controls',
    primary: 'Primary',
    secondary: 'Secondary',
  },

  // ── Outline ──
  outline: {
    outline: 'Outline',
    headings: 'Document headings',
    noHeadings: 'No headings',
    showOutline: 'Show Outline',
    hideOutline: 'Hide Outline',
  },

  // ── File dialogs ──
  dialog: {
    openTitle: 'Open Markdown File',
    saveAsTitle: 'Save Markdown File',
    exportWordTitle: 'Export Word',
    exportExcelTitle: 'Export Excel',
    exportPdfTitle: 'Export PDF',
    markdownFilter: 'Markdown',
    wordFilter: 'Word Document',
    excelFilter: 'Excel Workbook',
    allFiles: 'All Files',
  },

  // ── Export ──
  export: {
    exportWord: 'Export Word',
    exportExcel: 'Export Excel',
    exportPdf: 'Export PDF',
    exportSuccess: 'Export succeeded',
    exportFailed: 'Export failed',
    exportCancelled: 'Export cancelled',
    noTables: 'No exportable tables found in the current document',
    notTableOnly: 'This document is not a table-only Markdown file. Please export it as Word or PDF instead.',
    chooseExportPath: 'Choose export path',
    exportedTo: 'Exported to',
    savedAs: 'Saved as',
    preparingPdf: 'Preparing PDF',
    pdfInstruction: 'Please choose "Save as PDF" in the system print dialog',
    pdfFailed: 'PDF export failed',
    pdfUnsupported: 'Direct PDF export is not supported in the current environment',
  },

  // ── Rich editor toolbar ──
  editor: {
    paragraph: 'Paragraph',
    heading1: 'Heading 1',
    heading2: 'Heading 2',
    heading3: 'Heading 3',
    heading4: 'Heading 4',
    bold: 'B',
    italic: 'I',
    inlineCode: '</>',
    bulletList: '• List',
    orderedList: '1. List',
    blockquote: '" Quote',
    codeBlock: 'Code',
    link: 'Link',
    table: 'Table',
    boldTitle: 'Bold (Cmd+B)',
    italicTitle: 'Italic (Cmd+I)',
    inlineCodeTitle: 'Inline Code',
    bulletListTitle: 'Bullet List',
    orderedListTitle: 'Ordered List',
    blockquoteTitle: 'Blockquote',
    codeBlockTitle: 'Code Block',
    linkTitle: 'Insert Link',
    tableTitle: 'Insert 3x3 Table',
  },

  // ── Edit menu actions ──
  edit: {
    find: 'Find',
    undo: 'Undo',
    redo: 'Redo',
    unsupportedMode: 'This action is not supported in the current mode',
    findUnsupported: 'Find is not supported in the current mode',
    findPrompt: 'Find',
    findNoMatch: 'No matches found',
  },

  // ── View menu actions ──
  view: {
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    actualSize: 'Actual Size',
    fullScreen: 'Full Screen',
  },

  // ── Front Matter operations ──
  frontMatter: {
    insert: 'Insert Front Matter',
    edit: 'Edit Front Matter',
    clear: 'Clear Front Matter',
    generateTitle: 'Generate Title from Front Matter',
    inserted: 'Front Matter inserted',
    updated: 'Front Matter updated',
    cleared: 'Front Matter cleared',
    notFound: 'Front Matter not found',
    alreadyExists: 'The current document already has Front Matter',
    confirmClear: 'Clear the Front Matter at the start of this document?',
    titleGenerated: 'Title generated from Front Matter',
    cannotGenerateTitle: 'Cannot generate title: no Front Matter title was found, or the body already has a valid H1',
    promptTitle: 'Front Matter title',
    promptSubtitle: 'Front Matter subtitle',
    promptAuthor: 'Front Matter author',
    promptDate: 'Front Matter date',
    promptTags: 'Front Matter tags (comma-separated)',
  },

  // ── Errors / warnings ──
  error: {
    openFileFailed: 'Failed to open file',
    saveFileFailed: 'Failed to save file',
    unsupportedFileType: 'Unsupported file type',
    fileNotFound: 'File not found',
    permissionDenied: 'Permission denied',
    unknownError: 'Unknown error',
    unsavedChanges: 'Current file has unsaved changes and could not be saved',
    needOpenFile: 'Please open a Markdown file first',
    onlyMarkdown: 'Only .md and .markdown files are supported',
    backupSkipped: 'Backup creation skipped',
    readFailed: 'Failed to read file',
    manualSaveFailed: 'Manual save failed',
    autoSaveFailed: 'Auto-save failed',
  },

  // ── Help ──
  help: {
    guide: 'User Guide',
    testing: 'Testing Checklist',
    about: 'About',
    version: 'Version',
    guideText: 'Open AI-generated Markdown documents via menu or toolbar to view, edit, and export to Word / Excel.',
    testingText: 'Testing: Verify open/save/export/mode-switch/language-switch.',
  },

  // ── Source editor ──
  source: {
    placeholder: 'Type Markdown here...',
  },
}
