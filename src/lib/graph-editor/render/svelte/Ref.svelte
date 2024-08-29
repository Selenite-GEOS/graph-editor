<script lang="ts">
	type RefUpdate = (ref: HTMLElement) => void;

	import type { HTMLAttributes } from 'svelte/elements';
	type Props = {
		init: RefUpdate;
		unmount: RefUpdate;
	} & HTMLAttributes<HTMLSpanElement>;

	let { init, unmount, ...props }: Props = $props();

	let ref = $state<HTMLElement>();

	$effect(() => {
		// trigger 'rendered' on update
		if (ref) init(ref);
	});
	$effect(() => {
		return () => {
			if (ref) unmount(ref);
		}
	})
</script>

<span {...props} bind:this={ref} class="grid {props.class}"> </span>
