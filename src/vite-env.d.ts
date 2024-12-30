/// <reference types="vite/client" />

interface Window {
  electron: {
    captureScreen: () => Promise<string>;
  }
}