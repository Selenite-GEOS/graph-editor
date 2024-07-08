<script lang="ts">
	import type { MenuItem } from '$graph-editor/plugins/context-menu/types';

	type Props = {
		items: MenuItem[];
		onclick?: () => void;
	};
	let { items, onclick }: Props = $props();
</script>

{#each items as item}
	<button
		type="button"
		class="bg-slate-300 p-2 rounded-sm"
		on:click={() => {
			if (onclick) onclick();
			item.action();
		}}>{[...item.path, item.label].join('.')}</button
	>
{/each}
