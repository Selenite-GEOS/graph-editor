import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import wasmPack from 'vite-plugin-wasm-pack'
export default defineConfig({
	plugins: [
		sveltekit(),
		wasmPack([], ['selenite-commons-rs']),
	],
	build: {
		target: 'es2022'
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
