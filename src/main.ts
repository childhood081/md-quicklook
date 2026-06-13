import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from './i18n'
import App from './App.vue'
import './style.css'

function showStartupError(error: unknown) {
  const root = document.querySelector<HTMLDivElement>('#app')
  if (!root) return

  const message = error instanceof Error ? error.message : String(error)
  root.textContent = ''

  const shell = document.createElement('div')
  shell.style.cssText = [
    'min-height:100vh',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'padding:32px',
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    'background:#f4f4f2',
    'color:#111214',
  ].join(';')

  const panel = document.createElement('div')
  panel.style.cssText = [
    'max-width:560px',
    'border:1px solid #d8d8d2',
    'background:#fff',
    'padding:28px',
    'box-shadow:0 16px 40px rgba(0,0,0,.08)',
  ].join(';')

  const title = document.createElement('h1')
  title.textContent = '应用启动失败'
  title.style.cssText = 'margin:0 0 12px;font-size:18px'

  const subtitle = document.createElement('p')
  subtitle.textContent = 'Application failed to start.'
  subtitle.style.cssText = 'margin:0 0 8px;font-size:13px;line-height:1.7'

  const detail = document.createElement('pre')
  detail.textContent = message
  detail.style.cssText = 'white-space:pre-wrap;font-size:12px;line-height:1.6;color:#7f1d1d'

  panel.append(title, subtitle, detail)
  shell.append(panel)
  root.append(shell)
}

try {
  const app = createApp(App)
  app.use(createPinia())
  app.use(i18n)
  app.mount('#app')
} catch (error) {
  console.error('Application startup failed:', error)
  showStartupError(error)
}
