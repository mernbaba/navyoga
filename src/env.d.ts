interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_AWS_S3_FILE_PREFIX: string;
  readonly VITE_CDN_ENDPOINT: string;
  readonly VITE_MSG91_WIDGET_ID: string;
  readonly VITE_MSG91_TOKEN_AUTH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
