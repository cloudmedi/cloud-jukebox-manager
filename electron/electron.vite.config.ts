import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve('src')
    }
  },
  plugins: [
    electron([
      {
        // Main process
        entry: 'electron/src/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main'
          }
        }
      },
      {
        // Preload process
        entry: 'electron/src/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron/preload'
          }
        }
      }
    ]),
    renderer()
  ]
});