import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    istanbul({
      cypress: false,
      requireEnv: false,
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['node_modules', 'tests', 'playwright.config.ts'],
      extension: ['.ts', '.tsx'],
      nycrcPath: './.nycrc.json',
      forceBuildInstrument: mode === 'test'
    })
  ],
  server: {
    port: 5173
  }
}));
