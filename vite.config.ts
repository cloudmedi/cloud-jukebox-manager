import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
      exclude: ['jspdf']
    },
    rollupOptions: {
      output: {
        manualChunks: {
          jspdf: ['jspdf', 'jspdf-autotable']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable'],
    exclude: ['jspdf']
  }
}));