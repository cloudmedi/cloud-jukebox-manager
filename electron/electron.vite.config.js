const { defineConfig } = require('electron-vite');
const { resolve } = require('path');
const react = require('@vitejs/plugin-react-swc');

module.exports = defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['electron', 'electron-store'],
        input: {
          index: resolve(__dirname, 'src/main/index.js')
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/main')
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  renderer: {
    root: '.',
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html')
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer')
      }
    },
    plugins: [react()]
  }
});