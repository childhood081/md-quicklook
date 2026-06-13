<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '../stores/editor'
import { useToast } from '../composables/useToast'
import { open } from '@tauri-apps/plugin-dialog'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

const store = useEditorStore()
const { error: showError, warning: showWarning } = useToast()
const { t } = useI18n()

const isDragOver = ref(false)
const recentFiles = ref<string[]>(loadRecentFiles())
let unlistenDragDrop: (() => void) | null = null

function loadRecentFiles(): string[] {
  try {
    const raw = localStorage.getItem('md-quicklook-recent')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function addRecentFile(path: string) {
  const files = loadRecentFiles().filter((f) => f !== path)
  files.unshift(path)
  const trimmed = files.slice(0, 10)
  localStorage.setItem('md-quicklook-recent', JSON.stringify(trimmed))
  recentFiles.value = trimmed
}

function isValidMarkdownPath(path: string): boolean {
  const lower = path.toLowerCase()
  return lower.endsWith('.md') || lower.endsWith('.markdown')
}

async function openFile(path: string) {
  if (!isValidMarkdownPath(path)) {
    showWarning(t('error.onlyMarkdown'))
    return
  }
  try {
    await store.loadFile(path)
    addRecentFile(path)
  } catch (e) {
    showError(e instanceof Error ? e.message : String(e))
  }
}

async function openRecent(path: string) {
  await openFile(path)
}

async function onChooseFile() {
  try {
    const selected = await open({
      title: t('dialog.openTitle'),
      filters: [
        { name: t('dialog.markdownFilter'), extensions: ['md', 'markdown'] },
        { name: t('dialog.allFiles'), extensions: ['*'] },
      ],
      multiple: false,
    })
    if (selected) {
      await openFile(selected as string)
    }
  } catch (e) {
    showError(e instanceof Error ? e.message : String(e))
  }
}

onMounted(async () => {
  try {
    unlistenDragDrop = await getCurrentWebviewWindow().onDragDropEvent((event) => {
      if (event.payload.type === 'over') {
        isDragOver.value = true
      } else if (event.payload.type === 'leave') {
        isDragOver.value = false
      } else if (event.payload.type === 'drop') {
        isDragOver.value = false
        const paths = event.payload.paths
        if (paths.length > 0) {
          openFile(paths[0])
        }
      }
    })
  } catch {
    // Drag-drop events may not be available in all contexts
    console.warn('Drag-drop event listener not available')
  }
})

onUnmounted(() => {
  unlistenDragDrop?.()
})

defineExpose({ addRecentFile })
</script>

<template>
  <div
    class="flex-1 flex items-center justify-center select-none px-6 py-8"
    :class="{ 'is-drag-over': isDragOver }"
  >
    <div class="swiss-panel w-full max-w-5xl p-10 md:p-12">
      <div class="grid gap-10 md:grid-cols-[1fr_270px]">
        <section class="min-w-0">
          <div class="swiss-eyebrow mb-7">{{ $t('welcome.eyebrow') }}</div>
          <h1 class="max-w-3xl text-[44px] leading-none font-black md:text-[58px]" style="color: var(--ink);">
            {{ $t('app.name') }}
          </h1>
          <p class="mt-5 max-w-xl text-[15px] leading-7" style="color: var(--muted);">
            {{ $t('welcome.tagline') }}
          </p>

          <!-- Drop zone + file picker -->
          <div
            :class="[
              'mt-9 border border-dashed p-7 transition-colors',
              isDragOver ? 'border-[var(--indigo)] bg-[#f0eff8]' : 'border-[var(--line)] bg-[#f7f7f5]'
            ]"
          >
            <div class="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p class="text-[12px] font-extrabold uppercase" style="color: var(--ink);">
                  {{ isDragOver ? $t('welcome.dragDropActive') : $t('welcome.dragDrop') }}
                </p>
                <p class="mt-2 text-[12px]" style="color: var(--muted);">
                  {{ $t('welcome.supportNote') }}
                </p>
              </div>
              <button
                @click="onChooseFile"
                class="btn-swiss btn-primary"
              >
                {{ $t('welcome.chooseFile') }}
              </button>
            </div>
          </div>

          <!-- Recent files -->
          <div v-if="recentFiles.length > 0" class="mt-9 text-left">
            <div class="mb-3 flex items-center gap-3">
              <span class="h-px w-12" style="background: var(--line-strong);" />
              <h3 class="text-[12px] font-extrabold uppercase" style="color: var(--ink);">{{ $t('welcome.recentFiles') }}</h3>
            </div>
            <div class="border-t" style="border-color: var(--line);">
              <button
                v-for="(path, idx) in recentFiles"
                :key="idx"
                @click="openRecent(path)"
                class="grid w-full grid-cols-[24px_1fr] gap-3 border-b px-0 py-3 text-left transition-colors hover:bg-[#f0f0ed]"
                style="border-color: var(--line);"
                :title="path"
              >
                <span class="mt-1 h-3 w-3 rounded-sm" :style="{ background: idx % 2 === 0 ? 'var(--indigo)' : 'var(--teal)' }" />
                <span class="min-w-0">
                  <span class="block truncate text-[13px] font-bold" style="color: var(--ink);">
                    {{ path.split('/').pop() || path.split('\\').pop() || path }}
                  </span>
                  <span class="mt-1 block truncate text-[11px]" style="color: var(--faint);">{{ path }}</span>
                </span>
              </button>
            </div>
          </div>
        </section>

        <aside class="border-t pt-8 md:border-l md:border-t-0 md:pl-8 md:pt-0" style="border-color: var(--line);">
          <div class="border-b pb-5" style="border-color: var(--line);">
            <h2 class="text-[12px] font-extrabold uppercase" style="color: var(--ink);">{{ $t('welcome.tokens') }}</h2>
            <div class="mt-4 grid grid-cols-4 gap-3">
              <span class="h-9 rounded-md shadow-sm" style="background: var(--indigo);" />
              <span class="h-9 rounded-md shadow-sm" style="background: var(--charcoal);" />
              <span class="h-9 rounded-md shadow-sm" style="background: var(--slate);" />
              <span class="h-9 rounded-md shadow-sm" style="background: var(--mint);" />
              <span class="h-9 rounded-md shadow-sm" style="background: var(--cream);" />
              <span class="h-9 rounded-md shadow-sm" style="background: var(--gold);" />
              <span class="h-9 rounded-md shadow-sm" style="background: var(--coral);" />
              <span class="h-9 rounded-md shadow-sm" style="background: var(--teal);" />
            </div>
          </div>

          <div class="border-b py-5" style="border-color: var(--line);">
            <h2 class="text-[12px] font-extrabold uppercase" style="color: var(--ink);">{{ $t('welcome.typography') }}</h2>
            <div class="mt-4 leading-none" style="color: var(--ink);">
              <div class="text-[38px] font-black">H1</div>
              <div class="text-[25px] font-extrabold">H2</div>
              <div class="text-[19px] font-bold">H3</div>
              <div class="mt-2 text-[14px]">{{ $t('welcome.body') }}</div>
              <div class="mt-1 text-[11px]" style="color: var(--muted);">{{ $t('welcome.caption') }}</div>
            </div>
          </div>

          <div class="pt-5">
            <h2 class="text-[12px] font-extrabold uppercase" style="color: var(--ink);">{{ $t('welcome.controls') }}</h2>
            <div class="mt-4 flex flex-col gap-3">
              <button class="btn-swiss btn-primary pointer-events-none">{{ $t('welcome.primary') }}</button>
              <button class="btn-swiss btn-secondary pointer-events-none">{{ $t('welcome.secondary') }}</button>
              <div class="segmented-swiss pointer-events-none">
                <span class="tab-swiss is-active inline-flex items-center justify-center">{{ $t('mode.reading') }}</span>
                <span class="tab-swiss inline-flex items-center justify-center">{{ $t('mode.editing') }}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
