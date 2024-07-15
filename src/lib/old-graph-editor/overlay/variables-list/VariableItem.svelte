<script lang="ts">
	import { assignControl, colorMap } from '$graph-editor/customization/utils';
	import { possibleTypes, type Variable } from '.';
	import cssVars from 'svelte-css-vars';
	import Color from 'color';
	import InputControlComponent from '$graph-editor/customization/presets/classic/components/InputControl.svelte';
	import { InputControl, type InputControlType } from '$graph-editor/socket';
	import type { SocketType } from '$graph-editor/plugin/typed-sockets';
	import {
		popup,
		type PopupSettings,
		ListBox,
		ListBoxItem,
		getModalStore,
		type ModalComponent,
		type ModalSettings
	} from '@skeletonlabs/skeleton';
	import { newLocalId, capitalize } from '$utils';
	import { createEventDispatcher } from 'svelte';
	import { spawnMoonMenu } from '$lib/oldMenu/context-menu/moonContextMenu';
	import type { Point } from '$lib/types/Point';
	import { createActionMenuItem } from '$lib/oldMenu';
	import { ErrorWNotif, _ } from '$lib/global/index.svelte';
	import ArrayEditor from './ArrayEditorModal.svelte';

	let v: Variable;
	export { v as variable };

	const modalStore = getModalStore();

	const dispatch = createEventDispatcher<{
		changetype: { type: SocketType };
		delete: { variable: Variable };
		change: { variable: Variable };
	}>();
	$: color = Color(colorMap[v.type])
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
	let inputControl: InputControl<InputControlType> | undefined;

	let firstSet = true;
	$: if (!firstSet) dispatch('change', { variable: v });
	$: {
		const controlType = assignControl(v.type);
		if (!controlType) throw new Error(`Control type not found for ${v.type}`);
		if (inputControl?.type !== controlType) {
			if (!firstSet) {
				dispatch('changetype', { type: v.type });
			}
			console.log(controlType);
			inputControl = new InputControl(controlType, {
				initial: firstSet ? v.value : undefined,
				change: (val) => {
					console.log('change', v.id, val);
					v = { ...v, value: val };
				}
			});

			firstSet = false;
		}
	}

	const id = newLocalId('variable-item');

	let displayTypeSelection = false;
	const popupSettings: PopupSettings = {
		event: 'click',
		target: id,
		closeQuery: 'div',
		state: ({ state }) => (displayTypeSelection = state)
	};

	function openContextMenu({ pos }: { pos: Point }): void {
		spawnMoonMenu({
			pos,
			searchbar: false,
			items: [
				createActionMenuItem({
					label: capitalize(v.exposed ? $_('menu.unexpose') : $_('menu.expose')),
					description: v.exposed
						? $_('menu.variable.unexpose.descr')
						: $_('menu.variable.expose.descr'),
					executeAction: () => {
						v.exposed = !v.exposed;
						dispatch('change', { variable: v });
					},
					tags: ['expose', 'visibility']
				}),
				createActionMenuItem({
					label: capitalize($_('button.delete')),
					description: $_('menu.variable.delete.descr'),
					executeAction: () => {
						dispatch('delete', { variable: v });
					},
					tags: ['delete']
				})
			]
		});
	}

	function openRenamePrompt(): void {
		modalStore.trigger({
			type: 'prompt',
			title: $_('variable-item.rename-prompt.title'),
			value: v.name,
			buttonTextCancel: $_('button.cancel'),
			buttonTextSubmit: $_('button.rename'),
			valueAttr: { required: true, placeholder: $_('variable-item.rename-prompt.placeholder') },
			response(r) {
				if (r) {
					v.name = r;
				}
			}
		});
	}
	const arrayEditor: ModalComponent = { ref: ArrayEditor };

	function openArrayEditor() {
		const arrayEditorModal: ModalSettings = {
			type: 'component',
			component: arrayEditor,
			meta: { array: v.value, type: v.type, title: 'Edit array' },
			response(a) {
				console.log('ArrayEdit: Modal response', a);
				if (a !== undefined) {
					v.value = a;
				}
			}
		};
		modalStore.trigger(arrayEditorModal);
	}
</script>

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
</div>

<div class="flex items-center justify-between h-10">
	<div class="flex items-center gap-2 pe-2">
		<button type="button" class="btn px-0 pb-0 py-1" use:popup={popupSettings}>
			<div
				class:rectangle-3d={!v.isArray}
				class:array={v.isArray}
				title={v.type}
				use:cssVars={{ color }}
			/>
		</button>
		<button
			type="button"
			title={v.name}
			draggable="true"
			on:mouseenter={() => (v = { ...v, highlighted: true })}
			on:mouseleave={() => (v = { ...v, highlighted: false })}
			on:dragstart={(e) => {
				if (!e.dataTransfer) return;
				e.dataTransfer.setData('application/graph-variable', JSON.stringify(v));
			}}
			class:outline-dashed={v.exposed}
			class="outline-2 outline-primary-400 text-start text-ellipsis w-[7.8rem] overflow-hidden pointer-events-auto hover:bg-surface-200-700-token rounded-token py-1 px-2"
			on:contextmenu|preventDefault|stopPropagation={(e) =>
				openContextMenu({ pos: { x: e.clientX, y: e.clientY } })}
			on:click={() => openRenamePrompt()}
		>
			{v.name}
		</button>
	</div>
	{#if inputControl}
		{#if v.isArray}
			<button
				type="button"
				class="btn btn-sm variant-filled w-full"
				on:click={() => openArrayEditor()}>Edit array</button
			>
		{:else}
			<InputControlComponent data={inputControl} width="w-56" />
		{/if}
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
