import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync, mkdirSync } from 'fs'

function copyServices() {
  return {
    name: 'copy-services',
    closeBundle() {
      const servicesDir = path.join(__dirname, 'src/main/services')
      const outDir = path.join(__dirname, 'out/main/services')
      
      try {
        mkdirSync(outDir, { recursive: true })
      } catch (err) {
        if (err.code !== 'EEXIST') throw err
      }

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