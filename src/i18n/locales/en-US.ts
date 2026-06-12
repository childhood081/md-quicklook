export default {
  // ── App / Global ──
  app: {
    name: 'md-quicklook',
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
    eyebrow: 'Markdown Workspace',
    tagline: 'Lightweight Markdown file viewer and editor with reading, source editing, autosave, and exports.',
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
    markdownFilter: 'Markdown',
    wordFilter: 'Word Document',
    excelFilter: 'Excel Workbook',
    allFiles: 'All Files',
  },

  // ── Export ──
  export: {
    exportWord: 'Export Word',
    exportExcel: 'Export Excel',
    exportSuccess: 'Export succeeded',
    exportFailed: 'Export failed',
    exportCancelled: 'Export cancelled',
    noTables: 'No exportable tables found in the current document',
    chooseExportPath: 'Choose export path',
    exportedTo: 'Exported to',
    savedAs: 'Saved as',
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
    guideText: 'Use the menu or toolbar to open, edit, and export Markdown files.',
    testingText: 'Testing: Verify open/save/export/mode-switch/language-switch.',
  },

  // ── Source editor ──
  source: {
    placeholder: 'Type Markdown here...',
  },
}
