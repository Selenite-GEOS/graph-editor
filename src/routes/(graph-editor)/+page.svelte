<script lang="ts">
	import { setupSvelteRender } from '$graph-editor/render';
	import { MiniMap, NodeStorage, Setup, VariablesListComponent } from '$lib/graph-editor';
	import {
		nodeItem,
		xmlNodeItems	} from '$graph-editor/plugins/context-menu-plugin.svelte';
	import type { NodeEditor, NodeEditorSaveData } from '$graph-editor/editor';
	import { persisted } from 'svelte-persisted-store';
	import { capitalize, parseXsdFromUrl, shortcut, showContextMenu, type KeyboardShortcut } from '@selenite/commons';
	import { notifications, themeControl } from '$lib/global/index.svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { XmlNode } from '$graph-editor/nodes/XML';
	import { setContext, untrack } from 'svelte';
	import { onGraphDragStart } from '$graph-editor/utils';
	let editor = $state<NodeEditor>();
	const factory = $derived(editor?.factory);
	const saveData = persisted<NodeEditorSaveData | null>('graph-editor-save-data', null);
	let editorReady = $state(false);

	$effect(() => {
		if (!container) return;
		(async () => {
			const schema = await parseXsdFromUrl('/geos_schema.xsd');
			console.log(schema);
			const res = await Setup.setupFullGraphEditor({
				container,
				setups: [setupSvelteRender],
				showContextMenu,
				xmlSchemas: {
					geos: schema
				},
				additionalNodeItems: [
					...(schema
						? xmlNodeItems({
								schema,
								basePath: ['GEOS'],
								priorities: {
									Problem: {
										Solvers: 10,
										Mesh: 9,
										Geometry: 8,
										Events: 7,
										ElementRegions: 6,
										NumericalMethods: 5,
										Constitutive: 4,
										FieldSpecifications: 3,
										Functions: 2,
										Outputs: 1
									}
								}
							})
						: []),
					nodeItem({
						label: 'Example XML',
						description: 'This an example XML node.',
						inputTypes: {},
						outputTypes: {},
						nodeClass: XmlNode,
						params: {
							xmlConfig: {
								xmlTag: 'ExampleXML'
							}
						},
						path: ['XML'],
						tags: ['xml']
					}),
					
				]
			});

			editor = res.editor;
			const factory = res.factory;
			console.log('Editor setup complete');
			if ($saveData) {
				await factory.loadGraph($saveData);
			}
			editorReady = true;
		})();

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
		const newSaveData = editor.toJSON();
		console.log('Save', newSaveData, editor);
		$saveData = newSaveData;
		notifications.success({
			autoClose: 3000,
			title: 'Save',
			message: 'Saved!'
		});
	}
	let container = $state<HTMLDivElement>();
	let screenProportion = $state(100);
	$effect(() => {
		themeControl.isLight;
		editor?.area?.emit({ type: 'gridline-update' });
	});
	let isGridlinesVisible = $state(true);
	function toggleGridlinesVisibility() {
		isGridlinesVisible = !isGridlinesVisible;
		editor?.factory?.getArea()?.emit({ type: 'gridline-toggle-visibility' });
	}
	type ButtonProps = {
		label?: string;
		class?: string;
		shortcut?: KeyboardShortcut;
		action?: (n: HTMLElement, e: Event) => void;
		props?: HTMLButtonAttributes;
	};
	const editorContext = {
		get editor() {
			return editor;
		},
		get factory() {
			return factory;
		}
	};
	setContext('editor', editorContext);
	let minimapOn = persisted('minimap', true)
	$effect(() => {
		const on = $minimapOn;
		factory
		untrack(() => {
			if (factory)
			factory.minimapEnabled = on;
		})
	})
</script>

{#snippet button({
	props = {},
	label,
	shortcut: kbShortcut,
	action,
	class: classes = ''
}: ButtonProps)}
	<button
		type="button"
		class="btn pointer-events-auto {classes}"
		{...props}
		use:shortcut={{ ...kbShortcut, action }}
		onclick={(e: Event) => {
			if (action) action(e.currentTarget as HTMLElement, e);
		}}
	>
		{label}
	</button>
{/snippet}

