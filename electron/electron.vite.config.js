const { defineConfig } = require('electron-vite');
const { resolve } = require('path');
const react = require('@vitejs/plugin-react-swc');

module.exports = defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.js')
        },
        external: ['electron', 'electron-store']
      },
      outDir: 'out/main',
      lib: {
        entry: 'src/main/index.js',
        formats: ['cjs']
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.js')
        },
        external: ['electron']
      },
      outDir: 'out/preload'
    }
  },
  renderer: {
    root: '.',
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html')
        }
      },
      outDir: 'out/renderer'
    },
    plugins: [react()]
  }
});