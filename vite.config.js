import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  base: '/tezX/',
  plugins: [react()],
  resolve: {
    alias: {
      'es-toolkit/compat/get': path.resolve(__dirname, 'src/shims/get.js'),
      'es-toolkit/compat/sortBy': path.resolve(__dirname, 'src/shims/sortBy.js'),
      'es-toolkit/compat/omit': path.resolve(__dirname, 'src/shims/omit.js'),
      'es-toolkit/compat/throttle': path.resolve(__dirname, 'src/shims/throttle.js'),
      'es-toolkit/compat/maxBy': path.resolve(__dirname, 'src/shims/maxBy.js'),
      'es-toolkit/compat/sumBy': path.resolve(__dirname, 'src/shims/sumBy.js'),
      'es-toolkit/compat/isPlainObject': path.resolve(__dirname, 'src/shims/isPlainObject.js'),
      'es-toolkit/compat/uniqBy': path.resolve(__dirname, 'src/shims/uniqBy.js'),
      'es-toolkit/compat/last': path.resolve(__dirname, 'src/shims/last.js'),
      'es-toolkit/compat/minBy': path.resolve(__dirname, 'src/shims/minBy.js'),
      'es-toolkit/compat/range': path.resolve(__dirname, 'src/shims/range.js'),
    }
  }
})
