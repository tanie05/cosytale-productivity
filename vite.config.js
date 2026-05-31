import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'fix-extension-html',
      apply: 'build',
      transformIndexHtml(html) {
        return html
          .replace(/type="module"\s+/g, '')
          .replace(/\s*crossorigin/g, '')
          .replace(/<script src=/g, '<script defer src=')
      },
    },
  ],
  base: './',
  build: {
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'assets/index.js',
        assetFileNames: '[name][extname]',
      },
    },
  },
})
