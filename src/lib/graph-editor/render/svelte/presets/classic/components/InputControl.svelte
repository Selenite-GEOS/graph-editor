<script lang="ts">
	import type { InputControl, InputControlType, InputControlValueType } from '$graph-editor/socket';
	import { stopPropagation } from '$utils';
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';

	type Props = {
		data: InputControl<InputControlType>;
		width?: string;
		inputTextSize?: string;
	};
	let { data: inputControl, width = 'w-full', inputTextSize = 'text-md' }: Props = $props();
	let type = $derived(inputControl.type);
	$inspect(inputControl.value);

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
		oninput: (e) => {
			if (type === 'checkbox') {
				inputControl.value = e.currentTarget.checked;
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

{#if type === 'vector'}
	Vector
{:else}
	{@render input(inputProps)}
{/if}

<style>
	input {
		width: 100%;
		padding: 0.25rem 0.5rem;
		border-radius: 5px;
	}

	input[type='checkbox'] {
		height: 1.25rem;
	}
</style>
