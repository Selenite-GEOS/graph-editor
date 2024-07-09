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
	import { faCross, faTimes } from '@fortawesome/free-solid-svg-icons';
	import type { SocketType } from '$graph-editor/plugins/typed-sockets';

	type Props = {
		array: unknown[];
		type: InputControlType;
		onchange?: (array: unknown[]) => void;
		changeType?: (type: SocketType) => void;
	};
	let { array, type, onchange, changeType }: Props = $props();
	$inspect('editarray', array).with(console.debug);

	function onTypeChange(k: keyof typeof socketToControl) {
		if (!changeType) {
			console.error("Missing change type function")
			return;
		}
		changeType(k);
		type = socketToControl[k];
	}
</script>

{#snippet changeTypeModal()}
	<div class="flex flex-col">
		<span class="preset-tonal-warning p-2 rounded-t"
			>Warning : Changing type will get rid of unconvertible values.</span
		>
		<select class="rounded-b p-2" oninput={(e) => {onTypeChange(e.currentTarget.value as keyof typeof socketToControl)}}>
			{#each Object.entries(socketToControl) as [k, v] (k)}
				<option value={k} selected={k === inputControlSocketType[type]}>{k}</option>
			{/each}
		</select>
	</div>
{/snippet}

{@render changeTypeModal()}

<div class="grid grid-cols-[0fr,0fr,1fr,0fr] gap-2 items-center">
	{#each array as item, i}
		<span class="text-end">{i}</span>
		<span>—</span>
		<span class="text-center">
			<InputControlComponent
				data={new InputControl({
					datastructure: 'scalar',
					onChange: (v) => {
						array[i] = v;
						if (onchange) onchange(array);
					},
					type,
					initial: item as InputControlValueType<typeof type>
				})}
			/>
		</span>
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

<style lang="scss">
	select {
		color: black;
	}
</style>
