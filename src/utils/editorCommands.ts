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
