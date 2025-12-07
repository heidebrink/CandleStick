import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'SessionTracker',
      fileName: 'session-tracker',
      formats: ['es', 'umd']
    },
    outDir: 'dist'
  },
  server: {
    port: 5173,
    cors: true
  }
});
