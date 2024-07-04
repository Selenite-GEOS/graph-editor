<script lang="ts">
	import { setupSvelteRender } from '$graph-editor/render';
	import {
		AddNode,
		DisplayNode,
		NodeEditor,
		NumberNode,
		setupFullGraphEditor,
		setupGraphEditor
	} from '$lib/graph-editor';
	import { AreaExtensions } from 'rete-area-plugin';

	let editor = $state<NodeEditor>();
	// On mount
	$effect(() => {
		if (!container) return;
		setupFullGraphEditor({ container, setups: [setupSvelteRender] }).then(async (res) => {
			editor = res.editor;
			const factory = res.factory;
			console.log('Editor setup complete');
			const a = await factory.addNode(NumberNode);
			const b = await factory.addNode(NumberNode, { initial: 2 });
			const sum = await factory.addNode(AddNode, {});
			await editor.addNewConnection(a, 'value', sum, 'a');
			await editor.addNewConnection(b, 'value', sum, 'b');
			const display = await factory.addNode(DisplayNode, {});
			await editor.addNewConnection(sum, 'value', display, 'input');
			await factory.arrange.layout();
			AreaExtensions.zoomAt(factory.getArea(), editor.getNodes());
		});
	});
	$inspect('GraphEditor', editor);
	let container = $state<HTMLDivElement>();
</script>

<div class="h-[100vh] grid">
	<div bind:this={container} class="m-auto w-[75vw] h-[75vh] bg-slate-800"></div>
</div>
