<script lang="ts">
	import { possibleTypes, type Variable } from '.';
	import cssVars from 'svelte-css-vars';
	import Color from 'color';
	import { newLocalId, capitalize } from '$utils';
	import { ErrorWNotif, _ } from '$lib/global';
	import ArrayEditor from './ArrayEditorModal.svelte';
	import { createEventDispatcher } from 'svelte';
	import type { DataType } from '$graph-editor/plugins/typed-sockets';
	import { assignControl, colorMap } from '$graph-editor/render/utils';
	import { InputControl } from '$graph-editor/control';
	import { InputControlComponent } from '$graph-editor/render';
	import type { NodeFactory } from '../NodeFactory.svelte';
	import { modals, showContextMenu } from '$graph-editor/plugins';
	import { sleep, type Point } from '@selenite/commons';
	import { variableDragStart } from '$graph-editor/utils';
	import { createFloatingActions } from 'svelte-floating-ui';
	import { upperFirst } from 'lodash-es';
	import { flip } from 'svelte-floating-ui/core';

	let v: Variable;
	export { v as variable };

	const dispatch = createEventDispatcher<{
		changetype: { type: DataType };
		delete: { variable: Variable };
		change: { variable: Variable };
	}>();
	$: color = Color(colorMap[v.type] ?? 'grey')
		.saturationv(70)
		// .saturate(1.2)
		.string();

	// random color
	let discoInterval: NodeJS.Timeout;
	let disco = false;
	$: if (disco)
		discoInterval = setInterval(() => {
			color = `hsl(${Math.random() * 360}, 100%, 50%)`;
		}, 230);
	else clearInterval(discoInterval);
	let inputControl: InputControl<InputControlTypes> | undefined;

	let firstSet = true;
	$: if (!firstSet) dispatch('change', { variable: v });
	$: {
		const controlType = assignControl(v.type);
		if (!controlType) throw new Error(`Control type not found for ${v.type}`);
		if (inputControl?.type !== controlType) {
			if (!firstSet) {
				dispatch('changetype', { type: v.type });
			}
			console.debug(controlType);
			inputControl = new InputControl({
				type: controlType,
				datastructure: v.isArray ? 'array' : 'scalar',
				socketType: v.type,
				initial: firstSet ? v.value : undefined,
				onChange: (val) => {
					console.debug('change', v.id, val);
					v.value = val;
					// v = { ...v, value: val };
				}
			});

			firstSet = false;
		}
	}

	const id = newLocalId('variable-item');

	let displayTypeSelection = false;
	// const popupSettings: PopupSettings = {
	// 	event: 'click',
	// 	target: id,
	// 	closeQuery: 'div',
	// 	state: ({ state }) => (displayTypeSelection = state)
	// };

	function openContextMenu({ pos }: { pos: Point }): void {
		showContextMenu({
			pos,
			items: [
				{
					label: capitalize(v.exposed ? 'unexpose' : 'expose'),
					description: v.exposed
						? $_('menu.variable.unexpose.descr')
						: $_('menu.variable.expose.descr'),
					action: () => {
						v.exposed = !v.exposed;
						dispatch('change', { variable: v });
					},
					tags: ['expose', 'visibility']
				},
				{
					label: 'Delete',
					description: 'Delete this variable.',
					action: () => {
						dispatch('delete', { variable: v });
					},
					tags: ['delete']
				}
			]
		});
	}

	function openRenamePrompt(): void {
		console.log('To implement: Rename prompt');
		modals.show({
			prompt: 'Rename variable',
			initial: v.name,
			response(r) {
				if (typeof r === 'string') {
					v.name = r;
				}
			}
		});
		// modalStore.trigger({
		// 	type: 'prompt',
		// 	title: $_('variable-item.rename-prompt.title'),
		// 	value: v.name,
		// 	buttonTextCancel: $_('button.cancel'),
		// 	buttonTextSubmit: $_('button.rename'),
		// 	valueAttr: { required: true, placeholder: $_('variable-item.rename-prompt.placeholder') },
		// 	response(r) {
		// 		if (r) {
		// 			v.name = r;
		// 		}
		// 	}
		// });
	}
	// const arrayEditor: ModalComponent = { ref: ArrayEditor };

	// function openArrayEditor() {
	// 	const arrayEditorModal: ModalSettings = {
	// 		type: 'component',
	// 		component: arrayEditor,
	// 		meta: { array: v.value, type: v.type, title: 'Edit array' },
	// 		response(a) {
	// 			console.log('ArrayEdit: Modal response', a);
	// 			if (a !== undefined) {
	// 				v.value = a;
	// 			}
	// 		}
	// 	};
	// 	modalStore.trigger(arrayEditorModal);
	// }
	const [changeTypeRef, changeTypePopup] = createFloatingActions({
		placement: 'bottom-start',
		middleware: [flip()]
	});
