import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        hmr: {
          overlay: true
        }
      },
      plugins: [
        react(),
        {
          name: 'exclude-model-files',
          load(id) {
            // Skip processing of model shard files
            if (id.includes('/models/') && id.includes('-shard')) {
              return null;
            }
          },
          transform(code, id) {
            // Skip transformation of model files
            if (id.includes('/models/') && (id.includes('-shard') || id.endsWith('.bin'))) {
              return null;
            }
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      assetsInclude: [
        '**/*.bin',
        '**/*-shard*',
        '**/models/**'
      ]
    };
});