<div class="h-[100vh] grid relative bg-base-200">
	<div class="z-10 absolute top-4 left-4 flex gap-2 items-end flex-wrap pointer-events-none">
		<button
			type="button"
			disabled={!editorReady}
			class=" hover:brightness-150 bg-slate-950 text-white rounded-md p-4 active:brightness-50 transition-all pointer-events-auto"
			onclick={() => save()}
			use:shortcut={{ key: 's', ctrl: true, action: save }}
		>
			Save
		</button>
		<button
			class:btn-secondary={isGridlinesVisible}
			type="button"
			class="btn pointer-events-auto"
			onclick={toggleGridlinesVisibility}
		>
			Grid
		</button>
		{@render button({ label: 'Clear', class: 'btn-warning', action: () => editor?.clear() })}
		{@render button({
			label: 'Load',
			class: 'btn-neutral',
			action(e) {
				factory?.loadFromFile();
			}
		})}
		{@render button({
			label: 'Download',
			class: 'btn-neutral',
			action(e) {
				factory?.downloadGraph();
			}
		})}
		<select class="select select-bordered pointer-events-auto" title="Theme" bind:value={themeControl.theme}>
			<option value="">Default</option>
			{#each themeControl.themes as theme}
				<option value={theme}>{capitalize(theme)}</option>
			{/each}
		</select>
		{#if editor}
			<input class="input input-bordered pointer-events-auto" bind:value={editor.graphName} />
			<input class="input input-bordered w-[23em] pointer-events-auto" bind:value={editor.graphId} />
		{/if}
		<aside class="flex gap-2">
			<h2>DB</h2>
			<p>Count : {NodeStorage.numGraphs}</p>
		</aside>
		{#if factory}
		<button class="btn pointer-events-auto" onclick={() => factory?.openGraphForm()}>Create Macro-Block</button>
		<button class="btn pointer-events-auto" onclick={() => NodeStorage.clearGraphs()}>Clear DB</button>
		<button class="btn pointer-events-auto" onclick={() => NodeStorage.pullSources()}>Pull datasources</button>
		{@render button({
			class: factory?.selection.boxSelectionEnabled ? 'btn-success' : '',
			label: 'Box',
			shortcut: { key: 'b'},
			action: () => {
				if (!factory) return;
				const selection = factory.selection;
				selection.boxSelectionEnabled = !selection.boxSelectionEnabled;
			}
		})}
		{@render button({label: 'Previous', shortcut:{key: 'p'}, action: () => factory.search.previous()})}
		<input class="input input-bordered pointer-events-auto" bind:value={factory.search.query} placeholder="Search"/>
		{@render button({label: 'Next', shortcut: {key: 'n'}, action: () => factory.search.next()})}
		{@render button({label: 'Minimap', class: $minimapOn ? 'btn-secondary' : '', action: () => $minimapOn = !$minimapOn})}
		{/if}
	</div>
	<div
		use:shortcut={{
			key: 'a',
			async action(e) {}
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
			action(n, e) {
				themeControl.theme = themeControl.previousTheme;
			}
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
	<div class="absolute bottom-2 left-2">
		<VariablesListComponent />
	</div>
	<div
		class="absolute bottom-2 right-2 flex gap-4 items-end pointer-events-none"
	>
		<details class="p-4 bg-base-200 rounded-box border border-base-content border-opacity-10 transition-all pointer-events-auto">
			<summary class="ms-4 w-[12rem] font-semibold cursor-pointer select-none">
				Saved Graphs
			</summary>
			<ul class="flex flex-col gap-2 pt-4">
				{#each NodeStorage.graphs as graph}
					<li
						draggable="true"
						ondblclick={() => factory?.loadGraph(graph.graph)}
						ondragstart={onGraphDragStart(graph)}
						class="
							p-2 bg-base-300 select-none border border-base-content border-opacity-15 rounded-btn
							cursor-pointer
							"
					>
						{graph.name}
					</li>
				{/each}
			</ul>
		</details>
		<MiniMap />
	</div>
</div>
