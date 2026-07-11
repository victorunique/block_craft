/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.json' {
  const value: any;
  export default value;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}