<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { toasts, dismiss } = useToast()

const typeStyles: Record<string, string> = {
  info: 'toast-info',
  success: 'toast-success',
  error: 'toast-error',
  warning: 'toast-warning',
}

const typeIcons: Record<string, string> = {
  info: 'i',
  success: '✓',
  error: '✕',
  warning: '!',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="typeStyles[toast.type]"
        class="toast-card pointer-events-auto flex max-w-sm cursor-pointer items-center gap-2 px-3 py-2 text-[12px] font-bold animate-slide-in"
        @click="dismiss(toast.id)"
      >
        <span class="toast-icon flex-shrink-0">
          {{ typeIcons[toast.type] }}
        </span>
        <span>{{ toast.message }}</span>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: rgba(251, 251, 250, 0.96);
  box-shadow: var(--shadow-mid);
  color: var(--ink);
}

.toast-icon {
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: #fff;
  font-size: 11px;
  line-height: 1;
}

.toast-info .toast-icon { background: var(--slate); }
.toast-success .toast-icon { background: var(--teal); }
.toast-error .toast-icon { background: var(--danger); }
.toast-warning .toast-icon { background: var(--gold); color: var(--ink); }

.animate-slide-in {
  animation: slideIn 0.25s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(60px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
