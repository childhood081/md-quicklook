<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../stores/editor'

const store = useEditorStore()
const headings = computed(() => {
  const lines = store.currentContent.split('\n')
  const result: { level: number; text: string; line: number }[] = []
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,6})\s+(.+)/)
    if (match) {
      result.push({
        level: match[1].length,
        text: match[2].trim(),
        line: i,
      })
    }
  }
  return result
})

function scrollToLine(line: number) {
  // Find all heading elements in the reader and scroll to the matching one
  const container = document.querySelector('.reader-content')
  if (!container) return
  const allHeadings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  // Use the index of our heading in the computed list
  const idx = headings.value.findIndex(h => h.line === line)
  if (idx >= 0 && allHeadings[idx]) {
    allHeadings[idx].scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <aside
    v-if="store.mode === 'reading'"
    class="w-64 shrink-0 overflow-auto border-l px-5 py-6"
    style="border-color: var(--line); background: rgba(251, 251, 250, 0.88);"
  >
    <div class="mb-4 border-b pb-3" style="border-color: var(--line);">
      <h3 class="text-[12px] font-extrabold uppercase" style="color: var(--ink);">{{ $t('outline.outline') }}</h3>
      <p class="mt-1 text-[11px]" style="color: var(--faint);">{{ $t('outline.headings') }}</p>
    </div>
    <nav class="space-y-1">
      <div
        v-for="(h, idx) in headings"
        :key="idx"
        @click="scrollToLine(h.line)"
        :style="{ paddingLeft: (h.level - 1) * 11 + 'px' }"
        class="group grid cursor-pointer grid-cols-[14px_1fr] items-center gap-2 py-1.5 text-[12px] font-semibold transition-colors"
      >
        <span
          class="h-2 w-2 rounded-sm transition-transform group-hover:scale-125"
          :style="{ background: h.level <= 2 ? 'var(--indigo)' : 'var(--slate)' }"
        />
        <span class="truncate" style="color: var(--muted);">{{ h.text }}</span>
      </div>
      <div v-if="headings.length === 0" class="text-[12px]" style="color: var(--faint);">
        {{ $t('outline.noHeadings') }}
      </div>
    </nav>
  </aside>
</template>
