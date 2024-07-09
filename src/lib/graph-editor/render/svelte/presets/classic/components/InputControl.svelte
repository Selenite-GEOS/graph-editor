<script lang="ts">
	import { Modal } from '$graph-editor/plugins/modal';
	import { defaultInputControlValues, type InputControl, type InputControlType, type InputControlValueType } from '$graph-editor/socket';
	import { stopPropagation } from '$utils';
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';
	import EditArray from './EditArray.svelte';
	import { mount } from 'svelte';

	type Props = {
		data: InputControl<InputControlType>;
		width?: string;
		inputTextSize?: string;
	};
	let { data: inputControl, width = 'w-full', inputTextSize = 'text-md' }: Props = $props();
	let type = $derived(inputControl.type);
	$inspect(inputControl.value);
	const modal = Modal.instance;
	const simpleTypes = ['checkbox', 'group-name-ref', 'integer', 'number', 'text'] as const;
	const inputType: Record<(typeof simpleTypes)[number], HTMLInputTypeAttribute> = {
		number: 'number',
		text: 'text',
		checkbox: 'checkbox',
		integer: 'number',
		'group-name-ref': 'text'
	};
	let inputProps: HTMLInputAttributes = $derived({
		readonly: inputControl.readonly,
		type: simpleTypes.includes(type as (typeof simpleTypes)[number])
			? inputType[type as (typeof simpleTypes)[number]]
			: 'text',
		checked: type === 'checkbox' ? (inputControl.value as boolean) : undefined,
		oninput: (e) => {
			if (type === 'checkbox') {
				inputControl.value = e.currentTarget.checked;
				return;
			}
			if (type === 'number' && isNaN(parseFloat(e.currentTarget.value))) {
				return;
			}
			let value: unknown;
			try {
				value = JSON.parse(e.currentTarget.value);
			} catch (error) {
				value = e.currentTarget.value;
			}
			inputControl.value = value as InputControlValueType<InputControlType>;
		}
	});

	let vector = $derived(
		type === 'vector' ? (inputControl.value as { x: number; y: number; z: number }) : undefined
	);
	const datastructure = $derived(inputControl.datastructure);
</script>

<!-- TODO maybe move pointerdown and dblclick stop propagation to framework agnostic logic -->
{#snippet input(props: HTMLInputAttributes = {})}
	<input
		value={inputControl.value}
		ondblclick={stopPropagation}
		onpointerdown={stopPropagation}
		{...props}
	/>
{/snippet}

{#if inputControl.datastructure === 'scalar'}
	{#if vector}
		<div class="vector">
			{#each ['x', 'y', 'z'] as k, i (k)}
				{@render input({
					type: 'number',
					value: vector[k as 'x' | 'y' | 'z'],
					style: 'border-radius: 0;',
					oninput: (e) => {
						const res = parseFloat(e.currentTarget.value);
						if (isNaN(res)) {
							return;
						}
						inputControl.value = {
							...(inputControl.value as { x: number; y: number; z: number }),
							[k]: res
						};
					}
				})}
			{/each}
		</div>
	{:else}
		{@render input(inputProps)}
	{/if}
{:else if datastructure === 'array'}
	<button
		type="button"
		class="btn-edit-datastructure"
		ondblclick={stopPropagation}
		onpointerdown={stopPropagation}
		onclick={() => {
			modal.show({
				component: EditArray,
				title: 'Edit array',
				buttons: [
					{
						label: 'Change type',
						level: 'warning',
						onclick() {
							console.debug('Change type');
						}
					},
					{
						label: 'Add row',
						onclick() {
							(inputControl.value as []).push(defaultInputControlValues[type]);
							if (inputControl.onChange) inputControl.onChange(inputControl.value) ;
						}
					}
				],
				props: {
					changeType: inputControl.changeType,
					array: inputControl.value as unknown[],
					type,
					onchange: (v) => {
						if (inputControl.onChange) inputControl.onChange(v)
					}
				}
			});
		}}>Edit array</button
	><span class="text-xs ms-1">Length : {(inputControl.value as []).length}</span>
{:else}
	Unsupported datastructure
{/if}

<style lang="scss">
	.vector {
		display: flex;
	}

	input {
		width: 100%;
		padding: 0.25rem 0.5rem;
		border-radius: 5px;
		color: black;
	}
	/* .vector input {
		border-radius: 0;
	} */
	input[type='checkbox'] {
		height: 1.25rem;
	}

	$btn-base-color: hsl(0, 0%, 20%);
	$btn-text-color: white;
	.btn-edit-datastructure {
		background: $btn-base-color;
		color: white;
		font-size: 0.75rem;
		border-radius: 1rem;
		margin: 0 0.25rem;
		padding: 0.5rem;
		transition: all 0.2s;

		&:hover {
			background: lighten($btn-base-color, 7%);
			// color: darken($btn-text-color, 10%);
		}

		&:active {
			background: darken($btn-base-color, 10%);
			// color: white;
		}
	}
</style>
