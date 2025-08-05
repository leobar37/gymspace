import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Disable DTS generation in tsup
  clean: true,
  minify: false,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  outDir: 'dist',
  external: [],
  tsconfig: "./tsconfig.json",
  noExternal: [],
  // Enable watch mode for development
  onSuccess: async () => {
    console.log('✅ Build succeeded for @gymspace/shared');
  }
});