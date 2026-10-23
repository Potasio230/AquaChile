import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
})
