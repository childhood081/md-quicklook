import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss()],
  // Prevent vite from obscuring Rust errors
  clearScreen: false,
  server: {
    strictPort: true,
  },
})
