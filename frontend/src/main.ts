import { createApp } from 'vue';
import Varlet from '@varlet/ui';
import '@varlet/ui/es/style';
import '@varlet/touch-emulator';

import App from './App.vue';
import router from './router';
import { i18n, initI18n } from './i18n';
import { initTheme } from './theme/theme';
import './style.css';

initTheme();
initI18n();
createApp(App).use(Varlet).use(i18n).use(router).mount('#app');
