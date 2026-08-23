import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // Относительные пути работают на любом имени репозитория GitHub Pages
})
