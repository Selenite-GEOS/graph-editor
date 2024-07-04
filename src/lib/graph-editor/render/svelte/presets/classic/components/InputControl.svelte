<script lang="ts">
	import type { InputControl, InputControlType } from '$graph-editor/socket';
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
	let props: HTMLInputAttributes = $derived({
		type: simpleTypes.includes(type as (typeof simpleTypes)[number]) ? inputType[type] : 'text',
		readonly: inputControl.readonly
	});
</script>

<!-- TODO maybe move pointerdown and dblclick stop propagation to framework agnostic logic -->
{#snippet input(props: HTMLInputAttributes = {})}
	<input
		{...props}
		bind:value={inputControl.value}
		ondblclick={stopPropagation}
		onpointerdown={stopPropagation}
	/>
{/snippet}

{#if type === 'vector'}{:else}
	{@render input(props)}
{/if}

<style lang="scss">
	input {
		width: 100%;
		padding: 0.25rem;
	}
</style>
