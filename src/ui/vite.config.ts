import { defineConfig } from 'vite';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const workspaceRoot = '../..';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, workspaceRoot, '');
  const apiTarget = env.VITE_API_BASE_URL || env.ASPNETCORE_URLS?.split(';')[0] || 'http://127.0.0.1:5191';
  const uiHost = env.VITE_UI_HOST || '127.0.0.1';
  const uiPort = Number(env.VITE_UI_PORT || 5173);

  return {
    envDir: workspaceRoot,
    plugins: [react()],
    server: {
      host: uiHost,
      port: uiPort,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/health': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: Number(env.VITE_PREVIEW_PORT || 4173),
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/health': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
