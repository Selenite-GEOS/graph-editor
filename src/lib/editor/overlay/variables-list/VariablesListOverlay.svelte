<script lang="ts">
	/* eslint-disable no-undef */

	import { faAngleDown, faPlus } from '@fortawesome/free-solid-svg-icons';
	import {persisted as localStorageStore} from 'svelte-persisted-store';
	import { _, keyboardShortcut, modeCurrent } from '$lib/global';
	import Fa from 'svelte-fa';
	import { browser } from '$app/environment';
	import { onMount, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { VariableItem, type Variable } from '.';
	import { get, type Writable } from 'svelte/store';
	import type { SocketType } from '$rete/plugin/typed-sockets';
	import type { Action } from 'svelte/action';
	import { newLocalId, newUuid } from '$utils';

	const collapsed = localStorageStore('variablesListCollapsed', true);

	// const { activeEditor, getActiveFactory } = getContext('editor');

	let variables: Writable<Record<string, Variable>> | undefined = undefined;
	let setVarsUndefinedTimeout: NodeJS.Timeout | undefined;
	$: {
		if ($activeEditor?.variables) {
			clearTimeout(setVarsUndefinedTimeout);
			variables = $activeEditor.variables;
		} else {
			setVarsUndefinedTimeout = setTimeout(() => (variables = undefined), 100);
		}
	}

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
	$: {
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
	}

	type TypedDocumentEventListener<K extends keyof DocumentEventMap> = {
		event: K;
		listener: (ev: DocumentEventMap[K]) => unknown;
	};

	type DocumentEventListeners = {
		[K in keyof DocumentEventMap]: TypedDocumentEventListener<K>;
	}[keyof DocumentEventMap][];

	const documentEventListeners: DocumentEventListeners = [];
	let mounted = false;
	let mouseDown = false;
	let mainDiv: HTMLDivElement | undefined;
	$: nVarsCreated = Object.keys($variables ?? {}).length;

	onMount(() => {
		mounted = true;

		// Listeners for tracking mouse down
		documentEventListeners.push({
			event: 'mousedown',
			listener: (e) => {
				mouseDown = true;
			}
		});
		documentEventListeners.push({
			event: 'mouseup',
			listener: () => {
				mouseDown = false;
			}
		});

		documentEventListeners.forEach(({ event, listener }) =>
			document.addEventListener(event, listener as unknown as EventListener)
		);

		return () => {
			documentEventListeners.forEach(({ event, listener }) =>
				document.removeEventListener(event, listener as unknown as EventListener)
			);
		};
	});

	function createVariable() {
		console.log('create');
		$collapsed = false;
		const id = newUuid('variable');

		const redo = () => {
			nVarsCreated += 1;
			if (variables === undefined) return;
			variables.set({
				...get(variables),
				[id]: {
					name: `variable${nVarsCreated}`,
					exposed: false,
					value: undefined,
					type: $defaultType,
					highlighted: false,
					id
				}
			});
		};

		getActiveFactory()?.history?.add({
			redo,
			undo() {
				deleteVariable(id);
				nVarsCreated -= 1;
			}
		});
		redo();
	}
	export let defaultType: Writable<SocketType> = localStorageStore('defaultVariableType', 'string');

	const scroll: Action = (node) => {
		currentFlipDuration = 0;
		node.scrollIntoView({ behavior: 'smooth' });
	};

	function deleteVariable(variableId: string): void {
		console.log('delete variable', variableId);
		if (!$variables) return;
		currentFlipDuration = flipDuration;
		delete $variables[variableId];
		$variables = $variables;
	}
	const flipDuration = 150;
	let currentFlipDuration = flipDuration;
</script>

{#if mounted && $variables}
	<div
		bind:this={mainDiv}
		use:keyboardShortcut={{ key: 'v', action: () => ($collapsed = !$collapsed) }}
		transition:fade={{ duration: 200 }}
		class:w-40={$collapsed}
		class:w-96={!$collapsed}
		class:h-52={!$collapsed}
		class:h-12={$collapsed}
		class:bg-opacity-0={$collapsed}
		class:transition-main-div={mounted}
		class:light-bg-transparent={true}
		class=" h-52 transition-main-div transition m-7 rounded-container-token text-sm variant-ghost-surface"
	>
		<div
			class:rounded-container-token={$collapsed}
			class="header-div pe-2 w-full variant-ghost-surface rounded-tl-container-token rounded-tr-container-token flex justify-between items-center"
		>
			<!-- Collapse button -->
			<button
				type="button"
				class:hover:brightness-200={!mouseDown}
				class:dark:hover:brightness-75={!mouseDown}
				class="grow ps-4 pe-3 py-4 flex items-center gap-2 text-surface-900-50-token pointer-events-auto"
				on:click={async (e) => {
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
				<h3>Variables</h3>
			</button>
			<!-- Create variable button -->
			<button
				type="button"
				class="btn-icon btn-icon-sm variant-ghost-surface rounded-container-token pointer-events-auto text-xs"
				on:click={() => createVariable()}
			>
				<Fa icon={faPlus} size="xs" />
			</button>
		</div>
		<!-- Variables list -->
		<div
			class="rounded-bl-container-token rounded-br-container-token overflow-hidden"
			style="padding:0rem 0.09rem;"
		>
			<div
				class:bg-surface-100={$modeCurrent}
				class:bg-opacity-80={$modeCurrent}
				class=" overflow-y-auto overflow-x-clip pointer-events-auto transition-main-div"
				class:!h-0={$collapsed}
				style="height: 9.6rem;"
			>
				<ul class="space-y-2 py-2">
					{#each Object.keys($variables) as id (id)}
						<li
							animate:flip={{ duration: currentFlipDuration }}
							in:fade
							class="ps-4 pe-2 text-surface-900-50-token pointer-events-auto text-sm"
							use:scroll
						>
							<VariableItem
								bind:variable={$variables[id]}
								on:delete={() => {
									if (!$variables) return;
									const v = $variables[id];
									getActiveFactory()?.history?.add({
										redo: () => deleteVariable(id),
										undo: () => {
											$variables = {
												...$variables,
												[id]: v
											};
										}
									});
									deleteVariable(id);
								}}
								on:changetype={(e) => {
									console.log('set default variable type', e.detail.type);
									$defaultType = e.detail.type;
								}}
							/>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
{/if}

<style>
	.transition-main-div {
		transition-property: height, background-opacity, background-color, width;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		transition-duration: 150ms;
	}
</style>
