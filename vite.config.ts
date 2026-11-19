import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Publicado en GitHub Pages como sitio de proyecto: https://laura-m-stack.github.io/huella-vet/
export default defineConfig({
  plugins: [react()],
  base: '/huella-vet/',
});
