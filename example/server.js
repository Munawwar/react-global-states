import * as esbuild from 'esbuild';
import { resolve } from 'path';

const ctx = await esbuild.context({
  entryPoints: ['src/index.jsx'],
  bundle: true,
  outfile: 'public/bundle.js',
  format: 'esm',
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

await ctx.watch();

const { port } = await ctx.serve({
  servedir: 'public',
  host: 'localhost',
  port: 8000
});

console.log(`Server running at http://localhost:${port}`);

