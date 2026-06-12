<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '../stores/editor'
import { useToast } from '../composables/useToast'
import type { AppMode } from '../stores/editor'

const store = useEditorStore()
const { error: toastError, success: toastSuccess } = useToast()
const { t } = useI18n()
const isExporting = ref(false)
const isExportingWord = ref(false)

const modes = computed(() => [
  { id: 'reading' as AppMode, label: t('toolbar.read'), icon: 'R' },
  { id: 'editing' as AppMode, label: t('toolbar.edit'), icon: 'E' },
  { id: 'source' as AppMode, label: t('toolbar.source'), icon: 'S' },
])

const statusText = computed(() => {
  switch (store.saveStatus) {
    case 'idle':    return t('save.idle')
    case 'waiting': return t('save.waiting')
    case 'saving':  return t('save.saving')
    case 'saved':   return t('save.saved')
    case 'error':   return t('save.error')
  }
})

const statusClass = computed(() => {
  switch (store.saveStatus) {
    case 'waiting': return 'waiting'
    case 'saving':  return 'saving'
    case 'saved':   return 'saved'
    case 'error':   return 'error'
    default:        return 'idle'
  }
})

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

async function onManualSave() {
  try {
    await store.manualSave()
    toastSuccess(t('save.fileSaved'))
  } catch (e) {
    toastError(errorMessage(e))
  }
}

async function exportExcel() {
  if (isExporting.value) return

  isExporting.value = true
  try {
    const outputPath = await store.exportTablesToExcel()
    toastSuccess(t('export.exportedTo') + ' ' + outputPath.split('/').pop())
  } catch (e) {
    const msg = errorMessage(e)
    if (msg !== t('export.exportCancelled')) toastError(msg)
  } finally {
    isExporting.value = false
  }
}

async function exportWord() {
  if (isExportingWord.value) return

  isExportingWord.value = true
  try {
    const outputPath = await store.exportToWord()
    toastSuccess(t('export.exportedTo') + ' ' + outputPath.split('/').pop())
  } catch (e) {
    const msg = errorMessage(e)
    if (msg !== t('export.exportCancelled')) toastError(msg)
  } finally {
    isExportingWord.value = false
  }
}
</script>

<template>
  <header
    class="h-[58px] px-5 select-none shrink-0 border-b"
    style="-webkit-app-region: drag; background: rgba(251, 251, 250, 0.92); border-color: var(--line);"
  >
    <div
      class="grid h-full items-center gap-4"
      style="grid-template-columns: minmax(180px, 1fr) auto minmax(260px, 1fr);"
    >
      <!-- Left: file name + path -->
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <span class="h-3 w-3 rounded-sm" style="background: var(--indigo); box-shadow: var(--shadow-low);" />
          <span class="truncate text-[13px] font-extrabold uppercase" style="color: var(--ink);">
            {{ store.fileName }}
          </span>
        </div>
        <span
          v-if="store.filePath"
          class="mt-1 block truncate text-[11px] hidden md:block"
          style="color: var(--faint);"
        >
          {{ store.filePath }}
        </span>
      </div>

      <!-- Center: mode tabs -->
      <div class="segmented-swiss" style="-webkit-app-region: no-drag">
        <button
          v-for="m in modes"
          :key="m.id"
          @click="store.setMode(m.id)"
          :class="['tab-swiss', store.mode === m.id ? 'is-active' : '']"
        >
          <span class="mr-1 text-[10px] opacity-70">{{ m.icon }}</span>{{ m.label }}
        </button>
      </div>

      <!-- Right: save status + actions -->
      <div class="flex items-center justify-end gap-2" style="-webkit-app-region: no-drag">
        <span
          v-if="store.saveStatus !== 'idle'"
          class="status-pill"
          :data-state="statusClass"
          :title="store.saveStatus === 'error' ? store.lastError : ''"
        >
          {{ statusText }}
        </span>

        <button
          @click="exportExcel"
          :disabled="!store.filePath || isExporting"
          class="btn-swiss btn-secondary"
        >
          {{ isExporting ? $t('toolbar.exporting') : $t('toolbar.excel') }}
        </button>

        <button
          @click="exportWord"
          :disabled="!store.filePath || isExportingWord"
          class="btn-swiss btn-dark"
        >
          {{ isExportingWord ? $t('toolbar.exporting') : $t('toolbar.word') }}
        </button>

        <button
          @click="onManualSave"
          :disabled="store.saveStatus === 'saving' || !store.isModified"
          class="btn-swiss btn-primary"
        >
          {{ $t('toolbar.save') }}
        </button>
      </div>
    </div>
  </header>
</template>
