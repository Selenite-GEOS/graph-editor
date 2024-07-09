<script lang="ts">
	import { Nodes } from '$graph-editor';

	import { onMount } from 'svelte';

	let nodeRegistry: Map<string, unknown>;
	onMount(() => {
		nodeRegistry = Nodes.nodeRegistry;
		console.log(Nodes.nodeRegistry);
	});
</script>

{#if nodeRegistry}
	<div class="grid grid-cols-2 text-white gap-2 p-4">
		{#each nodeRegistry.keys() as k}
			<p>{k}</p>
		{/each}
	</div>
{/if}
