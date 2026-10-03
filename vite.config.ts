import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  css: {
    postcss: {},
  },
  build: {
    target: 'es2022',
    minify: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        inject: resolve(__dirname, 'src/main.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'inject' ? 'inject.js' : 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Ensure inject.js is an immediately-invoked self-contained bundle
        format: 'es',
      },
    },
  },
});
