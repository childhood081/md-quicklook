<script setup lang="ts">
import { nextTick } from 'vue'
import { FolderOpen, X } from '@lucide/vue'
import { useEditorStore } from '../stores/editor'
import { documentName } from '../stores/documentWorkspace'

const store = useEditorStore()
defineEmits<{ open: []; close: [id: string] }>()

async function moveTab(event: KeyboardEvent, index: number) {
  let next = index
  if (event.key === 'ArrowRight') next = (index + 1) % store.documents.length
  else if (event.key === 'ArrowLeft') next = (index + store.documents.length - 1) % store.documents.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = store.documents.length - 1
  else return
  event.preventDefault()
  const doc = store.documents[next]
  if (!doc) return
  store.selectDocument(doc.id)
  await nextTick()
  document.getElementById(`tab-${doc.id}`)?.focus()
}
</script>

<template>
  <nav class="document-tabs" :aria-label="$t('tabs.label')">
    <button class="open-document" :title="$t('tabs.open')" :aria-label="$t('tabs.open')" @click="$emit('open')">
      <FolderOpen :size="17" aria-hidden="true" />
    </button>
    <div class="tab-list" role="tablist" :aria-label="$t('tabs.label')">
      <div v-for="(doc, index) in store.documents" :key="doc.id" class="document-tab" :class="{ active: doc.id === store.activeDocumentId }">
        <button
          :id="`tab-${doc.id}`" class="tab-select" role="tab"
          :aria-selected="doc.id === store.activeDocumentId"
          :tabindex="doc.id === store.activeDocumentId ? 0 : -1"
          :title="doc.filePath" aria-controls="active-document"
          @click="store.selectDocument(doc.id)" @keydown="moveTab($event, index)"
        >
          <span class="tab-name">{{ documentName(doc.filePath) }}</span>
          <span v-if="doc.saveStatus === 'error'" class="tab-state error" :title="doc.lastError" :aria-label="$t('save.error')">!</span>
          <span v-else-if="doc.currentContent !== doc.originalContent" class="tab-state" :aria-label="$t('save.waiting')">*</span>
        </button>
        <button
          class="tab-close" :disabled="doc.closing"
          :title="$t('tabs.close', { name: documentName(doc.filePath) })"
          :aria-label="$t('tabs.close', { name: documentName(doc.filePath) })"
          @click="$emit('close', doc.id)"
        ><X :size="14" aria-hidden="true" /></button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.document-tabs { display: flex; flex-shrink: 0; height: 40px; min-width: 0; background: #efefed; border-bottom: 1px solid var(--line); }
.open-document { display: grid; place-items: center; flex: 0 0 44px; border-right: 1px solid var(--line); }
.tab-list { display: flex; min-width: 0; overflow-x: auto; scrollbar-width: thin; }
.document-tab { display: flex; flex: 0 0 auto; max-width: 250px; min-width: 120px; border-right: 1px solid var(--line); }
.document-tab.active { background: #fbfbfa; box-shadow: inset 0 -2px var(--indigo); }
.tab-select { display: flex; gap: 8px; align-items: center; min-width: 0; padding: 0 8px 0 14px; font-size: 12px; color: var(--muted); text-align: left; }
.active .tab-select { color: var(--ink); font-weight: 700; }
.tab-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tab-state { flex-shrink: 0; color: var(--indigo); }
.tab-state.error { color: #b32325; }
.tab-close { display: grid; place-items: center; flex: 0 0 30px; margin-left: auto; }
.tab-close:hover, .open-document:hover { background: #e4e4e1; }
button:focus-visible { outline: 2px solid var(--indigo); outline-offset: -3px; }
</style>
