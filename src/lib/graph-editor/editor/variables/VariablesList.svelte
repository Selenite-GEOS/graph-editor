<script lang="ts">
	import { faAngleDown, faPlus } from '@fortawesome/free-solid-svg-icons';
	import { _, getContext, themeControl } from '$lib/global';
	import Fa from 'svelte-fa';
	import { onMount, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import type { Action } from 'svelte/action';
	import { VariableItem, type Variable } from '.';
	import { get, type Writable } from 'svelte/store';
	import { persisted, shortcut, PointerDownWatcher, newUuid } from '@selenite/commons';
	import type { NodeFactory } from '../NodeFactory.svelte';
	import type { DataType } from '$graph-editor/plugins/typed-sockets';
	import { SvelteMap } from 'svelte/reactivity';
	import type { NodeEditor } from '../NodeEditor.svelte';

	let collapsed = persisted('advanced-variablesListCollapsed', true, { storage: 'session' });

	const editorContext = getContext('editor') as {
		activeFactory?: NodeFactory;
		factory?: NodeFactory;
		activeEditor?: NodeEditor;
		editor?: NodeEditor;
	};
	const factory = $derived(editorContext.activeFactory ?? editorContext.factory);
	const editor = $derived(factory?.editor ?? editorContext.activeEditor ?? editorContext.editor);
	const variables = $derived(editor?.variables ?? {});
	// let variables: Writable<Record<string, Variable>> | undefined = undefined;

	// let localId = newLocalId('variable');
	// variables[localId] = { name: 'variable1', value: 'value1', type: 'string', localId };
	// localId = newLocalId('variable');
	// variables[localId] = { name: 'variable2', value: 2, type: 'number', localId };
	// localId = newLocalId('variable');
	// variables[localId] = { name: 'variable3', value: true, type: 'boolean', localId };
	// localId = newLocalId('variable');
	// variables[localId] = { name: 'variable4', value: { x: 1, y: 2, z: 6 }, type: 'vector', localId };

	// Tricks to make the collapse smoother
	let timeout: string | number | NodeJS.Timeout | undefined;
	$effect(() => {
		if ($collapsed) {
			timeout = setTimeout(
				() => {
					mainDiv?.classList.remove('variant-ghost-surface');
				},
				mounted ? 150 : 0
			);
		} else {
			clearTimeout(timeout);
			mainDiv?.classList.add('variant-ghost-surface');
		}
	});

	type TypedDocumentEventListener<K extends keyof DocumentEventMap> = {
		event: K;
		listener: (ev: DocumentEventMap[K]) => unknown;
	};

	type DocumentEventListeners = {
		[K in keyof DocumentEventMap]: TypedDocumentEventListener<K>;
	}[keyof DocumentEventMap][];

	const documentEventListeners: DocumentEventListeners = [];
	let mounted = $state(false);
	let mainDiv = $state<HTMLDivElement>();
	// $: nVarsCreated = Object.keys($variables ?? {}).length;

	onMount(() => {
		mounted = true;
	});
	let nVarsCreated = $state(0);
	function createVariable() {
		console.log('create');
		$collapsed = false;
		const id = newUuid('variable');
		const type = $defaultVariableType;
		const isArray = $defaultVariableArray;
		const redo = () => {
			nVarsCreated += 1;
			if (variables === undefined) return;
			variables[id] = {
				name: `variable${nVarsCreated}`,
				exposed: false,
				isArray,
				value: undefined,
				type,
				highlighted: false,
				id
			};
		};
		factory?.history?.add({
			redo,
			undo() {
				if (variables === undefined) return;
				delete variables[id];
				nVarsCreated -= 1;
			}
		});
		redo();
	}

	const defaultVariableType = persisted('defaultVariableType', 'number', {storage: 'session'});
	const defaultVariableArray = persisted('defaultVariableArray', false, {storage: 'session'});

	const scroll: Action = (node) => {
		currentFlipDuration = 0;
		node.scrollIntoView({ behavior: 'smooth' });
	};

	function deleteVariable(variableId: string): void {
		console.debug('delete variable', variableId);
		currentFlipDuration = flipDuration;
		const v = variables[variableId];
		console.debug(factory);
		factory?.history?.execute({
			redo() {
				delete variables[variableId];
			},
			undo() {
				variables[variableId] = v;
			}
		});
	}
	const flipDuration = 150;
	let currentFlipDuration = $state(flipDuration);
	const pointerDownWatcher = PointerDownWatcher.instance;
	const mouseDown = $derived(pointerDownWatcher.isPointerDown);
	let buttonHeight = $state<number>();
</script>

{#if mounted}
	<div
		bind:this={mainDiv}
		use:shortcut={{ key: 'v', action: () => ($collapsed = !$collapsed) }}
		title={`${$collapsed ? 'Display' : 'Hide'} global variables.\n(V)`}
		transition:fade={{ duration: 200 }}
		class:w-40={$collapsed}
		class:w-[30rem]={!$collapsed}
		class:h-52={!$collapsed}
		class:bg-opacity-0={$collapsed}
		class:transition-main-div={mounted}
		class:light-bg-transparent={true}
		class:shadow-lg={!$collapsed}
		class:overflow-clip={true}
		class="h-52 transition-main-div transition rounded-box text-sm bg-base-200 text-base-content scrollbar-thin select-none pointer-events-auto
		 border border-base-content border-opacity-10
		"
		style={$collapsed ? `height:${buttonHeight}px` : undefined}
	>
		<div
			class:rounded-container-token={$collapsed}
			bind:clientHeight={buttonHeight}
			class="pe-3 w-full bg-base-200 rounded-tl-box rounded-tr-box flex justify-between items-center"
		>
			<!-- Collapse button -->
			<button
				type="button"
				class:hover:brightness-200={!mouseDown}
				class:dark:hover:brightness-75={!mouseDown}
				class="grow ps-4 pe-3 py-4 flex items-center gap-2 text-surface-900-50-token"
				onclick={async (e) => {
					if ($collapsed) {
						mainDiv?.classList.add('variant-ghost-surface');
					}
					await tick();
					await tick();
					await tick();
					$collapsed = !$collapsed;
					if (!(e.target instanceof HTMLElement)) return;
					e.target.blur();
				}}
			>
				<Fa icon={faAngleDown} size="sm" flip={$collapsed ? 'vertical' : undefined} />
				<h3 class="font-bold">Variables</h3>
			</button>
			<!-- Create variable button -->
			<button
				type="button"
				title="Create new variable."
				class="btn btn-square btn-sm btn-ghost text-xs"
				onclick={() => createVariable()}
			>
				<Fa icon={faPlus} size="xs" />
			</button>
		</div>
		{#if !$collapsed}
			<!-- Variables list -->
			<div
				class="rounded-bl-box rounded-br-box overflow-hidden"
				style="padding:0rem 0.09rem;"
				transition:fade={{ duration: 200 }}
			>
				<div
					class:bg-surface-100={themeControl.isLight}
					class:bg-opacity-80={themeControl.isLight}
					class=" overflow-y-auto overflow-x-clip transition-main-div"
					class:!h-0={$collapsed}
					style="height: 9.6rem;"
				>
					<ul class="space-y-3 py-2">
						{#each Object.keys(variables) as id (id)}
							<li
								animate:flip={{ duration: currentFlipDuration }}
								in:fade
								class="ps-4 pe-2 text-surface-900-50-token text-sm"
								use:scroll
							>
								<VariableItem
									bind:variable={variables[id]}
									on:delete={() => {
										if (!variables) return;
										const v = variables[id];
										factory?.history?.add({
											redo: () => deleteVariable(id),
											undo: () => {
												variables[id] = v;
											}
										});
										deleteVariable(id);
									}}
								/>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.transition-main-div {
		transition-property: height, background-opacity, background-color, width;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}
</style>
