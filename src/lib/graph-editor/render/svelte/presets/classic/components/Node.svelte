<script lang="ts">
	import { onMount } from 'svelte';
	// import { focusTrap, modeCurrent, popup, type PopupSettings } from '@skeletonlabs/skeleton';
	// import Ref from '../../../Ref.svelte';
	// import type { ClassicScheme, SvelteArea2D } from '../types';
	import type { ClassicScheme, SvelteArea2D } from 'rete-svelte-plugin';
	import Ref from '../../../Ref.svelte';
	import { MacroNode, VariableNode, XmlNode, type Node } from '$graph-editor/nodes';
	import { faCubes } from '@fortawesome/free-solid-svg-icons';
	import type { NodeEditorSaveData } from '$graph-editor/editor';
	import Fa from 'svelte-fa';
	import { EditMacroNodeChannel } from '$lib/broadcast-channels';
	import { GetGraphStore } from '$houdini';
	import { fade } from 'svelte/transition';
	import { newLocalId } from '$lib/utils';
	import { faClock } from '@fortawesome/free-regular-svg-icons';
	// import { Popup } from '$lib/layout';
	import { spawnMoonMenu } from '$lib/menu/context-menu/moonContextMenu';
	import { createActionMenuItem } from '$lib/menu';
	import { _ } from '$lib/global';
	import { writable } from 'svelte/store';

	type NodeExtraData = { width?: number; height?: number };
	const modeCurrent = writable(true);
	function sortByIndex<K, I extends undefined | { index?: number }>(entries: [K, I][]) {
		entries.sort((a, b) => {
			const ai = (a[1] && a[1].index) || 0;
			const bi = (b[1] && b[1].index) || 0;
			return ai - bi;
		});
		return entries as [K, Exclude<I, undefined>][];
	}

	let {
		data,
		emit
	}: { data: Node & NodeExtraData; emit: (props: SvelteArea2D<ClassicScheme>) => void } = $props();

	let node = $derived(data);
	let factory = $derived(node.getFactory());

	const firstNameGiven = data instanceof XmlNode ? data.name : undefined;
	let macroNode = $derived(data instanceof MacroNode ? data : undefined);
	const isMacroNode = data instanceof MacroNode;

	if (isMacroNode) {
		const macroNode = data as MacroNode;
		const checkOutdatedLoop = async () => {
			console.log('Checking for outdated macro node...');
			if (await macroNode.isOutdated()) {
				outdated = true;
			} else {
				// setTimeout(checkOutdatedLoop, 10000)
			}
		};
		checkOutdatedLoop();
	}
	const isNamedXmlNode = data instanceof XmlNode && data.name !== undefined;
	const isXmlnode = data instanceof XmlNode;
	// console.log('isMacroNode', isMacroNode);

	let width = $derived(Number.isFinite(data.width) ? `${data.width}px` : '');
	let height = $derived(Number.isFinite(data.height) ? `${data.height}px` : '');
	let inputs = $derived(sortByIndex(Object.entries(data.inputs)));

	let controls = $derived(sortByIndex(Object.entries(data.controls)));
	let outputs = $derived(sortByIndex(Object.entries(data.outputs)));
	function any<T>(arg: T): unknown {
		return arg;
	}

	let outdated = false;

	async function onDblClickNode() {
		console.log('Double click on node');
		if (macroNode === undefined) return;
		console.log('Double click on macro node');
		const graph = (await new GetGraphStore().fetch({ variables: { id: macroNode.graphId } })).data
			?.graph.graph;
		if (graph === undefined) throw new Error('Graph not found');
		const saveData = graph.editorData as NodeEditorSaveData;
		new EditMacroNodeChannel().postMessage({
			graph: saveData
		});
	}
	const isVariable = data instanceof VariableNode;
	let highlight = false;
	if (isVariable) {
		data.getEditor().variables.subscribe((variables) => {
			const variableNode = data as VariableNode;
			if (!(variableNode.variableId in variables)) return;
			highlight = variables[(data as VariableNode).variableId].highlighted;
		});
	}
	let editingName = false;
	let nameInput: HTMLInputElement | undefined;
	const disableEditing = (ev: KeyboardEvent) => {
		if (ev.key === 'Escape') editingName = false;
	};
	$effect(() => {
		if (nameInput) {
			nameInput.focus();
			nameInput.select();
		}
	});
	$effect(() => {
		if (editingName) {
			document.addEventListener('keydown', disableEditing);
		} else document.removeEventListener('keydown', disableEditing);
	});

	let startDragPos: { x: number; y: number } | undefined;
	let dragDistance: number | undefined = undefined;
	const dragThreshold = 2;

	$effect(() => {
		if (editingName === false && isNamedXmlNode && data.name.trim() === '') {
			untrack(() => {
				data.name = firstNameGiven;
			});
		}
	});

	const outdatedPopupId = newLocalId('outdated-popup');
	let showPopup = false;
	const outdatedPopupSettings: PopupSettings = {
		event: 'hover',
		placement: 'top',
		target: outdatedPopupId,
		state(event) {
			// if (event.state) showPopup = true;
		}
	};
	let hidePopupTimeout: NodeJS.Timeout;
	let selectedNodes: Node[] = [];
	function openContextMenu(e: MouseEvent) {
		if (!factory.accumulating?.active()) {
			factory.selector?.unselectAll();
			factory.selectableNodes?.select(data.id, false);
		}
		spawnMoonMenu({
			searchbar: false,
			pos: { x: e.clientX, y: e.clientY },
			items: [
				createActionMenuItem({
					label: $_('menu.node.comment.label'),
					description: $_('menu.node.comment.descr'),
					executeAction: () => {
						factory.commentSelectedNodes();
					}
				}),
				// TODO: Implement duplicateSelectedNodes
				// createActionMenuItem({
				// 	label: $_('menu.node.duplicate.label'),
				// 	description: $_('menu.node.duplicate.descr')
				// }),
				createActionMenuItem({
					label: $_('menu.node.delete.label'),
					description: $_('menu.node.delete.descr'),
					executeAction: async () => {
						await factory.deleteSelectedElements();
					}
				})
			],

			onClose() {
				if (isSelectedByRightClick) {
					isSelectedByRightClick = false;
					factory.selectableNodes?.unselect(data.id);
					return;
				}
			}
		});
	}
	let isSelectedByRightClick = false;
	console.log('Node', data);
	window.n = data;
