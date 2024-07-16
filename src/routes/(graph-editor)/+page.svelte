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
	import { capitalize, shortcut, type KeyboardShortcut } from '@selenite/commons';
	import { themeControl } from '$lib/global/index.svelte';
	import type {HTMLButtonAttributes} from 'svelte/elements'
	let editor = $state<NodeEditor>();
	const factory = $derived(editor?.factory)
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
			editor?.factory?.destroyArea();
		};
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
	let screenProportion = $state(100);
	$effect(() => {
		themeControl.isLight;
		editor?.area?.emit({ type: 'gridline-update' });
	});
	let isGridlinesVisible = $state(true)
	function toggleGridlinesVisibility() {
		isGridlinesVisible = !isGridlinesVisible
		editor?.factory?.getArea()?.emit({ type: 'gridline-toggle-visibility' })
	}
</script>
{#snippet button({props={}, label, shortcut: kbShortcut, action, class: classes =''}: {label?: string, class?: string, shortcut?: KeyboardShortcut, action?: (e: Event) => void, props?: HTMLButtonAttributes})}
<button type="button" class="btn {classes}" {...props} use:shortcut={{...kbShortcut, action}} onclick={(e: Event) => {if (action) action(e)}}>
	{label}
</button>
{/snippet}

<ContextMenuComponent />
<div class="h-[100vh] grid relative bg-base-200">
	<div class="z-10 absolute top-4 left-4 flex gap-2 items-end">
		<button
			type="button"
			disabled={!editorReady}
			class=" hover:brightness-150 bg-slate-950 text-white rounded-md p-4 active:brightness-50 transition-all"
			onclick={() => save()}
		>
			Save
		</button>
		<button
			class:btn-secondary={isGridlinesVisible}
			type="button"
			class="btn"
			onclick={toggleGridlinesVisibility}
		>
			Grid
		</button>
		{@render button({label: 'Clear', class: 'btn-warning', action: () => editor?.clear()})}
		{@render button({label: 'Load', class:'btn-neutral', action(e) {
			factory?.loadFromFile()
		},})}
		{@render button({label: 'Download', class:'btn-neutral', action(e) {
			factory?.downloadGraph()
		},})}
		<select class="select select-bordered" title="Theme" bind:value={themeControl.theme}>
			<option value="">Default</option>
			{#each themeControl.themes as theme}
				<option value={theme}>{capitalize(theme)}</option>
			{/each}
		</select>
	</div>
	<div
		use:shortcut={{
			key: 'a',
			async action(e) {
				await editor?.factory?.arrange?.layout();
				const area = editor?.factory?.area;
				if (!area) return;
				await AreaExtensions.zoomAt(area, editor?.getNodes() ?? []);
			}
		}}
		use:shortcut={{
			key: 'g',
			action: toggleGridlinesVisibility
		}}
		use:shortcut={{
			key: 't',
			action(e) {
				themeControl.theme = themeControl.nextTheme;
			}
		}}
		use:shortcut={{
			key: 'r',
			action(e) {
				themeControl.theme = themeControl.previousTheme
			},
		}}
		class="m-auto"
		style="width: {screenProportion}vw; height: {screenProportion}vh;"
	>
		<div
			class="h-full w-full transition-all opacity-0 bg-base-100"
			class:!opacity-100={editorReady}
			bind:this={container}
		></div>
	</div>
</div>
