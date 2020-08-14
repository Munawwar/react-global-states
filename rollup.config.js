import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import external from 'rollup-plugin-peer-deps-external';
import resolve from 'rollup-plugin-node-resolve';
import url from 'rollup-plugin-url';
import { terser } from 'rollup-plugin-terser';

import pkg from './package.json';

export default {
	input: 'src/index.tsx',
	output: [
		{
			file: pkg.main,
			format: 'umd',
			exports: 'named',
			name: 'react-global-states',
			sourcemap: true
		},
		{
			file: pkg.module,
			format: 'es',
			exports: 'named',
			sourcemap: true
		},
	],
	plugins: [
		external(),
		url({ exclude: ['**/*.svg'] }),
		resolve(),
		typescript({
			rollupCommonJSResolveHack: true,
			clean: true
		}),
		commonjs(),
		terser(),
	]
};
