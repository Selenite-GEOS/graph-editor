<script lang="ts">
	import { NodeFactory } from '$graph-editor';
	import { setupClasses } from '$graph-editor/setup/appLaunch';
	import { onMount } from 'svelte';

	let classRegistry: Record<string, string>;
	onMount(async () => {
		await setupClasses();
		classRegistry = NodeFactory.classRegistry;
		console.log(NodeFactory.classRegistry);
	});
</script>

{#if classRegistry}
	<div class="grid grid-cols-2">
		{#each Object.entries(classRegistry) as [k, v]}
			<p>{k}</p>
		{/each}
	</div>
{/if}
