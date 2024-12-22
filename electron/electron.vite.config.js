const { defineConfig } = require('electron-vite')
const react = require('@vitejs/plugin-react-swc')
const path = require('path')

module.exports = defineConfig({
  main: {
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