/**
 * env.d.ts — Ambient Type Declarations for the Frontend
 *
 * Provides Vite client types and module declarations so TypeScript
 * understands `.vue` Single-File Components and other asset imports.
 */

/// <reference types="vite/client" />

/**
 * Declares Vue Single-File Components as typed modules.
 * Enables `import Component from './Component.vue'` with type checking.
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<object, object, unknown>;
  export default component;
}
