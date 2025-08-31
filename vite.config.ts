import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import express from "vite3-plugin-express"; // <-- use vite3-plugin-express

import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsconfigPaths({
      loose: true,
    }),
    vue(),
    express("src/server/api.ts"),
  ],
  resolve: {
    alias: {
    },
  },
});
