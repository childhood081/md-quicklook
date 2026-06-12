<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { Compartment, EditorState } from '@codemirror/state'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { defaultKeymap } from '@codemirror/commands'
import { oneDark } from '@codemirror/theme-one-dark'
import { useEditorStore } from '../stores/editor'
import { i18n } from '../i18n'

const store = useEditorStore()
const containerRef = ref<HTMLDivElement>()
let view: EditorView | null = null
let syncFromStore = false
const placeholderCompartment = new Compartment()

function createEditor() {
  if (!containerRef.value) return

  const extensions = [
    markdown({ base: markdownLanguage }),
    oneDark,
    placeholderCompartment.of(placeholder(i18n.global.t('source.placeholder'))),
    keymap.of(defaultKeymap),
    EditorView.updateListener.of((update) => {
      if (update.docChanged && !syncFromStore) {
        store.setContent(update.state.doc.toString())
      }
    }),
    EditorView.theme({
      '&': { height: '100%' },
      '.cm-scroller': { overflow: 'auto', fontFamily: '"SF Mono", Menlo, Consolas, monospace' },
    }),
  ]

  const state = EditorState.create({
    doc: store.currentContent,
    extensions,
  })

  view = new EditorView({
    state,
    parent: containerRef.value,
  })
}

// Watch for external content changes (e.g. when file is loaded)
watch(() => store.currentContent, (newContent) => {
  if (view && newContent !== view.state.doc.toString()) {
    syncFromStore = true
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: newContent,
      },
    })
    syncFromStore = false
  }
})

watch(() => i18n.global.locale.value, () => {
  view?.dispatch({
    effects: placeholderCompartment.reconfigure(
      placeholder(i18n.global.t('source.placeholder')),
    ),
  })
})

onMounted(createEditor)

onUnmounted(() => {
  view?.destroy()
})
</script>

<template>
  <div ref="containerRef" class="flex-1 overflow-hidden bg-[var(--charcoal)]"></div>
</template>
