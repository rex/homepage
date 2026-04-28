/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly VITE_BUILD_COMMIT: string;
  readonly VITE_BUILD_DATE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.yaml?raw' {
  const content: string;
  export default content;
}
