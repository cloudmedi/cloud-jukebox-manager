import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync, mkdirSync } from 'fs'

// Helper function to copy services
function copyServices() {
  return {
    name: 'copy-services',
    closeBundle() {
      const servicesDir = path.join(__dirname, 'src/main/services')
      const outDir = path.join(__dirname, 'out/main/services')
      
      // Create services directory in output if it doesn't exist
      try {
        mkdirSync(outDir, { recursive: true })
      } catch (err) {
        if (err.code !== 'EEXIST') throw err
      }

      // Copy service files
      copyFileSync(
        path.join(servicesDir, 'apiService.js'),
        path.join(outDir, 'apiService.js')
      )
      copyFileSync(
        path.join(servicesDir, 'deviceService.js'),
        path.join(outDir, 'deviceService.js')
      )
    }
  }
}

export default defineConfig({
  main: {
    plugins: [copyServices()],
    build: {
      outDir: 'out/main',
      rollupOptions: {
        external: [
          'electron',
          'electron-store',
          'os',
          'path',
          'axios',
          'systeminformation',
          'uuid',
          'sonner',
          'node-fetch',
          'fs-extra',
          'crypto',
          'clsx',
          'tailwind-merge',
          'lucide-react',
          'bufferutil',
          'utf-8-validate',
          'ws'
        ]
      }
    }
  },
  preload: {
    build: {
      outDir: 'out/preload'
    }
  },
  renderer: {
    root: '.',
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: {
          index: path.join(__dirname, 'index.html')
        }
      }
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    }
  }
})