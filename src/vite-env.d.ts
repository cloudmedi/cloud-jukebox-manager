/// <reference types="vite/client" />

interface Window {
  electron: {
    captureScreenshot: () => Promise<string>;
  }
}