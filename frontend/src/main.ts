import { createApp } from 'vue';
import Varlet from '@varlet/ui';
import '@varlet/ui/es/style';
import '@varlet/touch-emulator';
import { install as VueMonacoEditorPlugin } from '@guolao/vue-monaco-editor';

import App from './App.vue';
import router from './router';
import { i18n, initI18n } from './i18n';
import { initTheme } from './theme/theme';
import './monaco/setup';
import './style.css';

initTheme();
initI18n();
createApp(App)
  .use(Varlet)
  .use(i18n)
  .use(router)
  .use(VueMonacoEditorPlugin)
  .mount('#app');
