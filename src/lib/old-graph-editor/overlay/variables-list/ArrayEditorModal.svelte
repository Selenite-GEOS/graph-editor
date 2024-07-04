<script lang="ts">
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { assignControl } from '$graph-editor/customization/utils';
	import { InputControl, type InputControlType } from '$graph-editor/socket';
	import InputControlComponent from '$graph-editor/customization/presets/classic/components/InputControl.svelte';
	const modalStore = getModalStore();
	let { array, title, type } = $modalStore[0].meta;
	let controls: InputControl<'unknown'>[] = [];

	for (const [i, x] of array.entries()) {
		addControl(i, x);
	}
	console.log(array);

	function addControl(i: number, initial: unknown) {
		const controlType = assignControl(type);
		if (!controlType) throw new Error(`Control type not found for ${type}`);

		const inputControl = new InputControl<'unknown', unknown>(controlType, {
			initial,
			change: (val) => {
				console.log('change', val);
				array[i] = val;
			}
		});

		controls = [...controls, inputControl];
	}

	function addItem() {
		array = [...array, undefined];
		addControl(array.length - 1, undefined);
	}
	function validate() {
		if ($modalStore[0].response) $modalStore[0].response(array);
		modalStore.close();
	}
</script>

<section class="p-8 space-y-8 bg-surface-200-700-token rounded-container-token">
	<h2 class="h2">{title}</h2>
	<ol class="space-y-2 max-h-[70vh] overflow-y-auto p-0.5">
		{#each controls as control}
			<InputControlComponent data={control} />
		{/each}
	</ol>
	<div class="flex justify-end border-t-2 pt-4 gap-2 border-black">
		<button type="button" class="btn variant-filled-tertiary" on:click={() => addItem()}>Add</button
		>
		<button type="button" class="btn variant-filled-primary" on:click={() => validate()}
			>Validate</button
		>
	</div>
</section>
