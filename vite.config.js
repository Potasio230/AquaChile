import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Destino del backend del Agente. No depende de VITE_API_URL (que puede venir
  // heredada del entorno del IDE): se fija acá y se puede sobrescribir con
  // VITE_API_PROXY_TARGET.
  const apiTarget = (env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8001').replace(/\/+$/, '')
  const apiProxy = { '/api': { target: apiTarget, changeOrigin: true } }
  console.log(`[vite] proxy /api -> ${apiTarget}`)

  return {
    plugins: [react()],
    server: { proxy: apiProxy },
    preview: { proxy: apiProxy },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        reportsDirectory: './coverage',
        include: [
          'src/utils/validation.js',
          'src/components/FormField.jsx',
          'src/components/FormStatus.jsx',
          'src/components/StatusBadge.jsx',
          'src/components/ProtectedRoute.jsx',
          'src/pages/HomePage.jsx',
          'src/pages/PostulacionPage.jsx',
          'src/pages/LoginPage.jsx',
        ],
      },
    },
  }
})
