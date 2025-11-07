import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Viktigt: base ska matcha repo-namnet på GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: '/mastermind/'
})
