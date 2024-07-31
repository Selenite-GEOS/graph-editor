<script lang="ts">
	import {
		InputControl,
		inputControlSocketType,
		socketToControl,
		type InputControlType,
		type InputControlValueType
	} from '$graph-editor/socket';
	import Fa from 'svelte-fa';
	import { InputControl as InputControlComponent } from '..';
	import { faTimes } from '@fortawesome/free-solid-svg-icons';
	import { shortcut } from '@selenite/commons';

	type Props = {
		array: unknown[];
		type: InputControlType;
		onchange?: (array: unknown[]) => void;
		addRow?: () => void;
	};
	let { array, type, onchange, addRow }: Props = $props();
	$inspect('editarray', array).with(console.debug);

	const controls = $derived(
		array.map(
			(v, i) =>
				new InputControl({
					datastructure: 'scalar',
					socketType: inputControlSocketType[type],
					onChange: (v) => {
						array[i] = v;
						if (onchange) onchange(array);
					},
					type,
					get initial() {
						return v as InputControlValueType<typeof type>;
					}
				})
		)
	);
</script>

<div
	class="grid grid-cols-[0fr,0fr,1fr,0fr] gap-2 items-center"
	use:shortcut={{ key: 'Enter', action: addRow, ignoreElements: [] }}
>
	{#each controls as control, i (i)}
		<span class="text-end">{i}</span>
		<span>—</span>
		<span class="text-center text-base-content">
			<InputControlComponent data={control} focus={true} />
		</span>
		<!-- Delete row button -->
		<button
			type="button"
			class="btn-icon"
			onclick={() => {
				array.splice(i, 1);
				if (onchange) onchange(array);
			}}
		>
			<Fa icon={faTimes} class="m-auto opacity-50" />
		</button>
	{/each}
</div>
