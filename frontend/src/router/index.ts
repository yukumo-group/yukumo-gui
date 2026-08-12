import { createRouter, createWebHashHistory } from 'vue-router';
import { routes, handleHotUpdate } from 'vue-router/auto-routes';

// Hash history: reliable in the Wails WebView without server-side path rewrites.
const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

if (import.meta.hot) {
  handleHotUpdate(router);
}

export default router;
