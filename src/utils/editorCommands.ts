export type EditorCommand =
  | 'undo'
  | 'redo'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'selectAll'
  | 'find'

export type EditorCommandHandler = (command: EditorCommand) => boolean | Promise<boolean>

let activeHandler: EditorCommandHandler | null = null
let activeFlush: (() => void) | null = null

export function registerEditorFlushHandler(handler: () => void): () => void {
  activeFlush = handler
  return () => { if (activeFlush === handler) activeFlush = null }
}

export function flushEditorChanges() {
  activeFlush?.()
}

export function registerEditorCommandHandler(handler: EditorCommandHandler): () => void {
  activeHandler = handler
  return () => {
    if (activeHandler === handler) {
      activeHandler = null
    }
  }
}

export async function runEditorCommand(command: EditorCommand): Promise<boolean> {
  if (!activeHandler) return false
  return Boolean(await activeHandler(command))
}
