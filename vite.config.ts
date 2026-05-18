import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const rawBasePath = String(env.VITE_BASE_PATH || '/KOLAS_Report/').trim();
  const basePath = rawBasePath === '/'
    ? '/'
    : `/${rawBasePath.replace(/^\/+|\/+$/g, '')}/`;
  const proxyTarget = String(env.VITE_PROXY_TARGET || 'http://localhost:8080').trim();
  const proxyPaths = [
    '/api',
    '/login',
    '/register',
    '/analysis-results',
    '/analysis-results-export',
    '/gemini-analyze',
    '/openai-analyze',
    '/openai-analyze-report',
  ];
  const proxy = Object.fromEntries(
    proxyPaths.map((proxyPath) => [
      proxyPath,
      {
        target: proxyTarget,
        changeOrigin: true,
      },
    ]),
  );
  return {
    plugins: [react(), tailwindcss()],
    base: basePath,
    define: {
      'process.env.VITE_OPENAI_API_KEY': JSON.stringify(env.VITE_OPENAI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify: file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy,
    },
  };
});

