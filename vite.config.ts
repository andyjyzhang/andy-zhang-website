import { defineConfig } from 'vitest/config';
export default defineConfig({
  server: { watch: { ignored: ['**/artifacts/**', '**/assets/ldraw/**', '**/.*/**'] } },
  test: { include: ['tests/**/*.test.ts'] },
  build: { rollupOptions: { input: { portfolio: 'index.html', world: 'world.html' }, output: { manualChunks: { three: ['three'] } } } },
});
