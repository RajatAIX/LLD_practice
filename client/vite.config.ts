import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // Dev proxy: forward /api calls to backend (avoids CORS issues in dev)
        '/api': {
          target: env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false, // disable sourcemaps in production for security
    },
  }
})
