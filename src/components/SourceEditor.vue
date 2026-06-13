<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { EditorView, keymap, placeholder } from '@codemirror/view'
import { Compartment, EditorState } from '@codemirror/state'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { defaultKeymap, redo, selectAll, undo } from '@codemirror/commands'
import { openSearchPanel, search, searchKeymap } from '@codemirror/search'
import { oneDark } from '@codemirror/theme-one-dark'
import { useEditorStore } from '../stores/editor'
import { i18n } from '../i18n'
import { registerEditorCommandHandler, type EditorCommand } from '../utils/editorCommands'

const store = useEditorStore()
const containerRef = ref<HTMLDivElement>()
let view: EditorView | null = null
let syncFromStore = false
let unregisterCommandHandler: (() => void) | null = null
const placeholderCompartment = new Compartment()

function execBrowserEditCommand(command: 'cut' | 'copy' | 'paste'): boolean {
  view?.focus()
  try {
    return document.execCommand(command)
  } catch {
    return false
  }
}

function handleEditorCommand(command: EditorCommand): boolean {
  if (!view) return false

  switch (command) {
    case 'undo':
      return undo(view)
    case 'redo':
      return redo(view)
    case 'selectAll':
      return selectAll(view)
    case 'find':
      view.focus()
      return openSearchPanel(view)
    case 'cut':
    case 'copy':
    case 'paste':
      return execBrowserEditCommand(command)
  }
}

function createEditor() {
  if (!containerRef.value) return

  const extensions = [
    markdown({ base: markdownLanguage }),
    oneDark,
    search(),
    placeholderCompartment.of(placeholder(i18n.global.t('source.placeholder'))),
    keymap.of([...searchKeymap, ...defaultKeymap]),
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

  unregisterCommandHandler = registerEditorCommandHandler(handleEditorCommand)
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
  unregisterCommandHandler?.()
  view?.destroy()
})
</script>

<template>
  <div ref="containerRef" class="flex-1 overflow-hidden bg-[var(--charcoal)]"></div>
</template>
