<script lang="ts">
	import { NumberNode } from '$graph-editor/nodes/data/number';
	import { DisplayNode } from '$graph-editor/nodes/io/DisplayNode';
	import { AddNode } from '$graph-editor/nodes/math';
	import { setupSvelteRender } from '$graph-editor/render';
	import { Setup } from '$lib/graph-editor';
	import { showContextMenu, ContextMenuComponent } from '$graph-editor/plugins/context-menu';
	import { AreaExtensions } from 'rete-area-plugin';
	import type { NodeEditor } from '$graph-editor/editor';

	let editor = $state<NodeEditor>();
	// On mount
	$effect(() => {
		if (!container) return;
		Setup.setupFullGraphEditor({ container, setups: [setupSvelteRender], showContextMenu }).then(
			async (res) => {
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
				await factory.arrange?.layout();
				if (factory.area)
					AreaExtensions.zoomAt(factory.area, editor.getNodes());
			}
		);
	});
	$inspect('GraphEditor', editor);
	let container = $state<HTMLDivElement>();
	let screenProportion = $state(95);
</script>

<ContextMenuComponent />
<div class="h-[100vh] grid">
	<div
		bind:this={container}
		class="m-auto bg-slate-800"
		style="width: {screenProportion}vw; height: {screenProportion}vh;"
	></div>
</div>
