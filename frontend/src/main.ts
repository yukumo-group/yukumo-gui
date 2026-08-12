import { createApp } from 'vue';
import { StyleProvider, Themes } from '@varlet/ui';
import Varlet from '@varlet/ui';
import '@varlet/ui/es/style';
import '@varlet/touch-emulator';

import App from './App.vue';
import router from './router';
import './style.css';

StyleProvider(Themes.md3Light);
createApp(App).use(Varlet).use(router).mount('#app');
