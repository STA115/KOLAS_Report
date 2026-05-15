import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    base: '/TRP/',
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
      proxy: {
        '/gemini-analyze': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/openai-analyze': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/openai-analyze-report': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/login': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
        '/register': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  };
});

