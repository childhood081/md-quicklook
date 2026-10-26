import { defineStore } from 'pinia'
import { onScopeDispose } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'
import { generateXlsxBytes, isTableOnlyMarkdown } from '../utils/exportExcel'
import { generateDocxBytes } from '../utils/exportDocx'
import { exportPdf } from '../utils/exportPdf'
import {
  generateTitleFromFrontMatter, insertFrontMatterTemplate, parseFrontMatter,
  removeFrontMatter, type MarkdownMetadata, upsertFrontMatter,
} from '../utils/markdown'
import { createDocumentWorkspace, documentName, type AppMode } from './documentWorkspace'
import { flushEditorChanges } from '../utils/editorCommands'
import { i18n } from '../i18n'

export type { AppMode, SaveStatus } from './documentWorkspace'

export const useEditorStore = defineStore('editor', () => {
  const workspace = createDocumentWorkspace({
    resolvePath: (path) => invoke<string>('resolve_file_path', { path }),
    read: (path) => invoke<string>('read_file', { path }),
    write: (path, content) => invoke('save_file', { path, content }),
    loadRecent: () => JSON.parse(localStorage.getItem('md-quicklook-recent') ?? '[]'),
    persistRecent: (paths) => localStorage.setItem('md-quicklook-recent', JSON.stringify(paths)),
  })
  onScopeDispose(workspace.dispose)

  function insertFrontMatter(): boolean {
    flushEditorChanges()
    const next = insertFrontMatterTemplate(workspace.currentContent.value)
    if (next === workspace.currentContent.value) return false
    workspace.setContent(next)
    return true
  }

  function getFrontMatter() {
    flushEditorChanges()
    return parseFrontMatter(workspace.currentContent.value)
  }

  function updateFrontMatter(metadata: MarkdownMetadata) {
    flushEditorChanges()
    workspace.setContent(upsertFrontMatter(workspace.currentContent.value, metadata))
  }

  function clearFrontMatter(): boolean {
    flushEditorChanges()
    const next = removeFrontMatter(workspace.currentContent.value)
    if (next === workspace.currentContent.value) return false
    workspace.setContent(next)
    return true
  }

  function generateTitleFromMetadata(): boolean {
    flushEditorChanges()
    const next = generateTitleFromFrontMatter(workspace.currentContent.value)
    if (next === workspace.currentContent.value) return false
    workspace.setContent(next)
    return true
  }

  function exportSnapshot(extension: string) {
    flushEditorChanges()
    const doc = workspace.activeDocument.value
    if (!doc) throw new Error(i18n.global.t('error.needOpenFile'))
    const name = documentName(doc.filePath)
    return {
      content: doc.currentContent,
      name,
      defaultName: `${name.replace(/\.[^.]+$/, '') || 'untitled'}.${extension}`,
    }
  }

  async function exportTablesToExcel(): Promise<string> {
    const snapshot = exportSnapshot('xlsx')
    if (!isTableOnlyMarkdown(snapshot.content)) {
      throw new Error(i18n.global.t('export.notTableOnly'))
    }
    const savePath = await save({
      title: i18n.global.t('dialog.exportExcelTitle'),
      defaultPath: snapshot.defaultName,
      filters: [{ name: i18n.global.t('dialog.excelFilter'), extensions: ['xlsx'] }],
    })
    if (!savePath) throw new Error(i18n.global.t('export.exportCancelled'))
    const bytes = await generateXlsxBytes(snapshot.content, snapshot.name)
    await invoke('export_xlsx', { outputPath: savePath, bytes: Array.from(bytes) })
    return savePath
  }

  async function exportToPdf(): Promise<void> {
    const snapshot = exportSnapshot('pdf')
    await exportPdf(snapshot.content, snapshot.defaultName)
  }

  async function exportToWord(): Promise<string> {
    const snapshot = exportSnapshot('docx')
    const savePath = await save({
      title: i18n.global.t('dialog.exportWordTitle'),
      defaultPath: snapshot.defaultName,
      filters: [{ name: i18n.global.t('dialog.wordFilter'), extensions: ['docx'] }],
    })
    if (!savePath) throw new Error(i18n.global.t('export.exportCancelled'))
    const bytes = await generateDocxBytes(snapshot.content)
    await invoke('export_docx', { outputPath: savePath, bytes: Array.from(bytes) })
    return savePath
  }

  async function saveFileAs(path: string, id: string) {
    flushEditorChanges()
    if (workspace.isPathOpenElsewhere(path, id)) throw new Error(i18n.global.t('error.destinationOpen'))
    await workspace.saveFileAs(path, id)
  }

  return {
    ...workspace, saveFileAs,
    loadFile: (path: string) => { flushEditorChanges(); return workspace.loadFile(path) },
    selectDocument: (id: string) => { flushEditorChanges(); workspace.selectDocument(id) },
    setMode: (mode: AppMode) => { flushEditorChanges(); workspace.setMode(mode) },
    closeFile: (id?: string) => { flushEditorChanges(); return workspace.closeFile(id) },
    manualSave: () => { flushEditorChanges(); return workspace.manualSave() },
    saveFile: () => { flushEditorChanges(); return workspace.saveFile() },
    flushAll: () => { flushEditorChanges(); return workspace.flushAll() },
    insertFrontMatter, getFrontMatter, updateFrontMatter, clearFrontMatter, generateTitleFromMetadata,
    exportTablesToExcel, exportToWord, exportToPdf,
  }
})
