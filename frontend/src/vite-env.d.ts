/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ALCHEMY_ID: string
  readonly VITE_APP_APP_NAME: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}