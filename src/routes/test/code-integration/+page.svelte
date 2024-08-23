<script lang="ts">
	import {
		NodeFactory,
		setupFullGraphEditor,
		setupGraphEditor,
		setupSvelteGraphEditor
	} from '$graph-editor';
	import { parseXsdFromUrl, XmlSchema } from '@selenite/commons';
	import { untrack } from 'svelte';
	import { persisted } from 'svelte-persisted-store';

	let container = $state<HTMLElement>();
	let factory = $state<NodeFactory>();
	let textareaContent = persisted('test-code-integration-textarea', '');
	$effect(() => {
		if (!container) return;
		untrack(() => {
			(async () => {
				const res = await setupSvelteGraphEditor({ container });
				factory = res.factory;
			})();
		});

		return () => {
			if (factory) {
				factory.destroy();
			}
		};
	});
	let schema = $state<XmlSchema>();
	$effect(() => {
		(async () => {
			schema = await parseXsdFromUrl('/geos_schema.xsd');
			console.log(schema);
		})();
	});
</script>

<div class="relative">
	<div class="h-screen grid grid-flow-col grid-cols-[2fr,1fr] gap-2">
		<div bind:this={container}></div>
		<textarea class="textarea-bordered textarea" bind:value={$textareaContent}></textarea>
	</div>
	<div
		class="absolute inset-0 z-10 row-span-2 row-start-1 col-start-1 grid items-start p-4 justify-center grid-flow-col gap-2 pointer-events-none"
	>
		<button
			class="btn btn-primary pointer-events-auto"
			onclick={() => {
				if (!schema) return;
				factory?.codeIntegration.toGraph({ text: $textareaContent, schema });
			}}
		>
			To graph
		</button>
		<button
			class="btn btn-warning pointer-events-auto"
			disabled={factory?.editor.clearing ?? false}
			onclick={() => factory?.clear()}
		>
			Clear
		</button>
	</div>
</div>
