<script lang="ts">
	import { TreeComponent, type Tree } from '$graph-editor/plugins/context-menu/tree';
	import { untrack } from 'svelte';

	const tree: Tree<string> = [
		{ label: 'A', forest: ['a1', 'a2'] },
		{
			label: 'B',
			forest: [
				{ label: 'B1', forest: ['b1', 'b2'] },
				{ label: 'B2', forest: ['b3', 'b4'] }
			]
		},
		{
			label: 'C',
			forest: []
		}
	];
	let treeCmpnt = $state<TreeComponent<string>>();
	$effect(() => {
		treeCmpnt;
		untrack(() => {
			treeCmpnt?.expandAll();
		});
	});
</script>

{#snippet leaf(s: string)}
	{s}
{/snippet}
<TreeComponent bind:this={treeCmpnt} {leaf} {tree} />
