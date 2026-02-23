/// <reference types="vite/client" />

// 环境变量类型
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENV: 'development' | 'staging' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 全局类型扩展
declare global {
  interface Window {
    __CLAUDE_HARNESS__: {
      version: string;
      env: string;
    };
  }
}

export {};
