<script lang="ts">
	import { NumberNode } from '$graph-editor/nodes/data/number';
	import { DisplayNode } from '$graph-editor/nodes/io/DisplayNode';
	import { AddNode } from '$graph-editor/nodes/math';
	import { setupSvelteRender } from '$graph-editor/render';
	import { Setup } from '$lib/graph-editor';
	import { showContextMenu, ContextMenuComponent } from '$graph-editor/plugins/context-menu';
	import { AreaExtensions } from 'rete-area-plugin';
	import type { NodeEditor, NodeEditorSaveData } from '$graph-editor/editor';
	import { persisted } from 'svelte-persisted-store';

	let editor = $state<NodeEditor>();
	const saveData = persisted<NodeEditorSaveData | null>('graph-editor-save-data', null);
	let editorReady = $state(false);
	// On mount
	$effect(() => {
		if (!container) return;
		Setup.setupFullGraphEditor({ container, setups: [setupSvelteRender], showContextMenu }).then(
			async (res) => {
				editor = res.editor;
				const factory = res.factory;
				console.log('Editor setup complete');
				if ($saveData) {
					await factory.loadGraph($saveData);
					editorReady = true;
					return;
				}
				const a = await factory.addNode(NumberNode);
				const b = await factory.addNode(NumberNode, { initial: 2 });
				const sum = await factory.addNode(AddNode, {});
				await editor.addNewConnection(a, 'value', sum, 'a');
				await editor.addNewConnection(b, 'value', sum, 'b');
				const display = await factory.addNode(DisplayNode, {});
				await editor.addNewConnection(sum, 'value', display, 'input');
				await factory.arrange?.layout();
				if (factory.area) await AreaExtensions.zoomAt(factory.area, editor.getNodes());
				editorReady = true;
			}
		);

		return () => {
			editor?.factory?.destroyArea()
		}
	});
	// $inspect('GraphEditor', editor);
	function save() {
		if (!editor) {
			console.warn('No editor to save');
			return;
		}
		const saveData = editor.toJSON();
		console.debug('Save');
		$saveData = saveData;
	}
	let container = $state<HTMLDivElement>();
	let screenProportion = $state(95);
</script>

<ContextMenuComponent />
<div class="h-[100vh] grid relative bg-base-200">
	<button
		type="button"
		disabled={!editorReady}
		class="absolute top-4 left-4 hover:brightness-150 bg-slate-950 text-white rounded-md p-4 active:brightness-50 transition-all"
		onclick={() => save()}
	>
		Save
	</button>
	<div
		class="m-auto"
		style="width: {screenProportion}vw; height: {screenProportion}vh;"
	>
		<div
			class="h-full w-full transition-all opacity-0 bg-neutral"
			class:!opacity-100={editorReady}
			bind:this={container}
		></div>
	</div>
</div>
