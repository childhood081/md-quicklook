<script setup lang="ts">
import { defineComponent, h, onUnmounted, shallowRef, ref, watch } from 'vue'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/vue'
import type { UseEditorReturn } from '@milkdown/vue'
import { Editor, rootCtx, defaultValueCtx, editorViewCtx } from '@milkdown/kit/core'
import { commonmark } from '@milkdown/kit/preset/commonmark'
import { gfm } from '@milkdown/kit/preset/gfm'
import { history, redoCommand, undoCommand } from '@milkdown/kit/plugin/history'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { useEditorStore } from '../stores/editor'
import { callCommand, replaceAll } from '@milkdown/utils'
import { registerEditorCommandHandler, type EditorCommand } from '../utils/editorCommands'

const store = useEditorStore()

// Tracks the last markdown synced FROM the editor, to avoid echo loops
const lastEditorContent = ref(store.currentContent)
const activeEditor = shallowRef<UseEditorReturn | null>(null)
let unregisterCommandHandler: (() => void) | null = null

function execBrowserEditCommand(command: 'cut' | 'copy' | 'paste' | 'selectAll'): boolean {
  activeEditor.value?.get()?.action((ctx) => {
    ctx.get(editorViewCtx).focus()
  })

  try {
    return document.execCommand(command === 'selectAll' ? 'selectAll' : command)
  } catch {
    return false
  }
}

function handleEditorCommand(command: EditorCommand): boolean {
  const editor = activeEditor.value?.get()
  if (!editor) return false

  switch (command) {
    case 'undo':
      editor.action(callCommand(undoCommand.key))
      return true
    case 'redo':
      editor.action(callCommand(redoCommand.key))
      return true
    case 'cut':
    case 'copy':
    case 'paste':
    case 'selectAll':
      return execBrowserEditCommand(command)
    case 'find':
      return false
  }
}

const MilkdownEditor = defineComponent({
  name: 'MilkdownEditor',
  setup() {
    const editorRef = useEditor((root) => {
      return Editor.make()
        .config((ctx) => {
          ctx.set(rootCtx, root)
          ctx.set(defaultValueCtx, store.currentContent)
          ctx.get(listenerCtx).markdownUpdated((_, markdown) => {
            lastEditorContent.value = markdown
            store.setContent(markdown)
          })
        })
        .use(commonmark)
        .use(gfm)
        .use(history)
        .use(listener)
    })

    activeEditor.value = editorRef
    unregisterCommandHandler = registerEditorCommandHandler(handleEditorCommand)

    // Sync store → editor when content changes externally (file load, mode switch from source)
    watch(
      () => store.currentContent,
      (newContent) => {
        if (newContent === lastEditorContent.value) return
        lastEditorContent.value = newContent
        const editor = editorRef.get()
        if (editor) {
          editor.action(replaceAll(newContent))
        }
      })

    onUnmounted(() => {
      unregisterCommandHandler?.()
      if (activeEditor.value === editorRef) {
        activeEditor.value = null
      }
    })

    return () => h(Milkdown)
  },
})

// ── Toolbar command execution ──
function exec(command: string, payload?: unknown) {
  const editor = activeEditor.value?.get()
  if (editor) {
    editor.action(callCommand(command, payload))
  }
}

function execHeading(level: number) {
  exec('WrapInHeading', level)
}

