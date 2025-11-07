import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: Ändra 'mastermind' här om ditt repo heter något annat.
export default defineConfig({
  plugins: [react()],
  base: '/mastermind/'
})
