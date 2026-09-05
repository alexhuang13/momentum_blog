import { defineConfig } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { sites } from './scripts/sites-vite-plugin.mjs';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist/client',
    rollupOptions: { input: { en: 'index.html', zh: 'zh.html' } },
  },
  plugins: [sites(), {
    name: 'static-worker',
    async closeBundle() {
      // Vite treats alternate-language HTML links as assets; keep public page routes.
      for (const page of ['index', 'zh']) {
        const path = 'dist/client/' + page + '.html';
        const html = await readFile(path, 'utf8');
        await writeFile(path, html.replace(/\.\/assets\/(index|zh)-[^"]+\.html/g, './$1.html'));
      }
      await mkdir('dist/server', { recursive: true });
      await writeFile('dist/server/index.js', 'export default { async fetch(request, env) { return env.ASSETS.fetch(request); } };\n');
    },
  }],
});
