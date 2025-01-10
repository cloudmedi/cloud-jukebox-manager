import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'jspdf': ['jspdf', 'jspdf-autotable']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable']
  }
})