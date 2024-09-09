<script lang="ts">
	import type { NodeEditor } from '$graph-editor/editor';
	import {
		autosize,
		checkbox,
		PathGenerator,
		persisted,
		Tags,
		unCamelCase,
		uuid
	} from '@selenite/commons';
	import type { GraphPorts, StoredGraph } from './types';
	import { upperFirst } from 'lodash-es';
	import type { HTMLInputAttributes, HTMLTextareaAttributes } from 'svelte/elements';
	import { FavoritesManager } from './FavoritesManager.svelte';
	import { VariableNode } from '$graph-editor/nodes/XML/VariableNode.svelte';
	import { NodeStorage, userStore } from './NodeStorage.svelte';
	interface Props {
		editor: NodeEditor;
		formId?: string;
		existingGraph?: StoredGraph;
	}

	let { editor, formId, existingGraph }: Props = $props();
	const savedForm = persisted<Partial<typeof graph>>('graph-form', {}, { storage: 'session' });
	const localPersistedGraph = persisted<Partial<typeof graph>>('graph-form', {});
	const graph: Partial<StoredGraph & { addToFavorite: boolean }> = $state({
		tags: [],
		path: [],
		...$savedForm,
		...$localPersistedGraph,
		...existingGraph,
		get name() {
			return areNodesSelected ? subGraphName :  (editor.graphName ?? '');
		},
		set name(value: string) {
			if (areNodesSelected)
				subGraphName = value;
			else
				editor.graphName = value;
		}
	});
	let subGraphName = $state('')

	if (existingGraph) {
		graph.addToFavorite = FavoritesManager.isFavorite(existingGraph.id);
	}

	const persistedKeys = [
		'name',
		'description',
		'public',
		'addToFavorite',
		'tags',
		'path'
	] as (keyof typeof graph)[];
	const localPersistedKeys = ['author'] as (keyof typeof graph)[];
	function saveForm() {
		console.debug(graph.public);
		const res: Record<string, unknown> = {};
		for (const key of persistedKeys) {
			res[key] = graph[key];
		}
		$savedForm = $state.snapshot(res);

		const localRes: Record<string, unknown> = {};
		for (const key of localPersistedKeys) {
			localRes[key] = graph[key];
		}
		$localPersistedGraph = $state.snapshot(localRes);
		console.debug('Saved form', $savedForm);
	}

	const selectedNodes = $derived(editor.factory?.selection.nodes ?? editor.getNodes());
	const areNodesSelected = $derived(selectedNodes.length > 0);
	const selectedNodesIds = $derived(new Set(selectedNodes.map((n) => n.id)));
	const selectedConns = $derived(editor.factory?.selection.connections ?? editor.getConnections());
	const selectedConnsIds = $derived(selectedConns.map((c) => c.id));
	export async function getResponse(): Promise<StoredGraph> {
		const id = !areNodesSelected ? editor.graphId : uuid();
		FavoritesManager.setFavorite(id, graph.addToFavorite ?? false);
		const date = new Date();

		async function gatherPorts(side: 'input' | 'output') {
			const res: GraphPorts = [];
			for (const [nodeId, ports] of Object.entries(side === 'input' ? inputs : outputs)) {
				for (const [key, { keep, nickname, descr, priority }] of Object.entries(ports)) {
					if (!keep) continue;
					const node = editor.getNode(nodeId);
					const port = node?.[side === 'input' ? 'inputs' : 'outputs'][key];
					if (!port) continue;
					const socket = port.socket;
					let value: unknown;
					if (side === 'input') {
						// @ts-ignore Type error
						value = await node.getDataWithInputs(key);
						if (typeof value === 'object') {
							value = JSON.stringify(value);
						}
					}
					res.push({
						nodeId,
						key,
						label:
							nickname && nickname.trim().length > 0
								? nickname.trim()
								: (port.label ??
									(key.startsWith('value') ||
									key.startsWith('data') ||
									key.startsWith('exec') ||
									key.startsWith('result')
										? ''
										: key)),
						description: descr,
						datastructure: socket.datastructure,
						priority,
						default: value,
						type: socket.type
					});
				}
			}
			return res;
		}
		const editorData = editor.toJSON();
		if (areNodesSelected) {
			editorData.nodes = editorData.nodes.filter((n) => selectedNodesIds.has(n.id));
			editorData.connections = editorData.connections.filter((c) => selectedNodesIds.has(c.source) || selectedNodesIds.has(c.target));
			editorData.graphName = subGraphName;
			editorData.editorName = subGraphName;
		}

		const res: StoredGraph = $state.snapshot({
			...graph,
			id,
			author: $userStore,
			graph: editorData,
			createdAt: date,
			updatedAt: date,
			inputs: await gatherPorts('input'),
			outputs: await gatherPorts('output'),
			variables: Object.entries(variables).map(([id, { keep, nickname, descr, priority }]) => ({
				id,
				keep,
				label: nickname,
				description: descr,
				priority
			}))
		});

		delete (res as { addToFavorite?: boolean }).addToFavorite;
		return res;
	}

	const selectedInputs = editor.selectedInputs.filter(({ node}) => !areNodesSelected || selectedNodesIds.has(node.id));
	const selectedOutputs = editor.selectedOutputs.filter(({ node }) => !areNodesSelected || selectedNodesIds.has(node.id));

	function getPortsConfig(
		side: 'input' | 'output'
	): Record<
		string,
		Record<string, { keep: boolean; nickname?: string; descr?: string; priority?: number }>
	> {
		return Object.fromEntries(
			(side === 'input' ? selectedInputs : selectedOutputs).map(({ node, selected }) => [
				node.id,
				Object.fromEntries(
					selected.map(([k]) => {
						const port = node[side === 'input' ? 'inputs' : 'outputs'][k];
						if (!port) throw new Error(`Port ${k} not found in node ${node.id}`);
						const label = port.label;
						const existing = existingGraph?.[side === 'input' ? 'inputs' : 'outputs']?.find(
							({ nodeId, key }) => nodeId === node.id && key === k
						);

						const nickname = existing?.label;
						return [
							k,
							{
								keep: existingGraph ? Boolean(existing) : true,
								nickname,
								descr: existing?.description ?? port.description,
								priority: existing?.priority
							}
						];
					})
				)
			])
		);
	}

	const inputs = $state(getPortsConfig('input'));
	const outputs = $state(getPortsConfig('output'));

	const exposedVariables = $derived(Object.values(editor.variables).filter((v) => v.exposed));
	const variables = $state<
		Record<string, { nickname?: string; keep?: boolean; descr?: string; priority?: number }>
	>(
		Object.fromEntries(
			Object.values(editor.variables)
				.filter((v) => v.exposed)
				.map((v) => {
					const existing = existingGraph?.variables?.find((v2) => v2.id === v.id);
					return [
						v.id,
						{
							keep: existing?.keep ?? true,
							nickname: existing?.label,
							descr: existing?.description,
							priority: existing?.priority
						}
					];
				})
		)
	);
