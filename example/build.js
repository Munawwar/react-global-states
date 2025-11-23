import * as esbuild from 'esbuild';
import { resolve } from 'path';

await esbuild.build({
  entryPoints: ['src/index.jsx'],
  bundle: true,
  outfile: 'public/bundle.js',
  format: 'esm',
  minify: true,
  sourcemap: true,
  external: ['react', 'react-dom', 'react-dom/client'],
  alias: {
    'react-global-states': resolve('../src/index.tsx')
  },
  loader: {
    '.jsx': 'jsx',
    '.tsx': 'tsx'
  }
});

console.log('Build complete! Output: public/bundle.js');

