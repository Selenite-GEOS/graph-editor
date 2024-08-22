import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import wasmPack from 'vite-plugin-wasm-pack';
export default defineConfig({
	plugins: [sveltekit(), wasmPack([], ['@selenite/commons-rs'])],
	build: {
		target: 'es2022',


	},
	ssr: {
		noExternal: ['@selenite/commons']
	},
	test: {
		include: ['src/**/*.{test,spec,test.svelte}.{js,ts}'],
	},
	resolve: process.env.VITEST
		? {
				conditions: ['browser']
			}
		: undefined,
	server: {
		port: 1501
	}
});
