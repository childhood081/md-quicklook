import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
}

const toasts = ref<Toast[]>([])
let nextId = 0
const DEFAULT_DURATION = 4000

export function useToast() {
  function show(message: string, type: Toast['type'] = 'info', duration = DEFAULT_DURATION) {
    const id = nextId++
    toasts.value.push({ id, message, type })
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function error(message: string, duration?: number) {
    return show(message, 'error', duration ?? 6000)
  }

  function success(message: string, duration?: number) {
    return show(message, 'success', duration)
  }

  function warning(message: string, duration?: number) {
    return show(message, 'warning', duration)
  }

  return { toasts, show, dismiss, error, success, warning }
}
