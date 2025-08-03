import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Temporarily disabled to fix build
  clean: true,
  minify: process.env.NODE_ENV === 'production',
  sourcemap: true,
  splitting: true,
  treeshake: true,
  outDir: 'dist',
  // Bundle dependencies for SDK
  external: ['axios'],
  noExternal: ['@gymspace/shared'],
  target: 'es2020',
  platform: 'neutral',
  // Generate multiple bundles for different environments
  env: {
    NODE_ENV: process.env.NODE_ENV || 'development'
  },
  onSuccess: async () => {
    console.log('✅ Build succeeded for @gymspace/sdk');
  }
});