import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Proxy FPL API requests through Vite dev server to avoid CORS
  server: {
    proxy: {
      '/fpl-api': {
        target: 'https://fantasy.premierleague.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/fpl-api/, '/api'),
        secure: true,
      },
      '/fpl-img': {
        target: 'https://fantasy.premierleague.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/fpl-img/, '/dist/img'),
        secure: true,
      },
    },
  },
})
