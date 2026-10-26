<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useEditorStore } from './stores/editor'
import { useToast } from './composables/useToast'
import AppToolbar from './components/AppToolbar.vue'
import DocumentTabs from './components/DocumentTabs.vue'
import ReaderView from './components/ReaderView.vue'
import RichEditor from './components/RichEditor.vue'
import SourceEditor from './components/SourceEditor.vue'
import OutlinePanel from './components/OutlinePanel.vue'
import WelcomePage from './components/WelcomePage.vue'
import ToastNotification from './components/ToastNotification.vue'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useI18n } from 'vue-i18n'
import { setLocale } from './i18n'
import { flushEditorChanges, runEditorCommand, type EditorCommand } from './utils/editorCommands'
import type { MarkdownMetadata } from './utils/markdown'

const store = useEditorStore()
const { error: showError, warning: showWarning, success: showSuccess } = useToast()
const { t } = useI18n()
let unlistenOpenFile: (() => void) | null = null
let unlistenMenuAction: (() => void) | null = null
let unlistenLanguageChanged: (() => void) | null = null
let unlistenDragDrop: (() => void) | null = null
let unlistenClose: (() => void) | null = null
let disposed = false
const closingWindow = ref(false)

const showOutline = ref(true)
const isDragOver = ref(false)

function isValidMarkdownPath(path: string): boolean {
  const lower = path.toLowerCase()
  return lower.endsWith('.md') || lower.endsWith('.markdown')
}

async function openFiles(paths: string[]) {
  for (const path of paths) {
    if (!isValidMarkdownPath(path)) {
      showWarning(t('error.onlyMarkdown'))
      continue
    }
    try { await store.loadFile(path) } catch (e) {
      showError(e instanceof Error ? e.message : String(e))
    }
  }
}

async function chooseFiles() {
  try {
    const selected = await open({
      title: t('dialog.openTitle'),
      filters: [{ name: t('dialog.markdownFilter'), extensions: ['md', 'markdown'] }],
      multiple: true,
    })
    if (selected) await openFiles(Array.isArray(selected) ? selected : [selected])
  } catch (e) {
    showError(e instanceof Error ? e.message : String(e))
  }
}

