import { defineConfig } from 'vite';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        entry: path.join(__dirname, 'src/main/index.ts'),
        onstart(options) {
          options.startup([
            '.',
            '--ozone-platform-hint=auto',
            '--enable-features=WaylandWindowDecorations'
          ]);
        },
        vite: {
          build: {
            
            outDir: path.join(__dirname, 'dist-electron/main'),
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      {
        entry: path.join(__dirname, 'src/preload/index.ts'),
        onstart(args) {
          args.reload();
        },
        vite: {
          build: {
            ssr: true,
            lib: {
              entry: path.join(__dirname, 'src/preload/index.ts'),
              
              formats: ['cjs'],
              fileName: () => 'index.cjs',
            },
            outDir: path.join(__dirname, 'dist-electron/preload'),
            rollupOptions: { external: ['electron'] },
          },
        },
      },
    ]),
    renderer(),
  ],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  root: path.join(__dirname, 'src/renderer'),
  publicDir: path.join(__dirname, 'public'),
  build: {
            
    outDir: path.join(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
