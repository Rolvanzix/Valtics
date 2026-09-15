import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {nodePolyfills} from 'vite-plugin-node-polyfills';

export default defineConfig(() => {
  return {
    plugins: [
      {
        name: 'replace-cross-fetch',
        enforce: 'pre',
        resolveId(id) {
          if (id === 'cross-fetch' || id.startsWith('cross-fetch/')) {
            return path.resolve(__dirname, 'src/lib/fetch.ts');
          }
        },
      },
      nodePolyfills({
        include: ['buffer', 'crypto', 'stream', 'util', 'process'],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
      react(),
      tailwindcss(),
    ],
    define: {
      global: 'globalThis',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'cross-fetch': path.resolve(__dirname, 'src/lib/fetch.ts'),
        '@coral-xyz/anchor': path.resolve(__dirname, 'node_modules/@coral-xyz/anchor/dist/esm/index.js'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
