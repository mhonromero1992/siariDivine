import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://siari-divine.vercel.app',
  output: 'static',
  /* folder-style pages (shrine/index.html) are served at /shrine by every static host, Vercel included */
  build: { format: 'directory', inlineStylesheets: 'auto' },
  trailingSlash: 'ignore',
  compressHTML: true,
});
