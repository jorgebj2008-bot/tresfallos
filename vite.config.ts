/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// "npm run build:demo" genera un único HTML con todo dentro (para la página de pruebas).
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'demo' ? [viteSingleFile()] : [])],
  base: './',
  build: mode === 'demo' ? { outDir: 'dist-demo' } : {},
  server: { host: true },
  test: { environment: 'node' },
}))
