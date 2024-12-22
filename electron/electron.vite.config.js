import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: {
          index: path.join(__dirname, 'src/main/index.js')
        },
        external: [
          'electron',
          'electron-store',
          'os',
          'path',
          'axios',
          'systeminformation',
          'uuid'
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
      outDir: 'out/renderer'
    },
    plugins: [react()]
  }
})