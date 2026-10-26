// Browser-only native boundary for end-to-end UI regression, never shipped.
(() => {
  const callbacks = new Map()
  const listeners = new Map()
  let next = 0
  window.__TAURI_EVENT_PLUGIN_INTERNALS__ = {
    unregisterListener(_event, id) {
      const listener = listeners.get(id)
      if (listener) callbacks.delete(listener.handler)
      listeners.delete(id)
    },
  }
  window.__desktopTest = {
    files: {
      'C:\\Documents\\深圳故事.md': '---\ntitle: \nsubtitle: \n---\n\n# 深圳故事\n\n中文正文。\n\n**加粗**\n\n---\n',
      'C:\\Documents\\数据表.md': '# 数据表\n\n| 项目 | 数量 |\n| --- | ---: |\n| 深圳 | 12 |\n',
    },
    writes: [], exports: [], prints: [], openCalls: [], saveCalls: [],
    openPaths: ['C:\\Documents\\深圳故事.md', 'C:\\Documents\\数据表.md'],
    savePath: 'C:\\Exports\\文档.docx',
    failWrites: false, destroyed: false, quit: false,
    emit(event, payload) {
      for (const [id, listener] of listeners) {
        if (listener.event === event) callbacks.get(listener.handler)?.({ event, id, payload })
      }
    },
  }
  window.__TAURI_INTERNALS__ = {
    metadata: { currentWindow: { label: 'main' }, currentWebview: { label: 'main' } },
    transformCallback(fn) { const id = ++next; callbacks.set(id, fn); return id },
    unregisterCallback(id) { callbacks.delete(id) },
    async invoke(command, args) {
      const state = window.__desktopTest
      if (command === 'get_language') return 'zh-CN'
      if (command === 'initial_files') return []
      if (command === 'resolve_file_path') return args.path
      if (command === 'read_file') {
        if (!(args.path in state.files)) throw new Error('File not found')
        return state.files[args.path]
      }
      if (command === 'save_file') {
        if (state.failWrites) throw new Error('disk full')
        state.writes.push({ ...args }); state.files[args.path] = args.content; return
      }
      if (command === 'plugin:dialog|open') { state.openCalls.push(args); return state.openPaths }
      if (command === 'plugin:dialog|save') { state.saveCalls.push(args); return state.savePath }
      if (command === 'export_docx' || command === 'export_xlsx') { state.exports.push({ command, ...args }); return args.outputPath }
      if (command === 'print_webview') {
        state.prints.push({ title: document.title, html: document.getElementById('md-quicklook-print-root').innerHTML }); return
      }
      if (command === 'plugin:event|listen') { const id = ++next; listeners.set(id, args); return id }
      if (command === 'plugin:event|unlisten') { listeners.delete(args.eventId); return }
      if (command === 'plugin:window|destroy') { state.destroyed = true; return }
      if (command === 'quit_app') { state.quit = true; return }
      throw new Error(`Unhandled test IPC: ${command}`)
    },
  }
})()
