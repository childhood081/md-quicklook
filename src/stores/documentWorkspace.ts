import { computed, ref } from 'vue'

export type AppMode = 'reading' | 'editing' | 'source'
export type SaveStatus = 'idle' | 'waiting' | 'saving' | 'saved' | 'error'

export interface DocumentSession {
  id: string
  filePath: string
  currentContent: string
  originalContent: string
  mode: AppMode
  zoomLevel: number
  saveStatus: SaveStatus
  lastError: string
  closing: boolean
}

interface WorkspaceIO {
  resolvePath?: (path: string) => Promise<string>
  read(path: string): Promise<string>
  write(path: string, content: string): Promise<unknown>
  loadRecent?: () => unknown
  persistRecent?: (paths: string[]) => void
}

export function documentName(path: string): string {
  return path.replace(/\\/g, '/').split('/').pop() || 'Untitled.md'
}

function pathKey(path: string): string {
  const normalized = path.replace(/^\\\\\?\\UNC\\/i, '\\\\').replace(/^\\\\\?\\/, '').replace(/\\/g, '/')
  return /^[a-z]:\//i.test(normalized) || normalized.startsWith('//')
    ? normalized.toLowerCase()
    : normalized
}

/** Own document state independently of whichever editor happens to be mounted. */
export function createDocumentWorkspace(io: WorkspaceIO, debounceMs = 800) {
  const documents = ref<DocumentSession[]>([])
  const activeDocumentId = ref('')
  const activeDocument = computed(() => documents.value.find((doc) => doc.id === activeDocumentId.value))
  const recentFiles = ref<string[]>([])
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  const saves = new Map<string, Promise<void>>()
  const loads = new Map<string, Promise<DocumentSession>>()
  const closes = new Map<string, Promise<void>>()
  const saveAsOperations = new Map<string, Promise<void>>()
  const reservedPaths = new Map<string, string>()
  let nextId = 0
  let selectionVersion = 0

  try {
    const stored = io.loadRecent?.()
    if (Array.isArray(stored)) {
      recentFiles.value = [...new Set(stored.filter((path): path is string => typeof path === 'string'))].slice(0, 10)
    }
  } catch {
    // History is optional; inaccessible settings must not prevent opening files.
  }

  function remember(path: string) {
    recentFiles.value = [path, ...recentFiles.value.filter((item) => pathKey(item) !== pathKey(path))].slice(0, 10)
    try { io.persistRecent?.([...recentFiles.value]) } catch { /* History is best-effort. */ }
  }

  function clearTimer(doc: DocumentSession) {
    const timer = timers.get(doc.id)
    if (timer) clearTimeout(timer)
    timers.delete(doc.id)
  }

  function setStatus(doc: DocumentSession, status: SaveStatus) {
    doc.saveStatus = status
    if (status !== 'error') doc.lastError = ''
  }

  function saveDocument(doc: DocumentSession, force = false): Promise<void> {
    clearTimer(doc)
    const pending = saves.get(doc.id)
    if (pending) return pending
    if (!force && doc.currentContent === doc.originalContent) return Promise.resolve()

    // Capture the session, not activeDocument: a tab switch cannot redirect a write.
    const run = async () => {
      try {
        do {
          const content = doc.currentContent
          setStatus(doc, 'saving')
          await io.write(doc.filePath, content)
          doc.originalContent = content
          if (doc.currentContent === content) break
        } while (true)
        setStatus(doc, 'saved')
      } catch (error) {
        doc.lastError = error instanceof Error ? error.message : String(error)
        doc.saveStatus = 'error'
        throw error
      }
    }
    const task = run().finally(() => {
      if (saves.get(doc.id) === task) saves.delete(doc.id)
    })
    saves.set(doc.id, task)
    return task
  }

  function setContent(content: string, id = activeDocumentId.value) {
    const doc = documents.value.find((item) => item.id === id)
    if (!doc || doc.closing || content === doc.currentContent) return
    doc.currentContent = content
    clearTimer(doc)
    setStatus(doc, saves.has(doc.id) ? 'saving' : content === doc.originalContent ? 'saved' : 'waiting')
    if (content !== doc.originalContent) {
      timers.set(doc.id, setTimeout(() => {
        void saveDocument(doc).catch(() => { /* The tab retains its error and edits. */ })
      }, debounceMs))
    }
  }

  function selectDocument(id: string) {
    if (!documents.value.some((doc) => doc.id === id)) return
    selectionVersion++
    activeDocumentId.value = id
  }

  async function loadFile(path: string) {
    const version = ++selectionVersion
    const reservedBy = reservedPaths.get(pathKey(path))
    if (reservedBy) await saveAsOperations.get(reservedBy)
    if (io.resolvePath) path = await io.resolvePath(path)
    const key = pathKey(path)
    const canonicalReservation = reservedPaths.get(key)
    if (canonicalReservation) await saveAsOperations.get(canonicalReservation)
    let doc = documents.value.find((item) => pathKey(item.filePath) === key)
    if (doc && closes.has(doc.id)) {
      await closes.get(doc.id)
      doc = documents.value.find((item) => pathKey(item.filePath) === key)
    }
    if (!doc) {
      let pending = loads.get(key)
      if (!pending) {
        pending = (async () => {
          const content = await io.read(path)
          documents.value.push({
            id: `document-${++nextId}`, filePath: path, currentContent: content,
            originalContent: content, mode: 'reading', zoomLevel: 1,
            saveStatus: 'saved', lastError: '', closing: false,
          })
          return documents.value[documents.value.length - 1]!
        })()
        loads.set(key, pending)
      }
      try { doc = await pending } finally {
        if (loads.get(key) === pending) loads.delete(key)
      }
    }
    if (version === selectionVersion || !activeDocument.value) activeDocumentId.value = doc.id
    remember(doc.filePath)
  }

  async function saveFile() {
    const doc = activeDocument.value
    if (doc) {
      const savingAs = saveAsOperations.get(doc.id)
      if (savingAs) await savingAs
      await saveDocument(doc)
    }
  }

  async function manualSave() {
    const doc = activeDocument.value
    if (doc) {
      const savingAs = saveAsOperations.get(doc.id)
      if (savingAs) await savingAs
      await saveDocument(doc, true)
    }
  }

  async function flushAll() {
    for (const doc of [...documents.value]) {
      const savingAs = saveAsOperations.get(doc.id)
      if (savingAs) await savingAs
      await saveDocument(doc)
    }
  }

  function isPathOpenElsewhere(path: string, id: string): boolean {
    const key = pathKey(path)
    return documents.value.some((doc) => doc.id !== id && pathKey(doc.filePath) === key)
      || (reservedPaths.has(key) && reservedPaths.get(key) !== id)
      || loads.has(key)
  }

  function saveFileAs(path: string, id: string): Promise<void> {
    const doc = documents.value.find((item) => item.id === id)
    if (!doc) return Promise.resolve()
    if (doc.closing) return Promise.reject(new Error('A file operation is already in progress'))
    if (isPathOpenElsewhere(path, id)) return Promise.reject(new Error('The destination is already open in another tab'))
    doc.closing = true
    clearTimer(doc)
    let key = pathKey(path)
    reservedPaths.set(key, id)
    const task = (async () => {
      try {
        await saves.get(id)
        if (io.resolvePath) {
          const resolved = await io.resolvePath(path)
          if (isPathOpenElsewhere(resolved, id)) throw new Error('The destination is already open in another tab')
          reservedPaths.delete(key)
          path = resolved
          key = pathKey(path)
          reservedPaths.set(key, id)
        }
        const content = doc.currentContent
        setStatus(doc, 'saving')
        await io.write(path, content)
        doc.filePath = path
        doc.originalContent = content
        setStatus(doc, 'saved')
        remember(path)
      } catch (error) {
        doc.lastError = error instanceof Error ? error.message : String(error)
        doc.saveStatus = 'error'
        throw error
      } finally {
        doc.closing = false
        reservedPaths.delete(key)
        saveAsOperations.delete(id)
      }
    })()
    saveAsOperations.set(id, task)
    return task
  }

  function closeFile(id = activeDocumentId.value): Promise<void> {
    const doc = documents.value.find((item) => item.id === id)
    if (!doc) return Promise.resolve()
    const savingAs = saveAsOperations.get(id)
    if (savingAs) return savingAs.then(() => closeFile(id))
    const pending = closes.get(id)
    if (pending) return pending
    doc.closing = true
    const task = (async () => {
      try {
        await saveDocument(doc)
        const index = documents.value.findIndex((item) => item.id === id)
        documents.value.splice(index, 1)
        if (activeDocumentId.value === id) {
          activeDocumentId.value = documents.value[Math.min(index, documents.value.length - 1)]?.id ?? ''
        }
      } finally {
        doc.closing = false
        closes.delete(id)
      }
    })()
    closes.set(id, task)
    return task
  }

  function setMode(mode: AppMode) {
    if (activeDocument.value) activeDocument.value.mode = mode
  }

  function setZoom(value: number) {
    if (activeDocument.value) activeDocument.value.zoomLevel = Math.min(2, Math.max(0.5, Math.round(value * 10) / 10))
  }

  function dispose() {
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
  }

  return {
    documents, activeDocumentId, activeDocument, recentFiles,
    filePath: computed(() => activeDocument.value?.filePath ?? ''),
    fileName: computed(() => documentName(activeDocument.value?.filePath ?? '')),
    currentContent: computed(() => activeDocument.value?.currentContent ?? ''),
    originalContent: computed(() => activeDocument.value?.originalContent ?? ''),
    mode: computed(() => activeDocument.value?.mode ?? 'reading'),
    zoomLevel: computed(() => activeDocument.value?.zoomLevel ?? 1),
    saveStatus: computed(() => activeDocument.value?.saveStatus ?? 'idle'),
    lastError: computed(() => activeDocument.value?.lastError ?? ''),
    isModified: computed(() => !!activeDocument.value && activeDocument.value.currentContent !== activeDocument.value.originalContent),
    hasPendingSaves: computed(() => documents.value.some((doc) => doc.saveStatus === 'saving' || doc.currentContent !== doc.originalContent)),
    loadFile, selectDocument, setContent, setMode, saveFile, manualSave, closeFile, flushAll,
    saveFileAs, isPathOpenElsewhere,
    zoomIn: () => setZoom((activeDocument.value?.zoomLevel ?? 1) + 0.1),
    zoomOut: () => setZoom((activeDocument.value?.zoomLevel ?? 1) - 0.1),
    resetZoom: () => setZoom(1), dispose,
  }
}
