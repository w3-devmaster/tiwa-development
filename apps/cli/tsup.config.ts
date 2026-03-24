import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/commands/**/*.ts',
    'src/core/**/*.ts',
    'src/types/**/*.ts',
  ],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  splitting: true,
  sourcemap: true,
  dts: false,
  noExternal: ['@tiwa/shared'],
});