</script>

<div
	class:rounded-token={isVariable}
	role="cell"
	on:focus={(e) => {
		if (!(e.target instanceof HTMLElement)) return;
		e.target.blur();
	}}
	tabindex="-1"
	class:rounded-container-token={!isVariable}
	class="relative node {data.selected &&
	(dragDistance === undefined || dragDistance > dragThreshold)
		? 'selected'
		: ''}"
	style:width
	style:height
	data-testid="node"
	class:bg-surface-500={!$modeCurrent}
	class:brightness-125={highlight}
	class:node-light-background={$modeCurrent}
	on:contextmenu|preventDefault={openContextMenu}
	on:pointerdown={(e) => {
		if (e.button !== 2) return;
		e.stopPropagation();
		if (factory.getSelectedNodesIds()?.has(node.id)) return;
		factory.selectableNodes?.select(node.id, true);
		isSelectedByRightClick = true;
	}}
>
	{#if outdated}
		<Popup
			target={outdatedPopupId}
			background="bg-surface-100-800-token"
			class="{showPopup ? 'visible !opacity-100' : ''} text-nowrap "
		>
			Outdated
			<!-- <button type="button" class="btn variant-filled-secondary"> Refresh </button> -->
		</Popup>
		<button
			type="button"
			on:pointerdown|stopPropagation
			class="absolute cursor-default -right-3 text-error-600-300-token -top-2 rounded-full bg-white dark:bg-surface-900 p-0.5 [&>*]:pointer-events-none"
			use:popup={outdatedPopupSettings}
		>
			<Fa icon={faClock} size="lg" secondaryColor="white" secondaryOpacity="100" />
		</button>
	{/if}
	{node.c}
	<div class="flex justify-{isVariable ? 'center' : ' between'} items-center">
		{#if node instanceof XmlNode && node.name !== undefined}
			<div class="title flex flex-col w-full">
				<div class="w-full truncate">
					<small class="text-white text-ellipsis text-xs opacity-60" title={node.label}
						>{node.label}</small
					>
					<div class="relative w-full truncate">
						<button
							class=" cursor-text text-start transition-opacity max-w-full truncate"
							class:opacity-0={editingName}
							data-testid="title"
							title={node.name}
							on:pointerdown={(event) => {
								startDragPos = { x: event.clientX, y: event.clientY };
								dragDistance = 0;
							}}
							on:pointermove={(event) => {
								if (!startDragPos) return;
								dragDistance = Math.sqrt(
									Math.pow(event.clientX - startDragPos.x, 2) +
										Math.pow(event.clientY - startDragPos.y, 2)
								);
							}}
							on:pointerup={(event) => {
								startDragPos = undefined;
								if (dragDistance && dragDistance > dragThreshold) {
									dragDistance = undefined;
									return;
								}

								dragDistance = undefined;
								if (event.button !== 0) {
									event.target.blur();
									return;
								}
								editingName = true;
								node.getFactory().selectableNodes?.unselect(node.id);
							}}
						>
							{node.name}
						</button>
						{#if editingName}
							<input
								transition:fade={{ duration: 100 }}
								bind:this={nameInput}
								class="text-token absolute top-0 left-0 w-full hover:bg-surface-50-900-token focus:bg-surface-50-900-token rounded-token dark:bg-surface-200-700-token no-border-token no-focus:border-primary-500 no-focus:ring-primary-500 transition-colors"
								type="text"
								value={node.name}
								on:blur={() => (editingName = false)}
								on:keydown={(e) => {
									if (e.key === 'Enter') editingName = false;
								}}
								on:input={(e) => {
									const val = e.target.value;
									node.name = val;
									node.setName(val);
								}}
							/>
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<div class="title truncate" title={data.label} data-testid="title">{data.label}</div>
		{/if}
		{#if isMacroNode}
			<div
				class="p-2 text-surface-50-900-token"
				on:dblclick|preventDefault={onDblClickNode}
				on:pointerdown|stopPropagation
				role="button"
				tabindex="0"
			>
				<Fa icon={faCubes} />
			</div>
		{/if}
	</div>
	<div style="top:2px;" class="space-y-0.5 {isVariable ? 'absolute right-0' : ''}">
		<!-- Outputs -->
		{#each outputs as [key, output]}
			<div class="output" data-testid={'output-' + key}>
				<div class="output-title" data-testid="output-title">
					{output.socket.displayLabel ? output.label || '' : ''}
				</div>
				<Ref
					class="output-socket"
					data-testid="output-socket"
					init={(element) =>
						emit({
							type: 'render',
							data: {
								type: 'socket',
								side: 'output',
								key,
								nodeId: data.id,
								element,
								payload: output.socket
							}
						})}
					unmount={(ref) => emit({ type: 'unmount', data: { element: ref } })}
				/>
			</div>
		{/each}

		<!-- Controls -->
		{#each controls as [key, control]}
			<Ref
				class="control"
				data-testid={'control-' + key}
				init={(element) =>
					emit({
						type: 'render',
						data: {
							type: 'control',
							element,
							payload: control
						}
					})}
				unmount={(ref) => emit({ type: 'unmount', data: { element: ref } })}
			/>
		{/each}

		<!-- Inputs -->
		{#each inputs as [key, input]}
			<div
				class="rete-input text-md items-center flex"
				data-testid={'input-' + key}
				style={input.control && !input.control.options?.label
					? 'height: 55px'
					: !input.socket.isArray
						? 'height: 65px;'
						: ''}
			>
				<Ref
					class="input-socket my-auto"
					data-testid="input-socket"
					init={(element) =>
						emit({
							type: 'render',
							data: {
								type: 'socket',
								side: 'input',
								key,
								nodeId: data.id,
								element,
								payload: input.socket
							}
						})}
					unmount={(ref) => emit({ type: 'unmount', data: { element: ref } })}
				/>
				{#if !input.control || !input.showControl}
					<div class="input-title" data-testid="input-title">
						{input.label || ''}{#if input.socket.isRequired}<span
								class="ps-0.5 text-lg"
								title="required">*</span
							>{/if}
					</div>
				{/if}
				{#if input.control && input.showControl}
					<Ref
						class="h-full !flex items-center input-control"
						data-testid="input-control"
						init={(element) =>
							emit({
								type: 'render',
								data: {
									type: 'control',
									element,
									payload: any(input).control
								}
							})}
						unmount={(ref) => emit({ type: 'unmount', data: { element: ref } })}
					/>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style lang="scss">
	@use 'sass:math';
	@import '../vars';

	.node-light-background {
		background: $node-color;
	}

	.node {
		border: 2px solid #4e58bf;
		cursor: pointer;
		box-sizing: border-box;
		width: $node-width;
		height: auto;
		padding-bottom: 6px;
		position: relative;
		user-select: none;
		line-height: initial;
		font-family: Arial;
		transition: transform 0.1s;

		&.dark {
			background: darken($node-color, 4%);
		}

		&:hover {
			background: lighten($node-color, 4%);
		}

		&.selected {
			background: $node-color-selected;
			border-color: #e3c000;
		}

		.title {
			color: white;
			font-family: sans-serif;
			font-size: 18px;
			padding: 8px;
		}

		.output {
			text-align: right;
		}

		.input {
			text-align: left;
		}

		:global(.output-socket) {
			text-align: right;
			margin-right: -(math.div($socket-size, 2) + $socket-margin);
			display: inline-block;
		}

		:global(.input-socket) {
			text-align: left;
			margin-left: -(math.div($socket-size, 2) + $socket-margin);
			display: inline-block;
		}

		.input-title,
		.output-title {
			vertical-align: middle;
			color: white;
			display: inline-block;
			font-family: sans-serif;
			font-size: 14px;
			margin: $socket-margin;
			line-height: $socket-size;
		}

		:global(.input-control) {
			z-index: 1;
			width: calc(100% - #{$socket-size + 2 * $socket-margin});
			vertical-align: middle;
			display: inline-block;
		}

		:global(.control) {
			display: block;
			padding: $socket-margin math.div($socket-size, 2) + $socket-margin;
		}
	}
</style>
