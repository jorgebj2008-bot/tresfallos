/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { VitePWA } from 'vite-plugin-pwa'

// "npm run build" genera la web instalable (PWA) que se publica en Vercel.
// "npm run build:demo" genera un único HTML con todo dentro (para la página de pruebas).
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'demo'
      ? [viteSingleFile(), VitePWA({ disable: true, injectRegister: false })] // en la página de pruebas no hay app instalable
      : [
          VitePWA({
            registerType: 'prompt',
            injectRegister: false,
            includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
            manifest: {
              name: 'TresFallos · Aprueba el teórico',
              short_name: 'TresFallos',
              description: 'Aprueba el teórico del permiso B jugando.',
              lang: 'es',
              start_url: '/',
              display: 'standalone',
              orientation: 'portrait',
              background_color: '#FFE8A3',
              theme_color: '#FFE8A3',
              icons: [
                { src: 'icono-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icono-512.png', sizes: '512x512', type: 'image/png' },
                { src: 'icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
            // Todo el juego queda guardado en el móvil: funciona sin conexión.
            workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'], importScripts: ['sw-avisos.js'] },
          }),
        ]),
  ],
  base: mode === 'demo' ? './' : '/',
  build: mode === 'demo' ? { outDir: 'dist-demo' } : {},
  server: { host: true },
  test: { environment: 'node' },
}))
