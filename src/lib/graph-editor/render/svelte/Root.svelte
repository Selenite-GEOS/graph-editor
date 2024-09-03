<script lang="ts">
	import type { Component } from 'svelte';

	type Props = {
		component: Component;
		props: Record<string, unknown>;
		onRendered: () => void;
	};

	let { component, onRendered, props }: Props = $props();
	$effect(() => {
		onRendered();
	});

	const dyn = $derived({ component });
</script>

<dyn.component {...props} />
