import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'exclude-models',
          resolveId(id) {
            if (id.includes('face_recognition_model') || id.includes('.bin') || id.includes('shard')) {
              return { id, external: true };
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
      build: {
        rollupOptions: {
          external: [
            /face_recognition_model/,
            /\.bin$/,
            /shard\d+$/
          ]
        }
      },
      assetsInclude: [
        '**/*.bin',
        '**/face_recognition_model*'
      ]
    };
});
