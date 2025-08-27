import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsconfigPaths({
      loose: true,
    }),
    vue(),
  ],
  resolve: {
    alias: {
    },
  },
  optimizeDeps: {
    // Wildcards aren't supported; list concrete IDs if you really need to exclude them.
    // exclude: ['@material/tooltip', '@material/ripple']
  },
});
