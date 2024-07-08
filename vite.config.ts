import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import houdini from 'houdini/vite';

export default defineConfig({
	plugins: [
		,
		// houdini()
		// .map((plugin) => {
		// 	return () => {
		// 		try {
		// 			plugin()
		// 		}
		// 		catch {
		// 			console.error("aie")
		// 		}
		// 		}

		// })
		sveltekit()
	],
	build: {
		target: 'esnext'
		// rollupOptions: {
		//   external: ["src/**/*.svelte"]
		// }
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