function insertTableCommand() {
  exec('InsertTable', { row: 3, col: 3 })
}
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Toolbar -->
    <div
      class="flex items-center gap-1 overflow-x-auto border-b px-5 py-2 shrink-0"
      style="background: rgba(251, 251, 250, 0.9); border-color: var(--line);"
    >
      <!-- Paragraph / Heading -->
      <select
        class="text-xs px-2 py-1 cursor-pointer"
        style="border: 1px solid var(--line); border-radius: var(--radius-md); background: #f4f4f2; color: var(--ink);"
        @change="(e) => {
          const v = (e.target as HTMLSelectElement).value
          v === 'p' ? exec('TurnIntoText') : execHeading(Number(v))
        }"
      >
        <option value="p">{{ $t('editor.paragraph') }}</option>
        <option value="1">{{ $t('editor.heading1') }}</option>
        <option value="2">{{ $t('editor.heading2') }}</option>
        <option value="3">{{ $t('editor.heading3') }}</option>
        <option value="4">{{ $t('editor.heading4') }}</option>
      </select>

      <span class="w-px h-5 mx-1" style="background: var(--line);" />

      <!-- Inline formatting -->
      <button
        class="toolbar-btn font-bold"
        :title="$t('editor.boldTitle')"
        @click="exec('ToggleStrong')"
      >{{ $t('editor.bold') }}</button>
      <button
        class="toolbar-btn italic"
        :title="$t('editor.italicTitle')"
        @click="exec('ToggleEmphasis')"
      >{{ $t('editor.italic') }}</button>
      <button
        class="toolbar-btn font-mono text-xs"
        :title="$t('editor.inlineCodeTitle')"
        @click="exec('ToggleInlineCode')"
      >{{ $t('editor.inlineCode') }}</button>

      <span class="w-px h-5 mx-1" style="background: var(--line);" />

      <!-- Lists -->
      <button
        class="toolbar-btn"
        :title="$t('editor.bulletListTitle')"
        @click="exec('WrapInBulletList')"
      >{{ $t('editor.bulletList') }}</button>
      <button
        class="toolbar-btn"
        :title="$t('editor.orderedListTitle')"
        @click="exec('WrapInOrderedList')"
      >{{ $t('editor.orderedList') }}</button>

      <span class="w-px h-5 mx-1" style="background: var(--line);" />

      <!-- Block elements -->
      <button
        class="toolbar-btn"
        :title="$t('editor.blockquoteTitle')"
        @click="exec('WrapInBlockquote')"
      >{{ $t('editor.blockquote') }}</button>
      <button
        class="toolbar-btn font-mono text-xs"
        :title="$t('editor.codeBlockTitle')"
        @click="exec('CreateCodeBlock', '')"
      >{{ $t('editor.codeBlock') }}</button>

      <span class="w-px h-5 mx-1" style="background: var(--line);" />

      <!-- Link -->
      <button
        class="toolbar-btn"
        :title="$t('editor.linkTitle')"
        @click="exec('ToggleLink', { href: 'https://' })"
      >{{ $t('editor.link') }}</button>

      <!-- Table -->
      <button
        class="toolbar-btn"
        :title="$t('editor.tableTitle')"
        @click="insertTableCommand"
      >{{ $t('editor.table') }}</button>
    </div>

    <!-- Editor -->
    <div class="flex-1 overflow-auto">
      <div class="editor-paper-wrapper">
        <MilkdownProvider>
          <MilkdownEditor />
        </MilkdownProvider>
      </div>
    </div>
  </div>
</template>

<style>
/* ── Swiss editorial paper area ── */
.editor-paper-wrapper {
  max-width: 820px;
  margin: 34px auto 72px;
  padding: 0;
  min-height: calc(100% - 68px);
}

.editor-paper-wrapper .milkdown {
  background: var(--surface-raised);
  padding: 54px 70px 120px;
  min-height: 100%;
  border: 1px solid var(--line);
  box-shadow: var(--shadow-high);
  line-height: 1.72;
  font-size: 16px;
  color: #222321;
  outline: none;
}

/* ── Headings ── */
.editor-paper-wrapper .milkdown h1 {
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 900;
  line-height: 0.98;
  margin: 0 0 0.65em;
  padding-bottom: 0.35em;
  border-bottom: 1px solid var(--line-strong);
  color: var(--ink);
  text-transform: uppercase;
}

.editor-paper-wrapper .milkdown h2 {
  font-size: 28px;
  font-weight: 850;
  line-height: 1.05;
  margin: 1.35em 0 0.45em;
  color: var(--ink);
}

