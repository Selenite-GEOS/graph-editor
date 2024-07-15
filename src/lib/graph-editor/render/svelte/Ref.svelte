<script lang="ts">
	type RefUpdate = (ref: HTMLElement) => void;

	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';

	export let init: RefUpdate;
	export let unmount: RefUpdate;

	let ref: HTMLElement;

	$: {
		// trigger 'rendered' on update
		if (ref) init(ref);
	}

	onMount(() => {
		init(ref);
		return () => {
			unmount(ref);
		};
	});
</script>

<span {...$$restProps} bind:this={ref} class="grid {$$restProps.class}" />