</script>

{#snippet Input(key: keyof typeof graph, props: HTMLInputAttributes = {})}
	<label class="input input-bordered flex items-center gap-2 has-[:invalid]:input-warning">
		<span class="font-semibold">{upperFirst(unCamelCase(key))}</span>
		{#if key === 'author'}
			<input bind:value={$userStore} {...props} name={'graph-' + key} class="grow" />
		{:else}
			<input
				bind:value={graph[key]}
				{...props}
				name={'graph-' + key}
				oninput={saveForm}
				class="grow"
			/>
		{/if}
	</label>
{/snippet}
{#snippet Checkbox(
	key: keyof typeof graph,
	props: HTMLInputAttributes & { containerClass?: string } = {}
)}
	<div class={`form-control ${props.containerClass}`} title={props.title}>
		<label class="label cursor-pointer">
			<span class="label-text font-semibold">{upperFirst(unCamelCase(key))}</span>
			<input
				type="checkbox"
				use:checkbox
				bind:checked={graph[key] as boolean}
				{...props}
				class="checkbox {props.class}"
				name={'graph-' + key}
				onchange={saveForm}
			/>
		</label>
	</div>
{/snippet}
{#snippet TextArea(key: keyof typeof graph, props: HTMLTextareaAttributes = {})}
	{@const label = upperFirst(key)}
	<label class="form-control">
		<div class="label">
			<span class="label-text font-bold dtext-base">{label}</span>
		</div>
		<textarea
			bind:value={graph[key]}
			placeholder={label}
			use:autosize
			name={'graph-' + key}
			class="textarea textarea-bordered grow"
			oninput={saveForm}
			{...props}
		></textarea>
	</label>
{/snippet}
{#snippet Title(title: string)}
	<h3 class="font-semibold mt-4 mb-2 text-xl">{upperFirst(title)}</h3>
{/snippet}

<form id={formId} class="flex flex-col gap-2">
	{@render Input('name', { required: true, placeholder: 'Name of the macro-block' })}
	{@render TextArea('description', {
		placeholder: 'Description (you can describe here what this macro-block is about...)'
	})}
	<!-- {@render Checkbox('public', { title: 'Should this graph be visible by other users' })} -->
	<h4 class="font-semibold mt-2">Tags</h4>
	<Tags
		bind:tags={graph.tags}
		class="ms-4"
		knownTags={NodeStorage.data.tags}
		addTagProps={{ class: 'bg-base-20 border-0' }}
	/>
	<div>
		<h4 class="font-semibold mt-2">Path</h4>
		<PathGenerator bind:path={graph.path} paths={NodeStorage.data.paths} class="mb-2 ms-4" />
	</div>
	{@render Input('author', { required: true, placeholder: "Name of this graph's author" })}
	{@render Checkbox('addToFavorite', {
		title: 'Add this graph to your favorites',
		class: 'ml-8',
		containerClass: 'w-fit mt-4 mb-4'
	})}
	{@render Title('variables')}
	{#if exposedVariables.length > 0}
		{#each exposedVariables as variable}
			<label class="grid grid-flow-col gap-4 items-center ms-4 grid-cols-[0fr,0fr,1fr]">
				<input type="checkbox" bind:checked={variables[variable.id].keep} class="checkbox" />
				<span class="w-[5rem] truncate col-start-2 font-semibold">{variable.name}</span>
				<input
					type="number"
					bind:value={variables[variable.id].priority}
					class="input input-bordered col-span-2"
					placeholder="Priority"
					title="Influences the order of inputs. Higher priority means higher display."
				/>
				<input
					bind:value={variables[variable.id].nickname}
					class="input input-bordered col-start-3 justify-self-stretch"
					placeholder="Rename"
				/>
				<textarea
					bind:value={variables[variable.id].descr}
					class="textarea textarea-bordered col-start-3"
					placeholder="Description"
					use:autosize
				></textarea>
			</label>
		{/each}
	{:else}
		<span class="ms-4 italic"> No variables exposed. </span>
	{/if}

	{#snippet Ports(name: 'inputs' | 'outputs')}
		{@const ports = name === 'inputs' ? selectedInputs : selectedOutputs}
		{@render Title(upperFirst(name))}
		{#if ports.length > 0}
			<ul class="ms-4 space-y-8">
				{#each ports as { node, selected }}
					{@const target = name === 'inputs' ? inputs : outputs}
					<li>
						<h4 class="flex flex-col items-start mb-2">
							<span class="text-sm opacity-50 italic">{node.name ? node.label : 'Node'}</span>
							<span class="text-lg font-bold" title={node.description}
								>{node instanceof VariableNode
									? `Get variable: ${node.variable?.name}`
									: (node.name ?? node.label)}</span
							>
						</h4>
						<ul class="space-y-6">
							{#each selected as [key, port]}
								{@const k = key.split('¤')[0]}
								<label class="grid grid-flow-col gap-2 items-center ms-8 grid-cols-[0fr,0fr,1fr]">
									<input
										type="checkbox"
										bind:checked={target[node.id][key].keep}
										class="checkbox"
										use:checkbox
									/>
									<span
										class="col-start-2 w-[10rem] truncate font-medium"
										title={port.description ?? port.label ?? key}
										>{port.label && port.label.trim().length > 0
											? port.label
											: k === 'value'
												? name.slice(0, -1)
												: k}</span
									>
									<input
										type="number"
										bind:value={target[node.id][key].priority}
										class="input input-bordered col-span-2"
										placeholder="Priority"
										title={`Influences the order of ${name}. Higher priority means higher display.`}
									/>
									<input
										bind:value={target[node.id][key].nickname}
										class="input input-bordered grow col-start-3"
										placeholder="Rename"
									/>
									<textarea
										bind:value={target[node.id][key].descr}
										class="textarea textarea-bordered col-start-3"
										placeholder="Description"
										use:autosize
									></textarea>
								</label>
							{/each}
						</ul>
					</li>
				{/each}
			</ul>
		{:else}
			<span class="italic ms-4">No {name} selected.</span>
		{/if}
	{/snippet}

	{@render Ports('inputs')}
	{@render Ports('outputs')}
</form>
