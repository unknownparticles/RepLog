import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };
export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version), __BUILD_SHA__: JSON.stringify('test'), __BUILD_TIME__: JSON.stringify('2026-10-20T00:00:00.000Z') },
  test: { environment: 'jsdom', setupFiles: ['tests/setup.ts'], include: ['tests/**/*.test.{ts,tsx}'], restoreMocks: true },
});
