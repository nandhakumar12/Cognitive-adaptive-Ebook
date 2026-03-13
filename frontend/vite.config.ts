import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 3000,
      allowedHosts: true,
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    test: {
      coverage: {
        provider: 'v8',
        reporter: ['lcov', 'text'],
        reportsDirectory: './coverage',
      },
    },
  };
})
