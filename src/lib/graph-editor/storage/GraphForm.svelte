<script lang="ts">
	import type { NodeEditor } from '$graph-editor/editor';
	import { autosize, persisted, unCamelCase } from '@selenite/commons';
	import type { GraphPorts, StoredGraph } from './types';
	import { upperFirst } from 'lodash-es';
	import type { HTMLInputAttributes, HTMLTextareaAttributes } from 'svelte/elements';
	import { FavoritesManager } from './FavoritesManager.svelte';
	import { VariableNode } from '$graph-editor/nodes/XML/VariableNode.svelte';
	import { InputControl, type Input } from '$graph-editor/socket';
	interface Props {
		editor: NodeEditor;
		formId?: string;
		existingGraph?: StoredGraph;
	}

	let { editor, formId, existingGraph }: Props = $props();
	const savedForm = persisted<Partial<typeof graph>>('graph-form', {}, { storage: 'session' });
	const localPersistedGraph = persisted<Partial<typeof graph>>('graph-form', {});
	const graph: Partial<StoredGraph & { addToFavorite: boolean }> = $state({
		...$savedForm,
		...$localPersistedGraph,
		...existingGraph,
		get name() {
			return editor.graphName ?? '';
		},
		set name(value: string) {
			editor.graphName = value;
		}
	});

	if (existingGraph) {
		graph.addToFavorite = FavoritesManager.isFavorite(existingGraph.id);
	}

	const persistedKeys = [
		'name',
		'description',
		'public',
		'addToFavorite'
	] as (keyof typeof graph)[];
	const localPersistedKeys = ['author'] as (keyof typeof graph)[];
	function saveForm() {
		console.debug(graph.public);
		const res: Record<string, unknown> = {};
		for (const key of persistedKeys) {
			res[key] = graph[key];
		}
		$savedForm = res;

		const localRes: Record<string, unknown> = {};
		for (const key of localPersistedKeys) {
			localRes[key] = graph[key];
		}
		$localPersistedGraph = localRes;
		console.debug('Saved form', $savedForm);
	}

	export async function getResponse(): Promise<StoredGraph> {
		const id = editor.graphId;
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
						value = await node.getDataWithInputs(key);
						if (typeof value === 'object') {
							value = JSON.stringify(value);
						}
					}
					res.push({
						nodeId,
						key,
						label: nickname && nickname.trim().length > 0 ? nickname.trim() : (port.label ?? key),
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
		const res: StoredGraph = {
			...graph,
			id,
			graph: editor.toJSON(),
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
		};

		delete (res as { addToFavorite?: boolean }).addToFavorite;
		return res;
	}

	const selectedInputs = editor.selectedInputs;
	const selectedOutputs = editor.selectedOutputs;

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
								descr: existing?.description,
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
	<label class="input input-bordered flex items-center gap-2 has-[:invalid]:input-error">
		{upperFirst(unCamelCase(key))}
		<input
			bind:value={graph[key]}
			{...props}
			name={'graph-' + key}
			oninput={saveForm}
			class="grow"
		/>
	</label>
{/snippet}
{#snippet Checkbox(key: keyof typeof graph, props: HTMLInputAttributes = {})}
	<div class="form-control" title={props.title}>
		<label class="label cursor-pointer">
			<span class="label-text">{upperFirst(unCamelCase(key))}</span>
			<input
				type="checkbox"
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
			<span class="label-text">{label}</span>
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
	<h3 class="font-semibold mt-4 mb-1 text-lg">{upperFirst(title)}</h3>
{/snippet}

<form id={formId} class="flex flex-col gap-2">
	{@render Input('name', { required: true })}
	{@render TextArea('description', {
		placeholder: 'Description (you can describe here what this graph is about...)'
	})}
	{@render Checkbox('public', { title: 'Should this graph be visible by other users' })}
	{@render Checkbox('addToFavorite', { title: 'Add this graph to your favorites' })}
	Path Tags
	{@render Input('author', { required: true, placeholder: "Name of this graph's author" })}
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
		No variables exposed.
	{/if}

	{#snippet Ports(name: 'inputs' | 'outputs')}
		{@const ports = name === 'inputs' ? selectedInputs : selectedOutputs}
		{@render Title(upperFirst(name))}
		{#if ports.length > 0}
			<ul class="space-y-6">
				{#each ports as { node, selected }}
					{@const target = name === 'inputs' ? inputs : outputs}
					<li>
						<h4 class="flex flex-row gap-2 items-center mb-2">
							<span class="text-sm opacity-50">Node</span>
							<span class="italic"
								>{node instanceof VariableNode
									? `Get variable: ${node.variable?.name}`
									: (node.name ?? node.label)}</span
							>
						</h4>
						{#each selected as [key, port]}
							<label class="grid grid-flow-col gap-3 items-center ms-4 grid-cols-[0fr,0fr,1fr]">
								<input type="checkbox" bind:checked={target[node.id][key].keep} class="checkbox" />
								<span class="w-[5rem] truncate col-start-2 font-semibold" title={port.label ?? key}
									>{port.label ?? key}</span
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
					</li>
				{/each}
			</ul>
		{:else}
			No {name} selected.
		{/if}
	{/snippet}

	{@render Ports('inputs')}
	{@render Ports('outputs')}
</form>
