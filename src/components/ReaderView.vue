<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue'
import { useEditorStore } from '../stores/editor'
import { renderMarkdown, highlightCodeBlocks } from '../utils/markdown'
import '../styles/reader.css'

const store = useEditorStore()
const containerRef = ref<HTMLElement | null>(null)
let renderVersion = 0

async function render() {
  if (!containerRef.value) return
  const version = ++renderVersion
  const html = renderMarkdown(store.currentContent)
  containerRef.value.innerHTML = html
  await nextTick()
  if (version !== renderVersion || !containerRef.value) return
  await highlightCodeBlocks(containerRef.value)
}

// Re-render when content changes (e.g. after save)
watch(() => store.currentContent, render)

// Initial render
onMounted(render)
</script>

<template>
  <div class="flex-1 overflow-auto">
    <div ref="containerRef" class="reader-content"></div>
  </div>
</template>