</script>

<!-- 
<div class="bg-surface-50-900-token rounded-container-token p-2" data-popup={id}>
	{#if displayTypeSelection}
		<ListBox>
			{#each possibleTypes as type}
				<ListBoxItem bind:group={v.type} name="type" value={type}>
					<svelte:fragment slot="lead"
						><div
							class="rectangle-3d"
							use:cssVars={{ color: Color(colorMap[type]).saturationv(70).string() }}
						/></svelte:fragment
					>
					{capitalize(type)}
				</ListBoxItem>
			{/each}
		</ListBox>
	{/if}
</div> -->

{#if displayTypeSelection}
	<div class="bg-base-100 rounded-box p-2" use:changeTypePopup>
		<ul class="flex flex-col gap-2">
			{#each possibleTypes as type}
				<li>
					<button
						class="btn btn-sm"
						on:focus={() => (displayTypeSelection = true)}
						on:click={() => {
							v.type = type;
							displayTypeSelection = false;
							if (!inputControl) return;
							const controlType = assignControl(v.type);
							if (!controlType) throw new Error(`Control type not found for ${v.type}`);
							inputControl = new InputControl({
								type: controlType,
								datastructure: v.isArray ? 'array' : 'scalar',
								socketType: v.type,
								initial: firstSet ? v.value : undefined,
								onChange: (val) => {
									console.debug('change', v.id, val);
									v.value = val;
									// v = { ...v, value: val };
								}
							});
						}}
					>
						<div
							class="rectangle-3d"
							use:cssVars={{ color: Color(colorMap[type]).saturationv(70).string() }}
						></div>
						{upperFirst(type)}
					</button>
				</li>
			{/each}
		</ul>
	</div>
{/if}

<div class="flex items-center h-10">
	<div class="flex items-center gap-2 pe-2">
		<button
			type="button"
			class="btn px-0 pb-0 py-1"
			use:changeTypeRef
			on:click={() => (displayTypeSelection = !displayTypeSelection)}
			on:blur={() => {
				const listener = async () => {
					await sleep();
					displayTypeSelection = false;
					document.removeEventListener('pointerup', listener);
				}
				document.addEventListener('pointerup', listener) ;
			}}
		>
			<div
				class:rectangle-3d={!v.isArray}
				class:array={v.isArray}
				title={v.type}
				use:cssVars={{ color }}
			></div>
		</button>
		<button
			type="button"
			title={v.name}
			draggable="true"
			on:pointerenter={() => (v.highlighted = true)}
			on:pointerleave={() => (v.highlighted = false)}
			on:dragstart={variableDragStart(v)}
			class:outline-dashed={v.exposed}
			class="line-clamp-1 font-semibold outline-2 outline-accent text-start text-ellipsis w-[7.8rem] overflow-hidden pointer-events-auto hover:bg-base-100 rounded-btn py-1 px-2"
			on:contextmenu|preventDefault|stopPropagation={(e) =>
				openContextMenu({ pos: { x: e.clientX, y: e.clientY } })}
			on:click={() => openRenamePrompt()}
		>
			{v.name}
		</button>
	</div>
	{#if inputControl}
		<!-- {#if v.isArray}
			<button
				type="button"
				class="btn btn-sm variant-filled w-full"
				on:click={() => openArrayEditor()}>Edit array</button
			>
		{:else} -->
		<label class="grow flex justify-center min-h-12 items-center">
			<InputControlComponent data={inputControl} width="w-56" />
		</label>
		<!-- {/if} -->
	{/if}
</div>

<style lang="scss">
	.array {
		width: 1.2rem;
		height: 1.2rem;
		border: 4px dashed var(--color);
	}

	.rectangle-3d {
		width: 1.2rem; /* Width of the rectangle */
		height: 0.6rem; /* Height of the rectangle */
		background-color: var(--color); /* Background color of the rectangle */
		border-radius: 15px; /* Rounded corners */
		box-shadow:
			-0px 1px 1px rgba(0, 0, 0, 0.4),
			/* Outer shadow for depth */ inset -1px 1px 2px rgba(255, 255, 255, 0.4); /* Inner shadow for effect*/
	}
</style>
