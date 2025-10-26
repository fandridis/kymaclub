import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { glob } from 'glob'

// Vite plugin to copy locale files to public directory
const copyLocales = () => ({
  name: 'copy-locales',
  closeBundle() {
    const srcDir = path.resolve(__dirname, 'src/locales')
    // Copy to dist/client/locales for proper static asset serving
    const distDir = path.resolve(__dirname, 'dist/client/locales')

    if (!existsSync(distDir)) {
      mkdirSync(distDir, { recursive: true })
    }

    const localeFiles = glob.sync('**/*.json', { cwd: srcDir })
    localeFiles.forEach(file => {
      const src = path.join(srcDir, file)
      const dest = path.join(distDir, file)
      copyFileSync(src, dest)
      console.log(`Copied locale: ${file}`)
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173,
  },
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    cloudflare({
      inspectorPort: 9240,
    }),
    copyLocales(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

})