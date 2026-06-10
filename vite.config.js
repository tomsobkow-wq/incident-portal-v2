import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GHPAGES=1 npm run build → assets served from /incident-portal-v2/ on GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: process.env.GHPAGES ? '/incident-portal-v2/' : '/',
});
