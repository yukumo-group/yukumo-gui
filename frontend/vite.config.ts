/**
 * vite.config.ts — Vite Build Configuration
 *
 * Configures the Vite development server and production build
 * with the Vue 3 plugin for Single-File Component (.vue) support.
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
});
