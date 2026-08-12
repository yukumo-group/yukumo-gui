import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import VueRouter from 'vue-router/vite';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // VueRouter must run before Vue (file-based routing).
    VueRouter({
      routesFolder: 'src/pages',
    }),
    vue(),
    tailwindcss(),
  ],
});
