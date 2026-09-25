import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig({root,base:'./',publicDir:false,
  build:{outDir:'build',emptyOutDir:true},
  server:{host:'127.0.0.1',port:4186,strictPort:true},
  preview:{host:'127.0.0.1',port:4186,strictPort:true}
});
