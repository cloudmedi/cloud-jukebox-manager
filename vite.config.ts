import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    rollupOptions: {
      external: ['jspdf', 'jspdf-autotable'],
      output: {
        globals: {
          jspdf: 'jsPDF',
          'jspdf-autotable': 'jspdf-autotable'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})