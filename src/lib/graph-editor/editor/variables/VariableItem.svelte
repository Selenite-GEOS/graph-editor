<script lang="ts">
	import { possibleVarTypes, type Variable } from '.';
	import cssVars from 'svelte-css-vars';
	import Color from 'color';
	import { _ } from '$lib/global';
	import { createEventDispatcher, untrack } from 'svelte';
	import type { DataType } from '$graph-editor/plugins/typed-sockets';
	import { assignControl, colorMap } from '$graph-editor/render/utils';
	import { InputControl } from '$graph-editor/control';
	import { InputControlComponent } from '$graph-editor/render';
	import { persisted, preventDefault, showContextMenu, sleep, stopPropagation, type Point, modals } from '@selenite/commons';
	import { variableDragStart } from '$graph-editor/utils';
	import { createFloatingActions } from 'svelte-floating-ui';
	import { upperFirst } from 'lodash-es';
	import { flip } from 'svelte-floating-ui/core';
	
	interface Props {
		variable: Variable;
	}

	let { variable: v = $bindable() }: Props = $props();

		const defaultVariableType = persisted('defaultVariableType', 'number', {storage: 'session'});
	const defaultVariableArray = persisted('defaultVariableArray', false, {storage: 'session'});

	const dispatch = createEventDispatcher<{
		changetype: { type: DataType };
		delete: { variable: Variable };
		change: { variable: Variable };
	}>();
	let discoColor = $state<string>();
	const color = $derived(
		discoColor
			? discoColor
			: Color(colorMap[v.type] ?? 'grey')
					.saturationv(70)
					// .saturate(1.2)
					.string()
	);

	// random color
	let discoInterval: NodeJS.Timeout;
	let disco = $state(false);
	$effect(() => {
		if (disco)
			discoInterval = setInterval(() => {
				discoColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
			}, 230);
		else clearInterval(discoInterval);
	});

	let firstSet = true;
	$effect(() => {
		if (!firstSet) dispatch('change', { variable: v });
	});

	const controlType = assignControl(v.type) ?? 'text';

	const inputControl = new InputControl({
		type: controlType,
		datastructure: v.isArray ? 'array' : 'scalar',
		socketType: v.type,
		initial: $state.snapshot(v.value),
		onChange: (val) => {
			console.debug('change', v.id, val);
			v.value = val;
		}
	});

	$effect(() => {
		v.isArray
		untrack(() => {
			inputControl.datastructure = v.isArray ? 'array' : 'scalar';
		})
	})

	$effect(() => {
		v.type
		untrack(() => {
			inputControl.socketType = v.type;
		})
	})

	// if (!firstSet) {
	// 	dispatch('changetype', { type: v.type });
	// }

	let displayTypeSelection = $state(false);

	function openContextMenu({ pos }: { pos: Point }): void {
		showContextMenu({
			pos,
			items: [
				{
					label: upperFirst(v.exposed ? 'unexpose' : 'expose'),
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
	}

	const [changeTypeRef, changeTypePopup] = createFloatingActions({
		placement: 'bottom-start',
		middleware: [flip()]
	});
</script>

{#if displayTypeSelection}
	<div class="bg-base-100 rounded-box p-2" use:changeTypePopup>
		<ul class="flex flex-col gap-2">
			{#each possibleVarTypes as type}
				<li>
					<button
						class="btn btn-sm"
						onfocus={() => (displayTypeSelection = true)}
						onclick={() => {
							v.type = type;
							displayTypeSelection = false;
							$defaultVariableType = type;
						}}
					>
						<div
							class:rectangle-3d={!v.isArray}
							class:array={v.isArray}
							use:cssVars={{ color: Color(colorMap[type]).saturationv(70).string() }}
						></div>
						{upperFirst(type)}
					</button>
				</li>
			{/each}
			<li>
				<button
					class="btn btn-sm"
					onclick={() => {
						v.isArray = !v.isArray;
						displayTypeSelection = false;
						$defaultVariableArray = v.isArray;
					}}
				>
					<div
						class:rectangle-3d={v.isArray}
						class:array={!v.isArray}
						use:cssVars={{ color }}
					></div>

					To {v.isArray ? 'Scalar' : 'Array'}
				</button>
			</li>
		</ul>
	</div>
{/if}

<div class="flex items-center h-10">
	<div class="flex items-center gap-2 pe-2">
		<button
			type="button"
			class="btn px-0 pb-0 py-1"
			use:changeTypeRef
			onclick={() => (displayTypeSelection = !displayTypeSelection)}
			onblur={() => {
				const listener = async () => {
					await sleep();
					displayTypeSelection = false;
					document.removeEventListener('pointerup', listener);
				};
				document.addEventListener('pointerup', listener);
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
			onpointerenter={() => (v.highlighted = true)}
			onpointerleave={() => (v.highlighted = false)}
			ondragstart={variableDragStart(v)}
			class:outline-dashed={v.exposed}
			class="line-clamp-1 font-semibold outline-2 outline-accent text-start text-ellipsis w-[7.8rem] overflow-hidden pointer-events-auto hover:bg-base-100 rounded-btn py-1 px-2"
			oncontextmenu={(e) => {
				preventDefault(stopPropagation(e));
				openContextMenu({ pos: { x: e.clientX, y: e.clientY } });
			}}
			onclick={() => openRenamePrompt()}
		>
			{v.name}
		</button>
	</div>
	{#if inputControl}
		<label class="grow flex justify-center min-h-12 items-center">
			<InputControlComponent data={inputControl} />
		</label>
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
