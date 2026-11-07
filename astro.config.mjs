import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://siari-divine-mercy.example.org',
  output: 'static',
  build: { format: 'file', inlineStylesheets: 'auto' },
  trailingSlash: 'never',
  compressHTML: true,
});
