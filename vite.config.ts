import { defineConfig } from 'vitest/config';
export default defineConfig({
  server: { watch: { ignored: ['**/artifacts/**', '**/assets/ldraw/**', '**/.*/**'] } },
  test: { include: ['tests/**/*.test.ts'] },
  build: { rollupOptions: { output: { manualChunks: { three: ['three'] } } } },
});
