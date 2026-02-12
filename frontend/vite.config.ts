import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration for React + TypeScript frontend
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: ["frontend"],
    host: true,
  },
})
