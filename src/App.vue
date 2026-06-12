<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useEditorStore } from './stores/editor'
import { useToast } from './composables/useToast'
import AppToolbar from './components/AppToolbar.vue'
import ReaderView from './components/ReaderView.vue'
import RichEditor from './components/RichEditor.vue'
import SourceEditor from './components/SourceEditor.vue'
import OutlinePanel from './components/OutlinePanel.vue'
import WelcomePage from './components/WelcomePage.vue'
import ToastNotification from './components/ToastNotification.vue'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { open, save } from '@tauri-apps/plugin-dialog'
import { getCurrentWebview } from '@tauri-apps/api/webview'
import { useI18n } from 'vue-i18n'
import { setLocale } from './i18n'

const store = useEditorStore()
const { error: showError, warning: showWarning, success: showSuccess } = useToast()
const { t } = useI18n()
let unlistenOpenFile: (() => void) | null = null
let unlistenMenuAction: (() => void) | null = null
let unlistenLanguageChanged: (() => void) | null = null

const showOutline = ref(true)
const zoomLevel = ref(1.0)

function addRecentFile(path: string) {
  try {
    const raw = localStorage.getItem('md-quicklook-recent')
    const files: string[] = raw ? JSON.parse(raw) : []
    const filtered = files.filter((f) => f !== path)
    filtered.unshift(path)
    localStorage.setItem('md-quicklook-recent', JSON.stringify(filtered.slice(0, 10)))
  } catch {
    // localStorage may be unavailable
  }
}

function isValidMarkdownPath(path: string): boolean {
  const lower = path.toLowerCase()
  return lower.endsWith('.md') || lower.endsWith('.markdown')
}

async function handleMenuAction(action: string) {
  try {
    switch (action) {
      case 'file.open': {
        const selected = await open({
          title: t('dialog.openTitle'),
          filters: [
            { name: t('dialog.markdownFilter'), extensions: ['md', 'markdown'] },
            { name: t('dialog.allFiles'), extensions: ['*'] },
          ],
          multiple: false,
        })
        if (selected && isValidMarkdownPath(selected as string)) {
          await store.loadFile(selected as string)
          addRecentFile(selected as string)
        } else if (selected) {
          showWarning(t('error.onlyMarkdown'))
        }
        break
      }
      case 'file.save': {
        await store.manualSave()
        showSuccess(t('save.fileSaved'))
        break
      }
      case 'file.save_as': {
        if (!store.filePath) break
        const savePath = await save({
          title: t('dialog.saveAsTitle'),
          filters: [
            { name: t('dialog.markdownFilter'), extensions: ['md'] },
          ],
        })
        if (savePath) {
          await invoke('save_file', { path: savePath, content: store.currentContent })
          await store.loadFile(savePath)
          addRecentFile(savePath)
          showSuccess(t('export.savedAs') + ' ' + (savePath as string).split('/').pop())
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
        zoomLevel.value = Math.min(zoomLevel.value + 0.1, 3.0)
        await getCurrentWebview().setZoom(zoomLevel.value)
        break
      }
      case 'view.zoom_out': {
        zoomLevel.value = Math.max(zoomLevel.value - 0.1, 0.3)
        await getCurrentWebview().setZoom(zoomLevel.value)
        break
      }
      case 'view.actual_size': {
        zoomLevel.value = 1.0
        await getCurrentWebview().setZoom(1.0)
        break
      }
      case 'edit.find': {
        // Focus the current editor's find/search
        // The editors handle their own find via Ctrl+F / Cmd+F natively
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

onMounted(async () => {
  // Sync initial language from backend settings
  try {
    const lang = await invoke<string>('get_language')
    setLocale(lang as 'zh-CN' | 'en-US')
  } catch {
    // Keep default locale if backend is unreachable
  }

  // Listen for language changes from native menu
  unlistenLanguageChanged = await listen<string>('language-changed', (event) => {
    setLocale(event.payload as 'zh-CN' | 'en-US')
  })

  // Listen for file-open event from Tauri backend (CLI args or OS file association)
  unlistenOpenFile = await listen<string>('open-file', async (event) => {
    try {
      await store.loadFile(event.payload)
      addRecentFile(event.payload)
    } catch (e) {
      showError(e instanceof Error ? e.message : String(e))
    }
  })

  // Listen for menu actions from native menu bar
  unlistenMenuAction = await listen<string>('menu-action', async (event) => {
    await handleMenuAction(event.payload)
  })

  const initialFile = await invoke<string | null>('initial_file')
  if (initialFile) {
    try {
      await store.loadFile(initialFile)
      addRecentFile(initialFile)
    } catch (e) {
      showError(e instanceof Error ? e.message : String(e))
    }
  }
})

onUnmounted(() => {
  unlistenOpenFile?.()
  unlistenMenuAction?.()
  unlistenLanguageChanged?.()
})
</script>

<template>
  <div class="app-shell h-full flex flex-col">
    <!-- Toolbar: only shown when a file is loaded -->
    <AppToolbar v-if="store.filePath" />

    <!-- Main content area -->
    <div v-if="store.filePath" class="flex-1 flex overflow-hidden">
      <!-- Left: reader / source editor -->
      <div class="flex-1 flex overflow-hidden">
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
    <WelcomePage v-else ref="welcomeRef" />

    <!-- Global toast notifications -->
    <ToastNotification />
  </div>
</template>