.editor-paper-wrapper .milkdown h3 {
  font-size: 20px;
  font-weight: 800;
  margin: 1.1em 0 0.35em;
  color: var(--ink);
}

.editor-paper-wrapper .milkdown h4 {
  font-size: 16px;
  font-weight: 800;
  margin: 0.6em 0 0.3em;
  color: var(--charcoal);
  text-transform: uppercase;
}

.editor-paper-wrapper .milkdown h5,
.editor-paper-wrapper .milkdown h6 {
  font-size: 1em;
  font-weight: 750;
  margin: 0.5em 0 0.2em;
  color: var(--muted);
}

/* ── Paragraph ── */
.editor-paper-wrapper .milkdown p {
  margin: 0.7em 0;
}

/* ── Inline Code ── */
.editor-paper-wrapper .milkdown code {
  background: #f1f1ef;
  border: 1px solid var(--line);
  border-radius: 3px;
  padding: 2px 6px;
  font-family: 'SF Mono', 'Fira Code', Menlo, Consolas, monospace;
  font-size: 0.9em;
  color: var(--danger);
}

/* ── Code Blocks ── */
.editor-paper-wrapper .milkdown pre {
  background: var(--charcoal);
  border-radius: 6px;
  padding: 18px 20px;
  overflow-x: auto;
  margin: 1.2em 0;
  box-shadow: var(--shadow-low);
}

.editor-paper-wrapper .milkdown pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #cdd6f4;
}

/* ── Blockquote ── */
.editor-paper-wrapper .milkdown blockquote {
  margin: 1.15em 0;
  padding: 8px 18px;
  border-left: 3px solid var(--indigo);
  background: #f4f3f0;
  color: var(--charcoal);
}

/* ── Lists ── */
.editor-paper-wrapper .milkdown ul,
.editor-paper-wrapper .milkdown ol {
  padding-left: 1.8em;
  margin: 0.5em 0;
}

.editor-paper-wrapper .milkdown li {
  margin: 0.2em 0;
}

/* ── Links ── */
.editor-paper-wrapper .milkdown a {
  color: var(--indigo);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.editor-paper-wrapper .milkdown a:hover {
  color: var(--teal);
}

/* ── Tables ── */
.editor-paper-wrapper .milkdown table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.25em 0;
  font-size: 14px;
  border-top: 1px solid var(--line-strong);
  border-bottom: 1px solid var(--line-strong);
}

.editor-paper-wrapper .milkdown th {
  padding: 9px 12px;
  border: 1px solid var(--line);
  font-weight: 800;
  text-align: left;
  background: #f0f0ed;
  color: var(--ink);
}

.editor-paper-wrapper .milkdown td {
  padding: 8px 12px;
  border: 1px solid var(--line);
}

.editor-paper-wrapper .milkdown tr:nth-child(even) td {
  background: #fafaf8;
}

/* ── Horizontal Rule ── */
.editor-paper-wrapper .milkdown hr {
  border: none;
  border-top: 1px solid var(--line-strong);
  margin: 2em 0;
}

/* ── ProseMirror cursor / selection ── */
.editor-paper-wrapper .milkdown .ProseMirror {
  outline: none;
  min-height: 300px;
}

.editor-paper-wrapper .milkdown .ProseMirror:focus {
  outline: none;
}

@media (max-width: 760px) {
  .editor-paper-wrapper {
    margin: 18px 14px 48px;
  }

  .editor-paper-wrapper .milkdown {
    padding: 34px 26px 80px;
  }
}
</style>

<!-- Toolbar button styles (scoped would require deep selectors, so use global) -->
<style>
.toolbar-btn {
  min-height: 26px;
  padding: 0 9px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 650;
  color: var(--muted);
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s, box-shadow 0.15s;
  white-space: nowrap;
  border: 1px solid var(--line);
  background: #f4f4f2;
  font-family: inherit;
}

.toolbar-btn:hover {
  background: #fff;
  color: var(--ink);
  box-shadow: var(--shadow-low);
}

.toolbar-btn:active {
  background: #e8e8e4;
}
</style>
