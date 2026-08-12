/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<object, object, unknown>;
  export default component;
}

declare module '@varlet/ui/es/style';
declare module '@varlet/touch-emulator';
declare module '@varlet/ui/es/locale/en-US';
declare module '@varlet/ui/es/locale/ja-JP';
declare module '@varlet/ui/es/locale/zh-CN';