async function handleMenuAction(action: string) {
  try {
    switch (action) {
      case 'file.open': {
        await chooseFiles()
        break
      }
      case 'file.save': {
        await store.manualSave()
        showSuccess(t('save.fileSaved'))
        break
      }
      case 'file.save_as': {
        if (!store.filePath) break
        const id = store.activeDocumentId
        const savePath = await save({
          title: t('dialog.saveAsTitle'),
          defaultPath: store.fileName,
          filters: [
            { name: t('dialog.markdownFilter'), extensions: ['md'] },
          ],
        })
        if (savePath) {
          await store.saveFileAs(savePath, id)
          showSuccess(t('export.savedAs') + ' ' + savePath.replace(/\\/g, '/').split('/').pop())
        }
        break
      }
      case 'file.export_word': {
        if (!store.filePath) {
          showWarning(t('error.needOpenFile'))
          break
        }
        try {
          const outPath = await store.exportToWord()
          showSuccess(t('export.exportedTo') + ' ' + outPath.split('/').pop())
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e)
          if (msg !== t('export.exportCancelled')) showError(msg)
        }
        break
      }
      case 'file.export_pdf': {
        if (!store.filePath) {
          showWarning(t('error.needOpenFile'))
          break
        }
        try {
          await store.exportToPdf()
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e)
          if (msg !== t('export.exportCancelled')) showError(msg)
        }
        break
      }
      case 'file.export_excel': {
        if (!store.filePath) {
          showWarning(t('error.needOpenFile'))
          break
        }
        try {
          const outPath = await store.exportTablesToExcel()
          showSuccess(t('export.exportedTo') + ' ' + outPath.split('/').pop())
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e)
          if (msg !== t('export.exportCancelled')) showError(msg)
        }
        break
      }
      case 'file.close_document': {
        await closeCurrentFile()
        break
      }
      case 'app.quit': {
        if (closingWindow.value) break
        closingWindow.value = true
        try {
          await store.flushAll()
          await invoke('quit_app')
        } finally { closingWindow.value = false }
        break
      }
      case 'view.reading': {
        store.setMode('reading')
        break
      }
      case 'view.editing': {
        store.setMode('editing')
        break
      }
      case 'view.source': {
        store.setMode('source')
        break
      }
      case 'view.outline': {
        showOutline.value = !showOutline.value
        break
      }
      case 'view.zoom_in': {
        store.zoomIn()
        break
      }
      case 'view.zoom_out': {
        store.zoomOut()
        break
      }
      case 'view.actual_size': {
        store.resetZoom()
        break
      }
      case 'view.fullscreen': {
        const win = getCurrentWindow()
        await win.setFullscreen(!(await win.isFullscreen()))
        break
      }
      case 'edit.undo':
      case 'edit.redo':
      case 'edit.cut':
      case 'edit.copy':
      case 'edit.paste':
      case 'edit.select_all':
      case 'edit.find': {
        await handleEditAction(action)
        break
      }
      case 'edit.insert_front_matter': {
        if (!store.filePath) {
          showWarning(t('error.needOpenFile'))
          break
        }
        const inserted = store.insertFrontMatter()
        if (inserted) showSuccess(t('frontMatter.inserted'))
        else showWarning(t('frontMatter.alreadyExists'))
        break
      }
      case 'edit.edit_front_matter': {
        if (!store.filePath) {
          showWarning(t('error.needOpenFile'))
          break
        }
        const metadata = promptFrontMatterMetadata()
        if (!metadata) break
        store.updateFrontMatter(metadata)
        showSuccess(t('frontMatter.updated'))
        break
      }
      case 'edit.clear_front_matter': {
        if (!store.filePath) {
          showWarning(t('error.needOpenFile'))
          break
        }
        if (!store.getFrontMatter().hasFrontMatter) {
          showWarning(t('frontMatter.notFound'))
          break
        }
        if (!window.confirm(t('frontMatter.confirmClear'))) break
        const cleared = store.clearFrontMatter()
        if (cleared) showSuccess(t('frontMatter.cleared'))
        break
      }
      case 'edit.generate_title_from_front_matter': {
        if (!store.filePath) {
          showWarning(t('error.needOpenFile'))
          break
        }
        const generated = store.generateTitleFromMetadata()
        if (generated) showSuccess(t('frontMatter.titleGenerated'))
        else showWarning(t('frontMatter.cannotGenerateTitle'))
        break
      }
      case 'help.guide': {
        showSuccess(t('help.guideText'))
        break
      }
      case 'help.testing': {
        showSuccess(t('help.testingText'))
        break
      }
    }
  } catch (e) {
    showError(e instanceof Error ? e.message : String(e))
  }
}

async function closeCurrentFile(id = store.activeDocumentId) {
  try {
    await store.closeFile(id)
  } catch (e) {
    showError(e instanceof Error ? e.message : String(e))
  }
}

function toEditorCommand(action: string): EditorCommand | null {
  switch (action) {
    case 'edit.undo':
      return 'undo'
    case 'edit.redo':
      return 'redo'
    case 'edit.cut':
      return 'cut'
    case 'edit.copy':
      return 'copy'
    case 'edit.paste':
      return 'paste'
    case 'edit.select_all':
      return 'selectAll'
    case 'edit.find':
      return 'find'
    default:
      return null
  }
}

async function handleEditAction(action: string) {
  const command = toEditorCommand(action)
  if (!command) return

  if (store.mode === 'reading') {
    if (command === 'find') {
      findInReadingView()
      return
    }
    if (command === 'copy' || command === 'selectAll') {
      if (document.execCommand(command === 'selectAll' ? 'selectAll' : 'copy')) return
    }
    showWarning(t('edit.unsupportedMode'))
    return
  }

  const handled = await runEditorCommand(command)
  if (!handled) {
    showWarning(command === 'find' ? t('edit.findUnsupported') : t('edit.unsupportedMode'))
  }
}

function findInReadingView() {
  const query = window.prompt(t('edit.findPrompt'))
  if (!query) return

  const finder = (window as Window & {
    find?: (searchString: string, caseSensitive?: boolean, backwards?: boolean, wrap?: boolean) => boolean
  }).find

  const found = finder?.(query, false, false, true) ?? false
  if (!found) showWarning(t('edit.findNoMatch'))
}

function promptValue(key: string, initialValue = ''): string | null {
  return window.prompt(t(key), initialValue)
}

