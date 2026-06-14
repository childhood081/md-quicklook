import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'
import { generateXlsxBytes } from '../utils/exportExcel'
import { generateDocxBytes } from '../utils/exportDocx'
import { exportPdf } from '../utils/exportPdf'
import {
  generateTitleFromFrontMatter,
  insertFrontMatterTemplate,
  parseFrontMatter,
  removeFrontMatter,
  type MarkdownMetadata,
  upsertFrontMatter,
} from '../utils/markdown'
import { i18n } from '../i18n'

export type AppMode = 'reading' | 'editing' | 'source'
export type SaveStatus = 'idle' | 'waiting' | 'saving' | 'saved' | 'error'

export const useEditorStore = defineStore('editor', () => {
  // ── State ──
  const filePath = ref('')
  const fileName = computed(() => {
    const parts = filePath.value.replace(/\\/g, '/').split('/')
    return parts[parts.length - 1] || 'Untitled.md'
  })

  const originalContent = ref('')
  const currentContent = ref('')
  const mode = ref<AppMode>('reading')
  const zoomLevel = ref(1)
  const saveStatus = ref<SaveStatus>('idle')
  const lastError = ref('')
  const isModified = computed(() => currentContent.value !== originalContent.value)

  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
  let savePromise: Promise<void> | null = null
  let saveAgainAfterCurrent = false

  // ── Helpers ──
  function setStatus(status: SaveStatus) {
    saveStatus.value = status
    if (status !== 'error') {
      lastError.value = ''
    }
  }

  function handleSaveError(e: unknown, context: string) {
    const message = e instanceof Error ? e.message : String(e)
    console.error(`${context}:`, message)
    lastError.value = message
    setStatus('error')
  }

  // ── Actions ──

  /**
   * Load a markdown file from disk. Creates a .bak backup on first open.
   */
  async function loadFile(path: string) {
    // If the same file is already open and unmodified, do nothing
    if (filePath.value === path && !isModified.value) return

    // If switching files, save current first
    if (filePath.value && isModified.value) {
      try {
        await saveFile()
      } catch {
        throw new Error(i18n.global.t('error.unsavedChanges'))
      }

      if (isModified.value) {
        throw new Error(i18n.global.t('error.unsavedChanges'))
      }
    }

    try {
      const content = await invoke<string>('read_file', { path })
      filePath.value = path
      originalContent.value = content
      currentContent.value = content
      mode.value = 'reading'
      setStatus('saved')

      // Create .bak backup on file open (best-effort, don't block)
      invoke('create_backup', { path }).catch((e) => {
        console.warn('Backup creation skipped:', e)
      })
    } catch (e) {
      handleSaveError(e, 'Failed to read file')
      throw e
    }
  }

  /**
   * Manual save: creates .bak backup, then saves atomically.
   */
  async function manualSave() {
    if (!filePath.value) return

    if (savePromise) {
      saveAgainAfterCurrent = true
      return savePromise
    }

    savePromise = runManualSave()
    try {
      await savePromise
    } finally {
      savePromise = null
    }
  }

  async function runManualSave(): Promise<void> {
    do {
      saveAgainAfterCurrent = false
      const pathToSave = filePath.value
      const contentToSave = currentContent.value

      if (!pathToSave) return

      setStatus('saving')
      try {
        // Create backup before saving
        await invoke('create_backup', { path: pathToSave })
        await invoke('save_file', { path: pathToSave, content: contentToSave })

        if (filePath.value !== pathToSave) return

        originalContent.value = contentToSave
        if (currentContent.value === contentToSave) {
          setStatus('saved')
        } else {
          saveAgainAfterCurrent = true
        }
      } catch (e) {
        handleSaveError(e, 'Manual save failed')
        throw e
      }
    } while (saveAgainAfterCurrent)
  }

  /**
   * Auto-save: save without creating .bak backup.
   * Called by the 800ms debounced watcher.
   */
  async function saveFile() {
    if (!filePath.value) return

    // If content hasn't actually changed, skip
    if (!isModified.value) return

    if (savePromise) {
      saveAgainAfterCurrent = true
      return savePromise
    }

    savePromise = runSaveLoop()
    try {
      await savePromise
    } finally {
      savePromise = null
    }
  }

  function setContent(content: string) {
    currentContent.value = content
    if (savePromise) {
      saveAgainAfterCurrent = true
      setStatus('saving')
      return
    }
    if (content === originalContent.value) {
      setStatus('saved')
    } else {
      setStatus('waiting')
    }
  }

  function setMode(m: AppMode) {
    mode.value = m
  }

  async function closeFile() {
    if (filePath.value && isModified.value) {
      await manualSave()
    }

    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }

    filePath.value = ''
    originalContent.value = ''
    currentContent.value = ''
    mode.value = 'reading'
    zoomLevel.value = 1
    setStatus('idle')
  }

  function zoomIn() {
    zoomLevel.value = Math.min(2, Math.round((zoomLevel.value + 0.1) * 10) / 10)
  }

  function zoomOut() {
    zoomLevel.value = Math.max(0.5, Math.round((zoomLevel.value - 0.1) * 10) / 10)
  }

  function resetZoom() {
    zoomLevel.value = 1
  }

  function insertFrontMatter(): boolean {
    const nextContent = insertFrontMatterTemplate(currentContent.value)
    if (nextContent === currentContent.value) return false
    setContent(nextContent)
    return true
  }

  function getFrontMatter() {
    return parseFrontMatter(currentContent.value)
  }

  function updateFrontMatter(metadata: MarkdownMetadata) {
    setContent(upsertFrontMatter(currentContent.value, metadata))
  }

  function clearFrontMatter(): boolean {
    const nextContent = removeFrontMatter(currentContent.value)
    if (nextContent === currentContent.value) return false
    setContent(nextContent)
    return true
  }

  function generateTitleFromMetadata(): boolean {
    const nextContent = generateTitleFromFrontMatter(currentContent.value)
    if (nextContent === currentContent.value) return false
    setContent(nextContent)
    return true
  }

  function defaultExportName(extension: string): string {
    const base = fileName.value.replace(/\.[^.]+$/, '') || 'untitled'
    return `${base}.${extension}`
  }

  async function exportTablesToExcel(): Promise<string> {
    if (!filePath.value) {
      throw new Error(i18n.global.t('error.needOpenFile'))
    }
    const bytes = await generateXlsxBytes(currentContent.value, fileName.value)
    const savePath = await save({
      title: i18n.global.t('dialog.exportExcelTitle'),
      defaultPath: defaultExportName('xlsx'),
      filters: [{ name: i18n.global.t('dialog.excelFilter'), extensions: ['xlsx'] }],
    })
    if (!savePath) throw new Error(i18n.global.t('export.exportCancelled'))
    await invoke('export_xlsx', { outputPath: savePath, bytes: Array.from(bytes) })
    return savePath
  }

  async function exportToPdf(): Promise<void> {
    if (!filePath.value) {
      throw new Error(i18n.global.t('error.needOpenFile'))
    }
    await exportPdf(currentContent.value)
  }

  async function exportToWord(): Promise<string> {
    if (!filePath.value) {
      throw new Error(i18n.global.t('error.needOpenFile'))
    }
    const bytes = await generateDocxBytes(currentContent.value)
    const savePath = await save({
      title: i18n.global.t('dialog.exportWordTitle'),
      defaultPath: defaultExportName('docx'),
      filters: [{ name: i18n.global.t('dialog.wordFilter'), extensions: ['docx'] }],
    })
    if (!savePath) throw new Error(i18n.global.t('export.exportCancelled'))
    await invoke('export_docx', { outputPath: savePath, bytes: Array.from(bytes) })
    return savePath
  }

  /**
   * Internal: run the save loop with retry for concurrent edits.
   */
  async function runSaveLoop() {
    do {
      saveAgainAfterCurrent = false
      const pathToSave = filePath.value
      const contentToSave = currentContent.value

      if (!pathToSave) return

      setStatus('saving')
      try {
        await invoke('save_file', { path: pathToSave, content: contentToSave })

        if (filePath.value !== pathToSave) return

        originalContent.value = contentToSave
        if (currentContent.value === contentToSave) {
          setStatus('saved')
        } else {
          saveAgainAfterCurrent = true
        }
      } catch (e) {
        handleSaveError(e, 'Auto-save failed')
        throw e
      }
    } while (saveAgainAfterCurrent)
  }

  // ── Auto-save watcher (800ms debounce) ──
  watch(currentContent, () => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    if (!filePath.value || !isModified.value) return

    setStatus('waiting')
    autoSaveTimer = setTimeout(() => {
      void saveFile().catch(() => {
        // saveFile already records the error in store state.
      })
    }, 800)
  })

  return {
    filePath, fileName, originalContent, currentContent,
    mode, zoomLevel, saveStatus, lastError, isModified,
    loadFile, saveFile, manualSave, closeFile, setContent, setMode,
    zoomIn, zoomOut, resetZoom,
    insertFrontMatter, getFrontMatter, updateFrontMatter, clearFrontMatter, generateTitleFromMetadata,
    exportTablesToExcel, exportToWord, exportToPdf,
  }
})
