import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // include: ['./src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    globals: true,
    environment: 'happy-dom',
  },
});