function promptFrontMatterMetadata(): MarkdownMetadata | null {
  const current = store.getFrontMatter().metadata
  const title = promptValue('frontMatter.promptTitle', current.title ?? '')
  if (title === null) return null
  const subtitle = promptValue('frontMatter.promptSubtitle', current.subtitle ?? '')
  if (subtitle === null) return null
  const author = promptValue('frontMatter.promptAuthor', current.author ?? '')
  if (author === null) return null
  const date = promptValue('frontMatter.promptDate', current.date ?? '')
  if (date === null) return null
  const tagsInput = promptValue('frontMatter.promptTags', current.tags?.join(', ') ?? '')
  if (tagsInput === null) return null

  return {
    title,
    subtitle,
    author,
    date,
    tags: tagsInput
      .split(/[,\n]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
  }
}

onMounted(async () => {
  // Sync initial language from backend settings
  try {
    const lang = await invoke<string>('get_language')
    setLocale(lang as 'zh-CN' | 'en-US')
  } catch {
    // Keep default locale if backend is unreachable
  }

  // Listen for language changes from native menu
  try {
    unlistenLanguageChanged = await listen<string>('language-changed', (event) => {
      setLocale(event.payload as 'zh-CN' | 'en-US')
    })
  } catch {
    // Keep the current locale if native event listening is unavailable.
  }

  // Listen for file-open event from Tauri backend (CLI args or OS file association)
  try {
    unlistenOpenFile = await listen<string>('open-file', async (event) => {
      try {
        await store.loadFile(event.payload)
      } catch (e) {
        showError(e instanceof Error ? e.message : String(e))
      }
    })
  } catch {
    // Startup paths still load through the initial_files command below.
  }

  // Listen for menu actions from native menu bar
  try {
    unlistenMenuAction = await listen<string>('menu-action', async (event) => {
      await handleMenuAction(event.payload)
    })
  } catch {
    // Native menu events are optional; toolbar actions remain available.
  }

  try {
    const initialFiles = await invoke<string[]>('initial_files')
    await openFiles(initialFiles)
  } catch (e) {
    showError(e instanceof Error ? e.message : String(e))
  }

  try {
    unlistenDragDrop = await getCurrentWebviewWindow().onDragDropEvent((event) => {
      isDragOver.value = event.payload.type === 'over'
      if (event.payload.type === 'drop') void openFiles(event.payload.paths)
    })
    unlistenClose = await getCurrentWindow().onCloseRequested(async (event) => {
      flushEditorChanges()
      if (!store.hasPendingSaves && !closingWindow.value) return
      event.preventDefault()
      if (closingWindow.value) return
      closingWindow.value = true
      try {
        await store.flushAll()
        await getCurrentWindow().destroy()
      } catch (e) {
        showError(e instanceof Error ? e.message : String(e))
      } finally { closingWindow.value = false }
    })
  } catch {
    // Browser previews have no native window or drag/drop events.
  }
  if (disposed) {
    unlistenOpenFile?.()
    unlistenMenuAction?.()
    unlistenLanguageChanged?.()
    unlistenDragDrop?.()
    unlistenClose?.()
  }
})

onUnmounted(() => {
  disposed = true
  unlistenOpenFile?.()
  unlistenMenuAction?.()
  unlistenLanguageChanged?.()
  unlistenDragDrop?.()
  unlistenClose?.()
})
</script>

<template>
  <div class="app-shell h-full flex flex-col" :inert="closingWindow">
    <DocumentTabs v-if="store.documents.length" @open="chooseFiles" @close="closeCurrentFile" />
    <!-- Toolbar: only shown when a file is loaded -->
    <AppToolbar v-if="store.filePath" />

    <!-- Main content area -->
    <div
      v-if="store.filePath" id="active-document" :key="store.activeDocumentId"
      role="tabpanel" :aria-labelledby="`tab-${store.activeDocumentId}`"
      :inert="store.activeDocument?.closing || closingWindow" class="flex-1 flex overflow-hidden"
    >
      <!-- Left: reader / source editor -->
      <div
        class="flex-1 flex overflow-hidden document-zoom"
        :style="{ '--document-zoom': String(store.zoomLevel) }"
      >
        <ReaderView v-if="store.mode === 'reading'" />
        <RichEditor v-else-if="store.mode === 'editing'" />
        <SourceEditor v-else-if="store.mode === 'source'" />
      </div>

      <!-- Right: outline (reading mode only, toggle via menu or shortcut) -->
      <Transition name="slide-outline">
        <OutlinePanel v-if="store.mode === 'reading' && showOutline" />
      </Transition>
    </div>

    <!-- Welcome page: shown when no file is loaded -->
    <WelcomePage v-else :is-drag-over="isDragOver" @open="chooseFiles" />

    <!-- Global toast notifications -->
    <ToastNotification />
  </div>
</template>

<style scoped>
.document-zoom {
  zoom: var(--document-zoom);
}
</style>
