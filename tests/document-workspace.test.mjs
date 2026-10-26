import test from 'node:test'
import assert from 'node:assert/strict'
import { setTimeout as delay } from 'node:timers/promises'
import { createDocumentWorkspace, documentName } from '../src/stores/documentWorkspace.ts'
import { flushEditorChanges, registerEditorFlushHandler } from '../src/utils/editorCommands.ts'

function deferred() {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function workspace(t, overrides = {}, debounce = 60_000) {
  const writes = []
  const w = createDocumentWorkspace({
    read: async (path) => `# ${path}`,
    write: async (path, content) => { writes.push({ path, content }) },
    ...overrides,
  }, debounce)
  t.after(w.dispose)
  return { w, writes }
}

test('tabs preserve each document, mode and zoom; reopening does not reload or overwrite edits', async (t) => {
  let reads = 0
  const { w, writes } = workspace(t, { read: async (path) => { reads++; return path } })
  await w.loadFile('/a.md')
  const a = w.activeDocumentId.value
  w.setContent('A edited')
  w.setMode('source')
  w.zoomIn()
  await w.loadFile('/b.md')
  assert.equal(w.documents.value.length, 2)
  await w.loadFile('/a.md')
  assert.equal(w.activeDocumentId.value, a)
  assert.equal(w.currentContent.value, 'A edited')
  assert.equal(w.mode.value, 'source')
  assert.equal(w.zoomLevel.value, 1.1)
  assert.equal(reads, 2)
  assert.deepEqual(writes, [])
})

test('save in flight remains bound to its tab and writes latest edits last', async (t) => {
  const gate = deferred()
  const writes = []
  const { w } = workspace(t, { write: async (path, content) => {
    writes.push({ path, content })
    if (writes.length === 1) await gate.promise
  } })
  await w.loadFile('/a.md')
  const a = w.activeDocumentId.value
  w.setContent('A first')
  const saving = w.manualSave()
  await w.loadFile('/b.md')
  w.setContent('A latest', a)
  gate.resolve()
  await saving
  assert.deepEqual(writes, [{ path: '/a.md', content: 'A first' }, { path: '/a.md', content: 'A latest' }])
  assert.equal(w.currentContent.value, '# /b.md')
  assert.equal(w.documents.value[0].originalContent, 'A latest')
})

test('background tabs still autosave, without writing the newly active tab', async (t) => {
  const { w, writes } = workspace(t, {}, 10)
  await w.loadFile('/a.md')
  w.setContent('background')
  await w.loadFile('/b.md')
  await delay(35)
  assert.deepEqual(writes, [{ path: '/a.md', content: 'background' }])
})

test('autosave and manual save share a single in-flight writer', async (t) => {
  const gate = deferred()
  let concurrent = 0, maxConcurrent = 0
  const { w } = workspace(t, { write: async () => {
    maxConcurrent = Math.max(maxConcurrent, ++concurrent)
    await gate.promise
    concurrent--
  } }, 5)
  await w.loadFile('/a.md')
  w.setContent('changed')
  await delay(15)
  const one = w.manualSave(), two = w.saveFile()
  gate.resolve()
  await Promise.all([one, two])
  assert.equal(maxConcurrent, 1)
  assert.equal(w.saveStatus.value, 'saved')
})

test('closing the last document saves first, keeps history and returns to welcome state', async (t) => {
  const { w, writes } = workspace(t)
  await w.loadFile('/中文.md')
  w.setContent('latest')
  await w.closeFile()
  assert.deepEqual(writes, [{ path: '/中文.md', content: 'latest' }])
  assert.equal(w.documents.value.length, 0)
  assert.equal(w.filePath.value, '')
  assert.equal(w.currentContent.value, '')
  assert.deepEqual(w.recentFiles.value, ['/中文.md'])
  await w.loadFile('/中文.md')
  assert.equal(w.documents.value.length, 1)
})

test('failed close retains the tab and edits; successful retry closes it', async (t) => {
  let fail = true
  const { w } = workspace(t, { write: async () => { if (fail) throw new Error('disk full') } })
  await w.loadFile('/a.md')
  w.setContent('do not lose')
  await assert.rejects(w.closeFile(), /disk full/)
  assert.equal(w.currentContent.value, 'do not lose')
  assert.equal(w.documents.value.length, 1)
  assert.equal(w.activeDocument.value.closing, false)
  assert.equal(w.saveStatus.value, 'error')
  fail = false
  await w.closeFile()
  assert.equal(w.documents.value.length, 0)
})

test('closing waits for in-flight save and cannot accept content after closing begins', async (t) => {
  const gate = deferred()
  const { w } = workspace(t, { write: async () => gate.promise })
  await w.loadFile('/a.md')
  w.setContent('saved on close')
  const saving = w.manualSave()
  const closing = w.closeFile()
  w.setContent('late ignored input')
  assert.equal(w.documents.value.length, 1)
  assert.equal(w.currentContent.value, 'saved on close')
  gate.resolve()
  await Promise.all([saving, closing])
  assert.equal(w.documents.value.length, 0)
})

test('closing a background tab does not change the active tab', async (t) => {
  const { w } = workspace(t)
  await w.loadFile('/a.md')
  const a = w.activeDocumentId.value
  await w.loadFile('/b.md')
  const b = w.activeDocumentId.value
  await w.closeFile(a)
  assert.equal(w.activeDocumentId.value, b)
})

test('overlapping opens create both tabs but select the last requested file', async (t) => {
  const a = deferred(), b = deferred()
  const { w } = workspace(t, { read: (path) => path === '/a.md' ? a.promise : b.promise })
  const first = w.loadFile('/a.md'), second = w.loadFile('/b.md')
  b.resolve('B')
  await second
  a.resolve('A')
  await first
  assert.equal(w.documents.value.length, 2)
  assert.equal(w.currentContent.value, 'B')
})

test('duplicate concurrent opens read once and create one tab', async (t) => {
  const gate = deferred()
  let reads = 0
  const { w } = workspace(t, { read: async () => { reads++; return gate.promise } })
  const first = w.loadFile('/a.md'), second = w.loadFile('/a.md')
  gate.resolve('A')
  await Promise.all([first, second])
  assert.equal(reads, 1)
  assert.equal(w.documents.value.length, 1)
})

test('failed open never clears an existing modified document', async (t) => {
  const { w } = workspace(t, { read: async (path) => {
    if (path === '/missing.md') throw new Error('not found')
    return 'A'
  } })
  await w.loadFile('/a.md')
  w.setContent('keep')
  await assert.rejects(w.loadFile('/missing.md'), /not found/)
  assert.equal(w.currentContent.value, 'keep')
})

test('Windows separators, case and extended paths reuse the existing tab', async (t) => {
  const { w } = workspace(t)
  await w.loadFile('C:\\Users\\张三\\文档.md')
  await w.loadFile('c:/users/张三/文档.MD')
  await w.loadFile('\\\\?\\C:\\Users\\张三\\文档.md')
  assert.equal(w.documents.value.length, 1)
  assert.equal(documentName('C:\\Users\\张三\\文档.md'), '文档.md')
})

test('native canonical paths prevent opening a file alias as a second writer', async (t) => {
  const { w } = workspace(t, { resolvePath: async () => '/real/document.md' })
  await w.loadFile('/alias/document.md')
  w.setContent('keep edits')
  await w.loadFile('/real/document.md')
  assert.equal(w.documents.value.length, 1)
  assert.equal(w.currentContent.value, 'keep edits')
})

test('empty content is saved deliberately without extra backup writes', async (t) => {
  const { w, writes } = workspace(t)
  await w.loadFile('/a.md')
  w.setContent('')
  await w.manualSave()
  assert.deepEqual(writes, [{ path: '/a.md', content: '' }])
})

test('Save As retargets only its own tab and cancels the old-path debounce', async (t) => {
  const { w, writes } = workspace(t, {}, 10)
  await w.loadFile('/a.md')
  const a = w.activeDocumentId.value
  w.setContent('A edit')
  await w.loadFile('/b.md')
  await w.saveFileAs('/new.md', a)
  await delay(25)
  assert.deepEqual(writes, [{ path: '/new.md', content: 'A edit' }])
  assert.equal(w.filePath.value, '/b.md')
  assert.equal(w.documents.value[0].filePath, '/new.md')
})

test('Save As cannot overwrite another open tab', async (t) => {
  const { w, writes } = workspace(t)
  await w.loadFile('/a.md')
  const a = w.activeDocumentId.value
  await w.loadFile('/b.md')
  await assert.rejects(w.saveFileAs('/b.md', a), /already open/)
  assert.deepEqual(writes, [])
})

test('failed Save As preserves original path, edits and error', async (t) => {
  const { w } = workspace(t, { write: async () => { throw new Error('denied') } })
  await w.loadFile('/a.md')
  w.setContent('keep edits')
  await assert.rejects(w.saveFileAs('/new.md', w.activeDocumentId.value), /denied/)
  assert.equal(w.filePath.value, '/a.md')
  assert.equal(w.currentContent.value, 'keep edits')
  assert.equal(w.isModified.value, true)
  assert.equal(w.activeDocument.value.closing, false)
})

test('opening a Save As destination waits and reuses the retargeted tab', async (t) => {
  const gate = deferred()
  const { w } = workspace(t, { write: async () => gate.promise })
  await w.loadFile('/a.md')
  w.setContent('new destination')
  const saving = w.saveFileAs('/new.md', w.activeDocumentId.value)
  const opening = w.loadFile('/new.md')
  gate.resolve()
  await Promise.all([saving, opening])
  assert.equal(w.documents.value.length, 1)
  assert.equal(w.filePath.value, '/new.md')
  assert.equal(w.currentContent.value, 'new destination')
})

test('closing during Save As waits for its write instead of saving to the old path', async (t) => {
  const gate = deferred()
  const writes = []
  const { w } = workspace(t, { write: async (path) => { writes.push(path); await gate.promise } })
  await w.loadFile('/a.md')
  w.setContent('content')
  const saving = w.saveFileAs('/new.md', w.activeDocumentId.value)
  const closing = w.closeFile()
  gate.resolve()
  await Promise.all([saving, closing])
  assert.deepEqual(writes, ['/new.md'])
  assert.equal(w.documents.value.length, 0)
})

test('flushAll saves modified background tabs as well as the active document', async (t) => {
  const { w, writes } = workspace(t)
  await w.loadFile('/a.md')
  w.setContent('A')
  await w.loadFile('/b.md')
  w.setContent('B')
  await w.flushAll()
  assert.deepEqual(writes, [{ path: '/a.md', content: 'A' }, { path: '/b.md', content: 'B' }])
})

test('blocked or malformed history does not prevent opening or retaining history in memory', async (t) => {
  const { w } = workspace(t, {
    loadRecent: () => ({ broken: true }),
    persistRecent: () => { throw new Error('storage blocked') },
  })
  await w.loadFile('/a.md')
  await w.closeFile()
  assert.deepEqual(w.recentFiles.value, ['/a.md'])
})

test('disposing an old editor cannot unregister the newly active editor flusher', () => {
  const calls = []
  const old = registerEditorFlushHandler(() => calls.push('old'))
  const current = registerEditorFlushHandler(() => calls.push('current'))
  old()
  flushEditorChanges()
  current()
  flushEditorChanges()
  assert.deepEqual(calls, ['current'])
})
