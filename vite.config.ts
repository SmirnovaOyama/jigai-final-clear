import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The markdown question banks live in /assets (outside src). They are pulled in
// at build time via import.meta.glob('/assets/*.md', { query: '?raw' }).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
});
