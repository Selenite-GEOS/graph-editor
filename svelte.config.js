import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),
		alias: {
			$rete: 'src/lib/old-graph-editor/rete',
			'$graph-editor': 'src/lib/graph-editor',
			$Node: 'src/lib/graph-editor/nodes/Node.svelte',
			// '$graph-editor/**': "src/lib/graph-editor/**",
			$utils: 'src/lib/utils',
			$houdini: path.resolve('.', '$houdini'),
			'$custom-components': 'src/lib/old-graph-editor/rete/customization/presets/classic/components'
		}
	}
};

export default config;
