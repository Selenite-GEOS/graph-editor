<script lang="ts" generics="T">
	import Fa from 'svelte-fa';
	import { isForest, type TreeComponent, type Tree } from './tree';
	import type { Snippet } from 'svelte';
	import { faCaretRight } from '@fortawesome/free-solid-svg-icons';

	type Props = {
		tree: Tree<T>;
		leaf: Snippet<[T]>;
		isRoot?: boolean;
		class?: string;
		expanded?: boolean;
		element?: HTMLElement;
	};
	let {
		tree,
		leaf,
		class: classes = '',
		expanded = $bindable(true),
		element = $bindable()
	}: Props = $props();
	let childExpanded: Record<number, boolean> = $state(
		Object.fromEntries(tree.map((_, i) => [i, false]))
	);
	let childTrees = $state<Record<number, TreeComponent<T>>>({});
	export function expandAll() {
		for (const k in childExpanded) {
			childExpanded[k] = true;
			childTrees[k]?.expandAll();
		}
	}
	export function collapseAll() {
		for (const k in childExpanded) {
			childExpanded[k] = false;
			childTrees[k]?.collapseAll();
		}
	}
	export function expandPath(path: string[]) {
		if (path.length === 0) return;
		const [t, ...q] = path;
		for (const [i, node] of tree.entries()) {
			if (!isForest(node)) continue;
			if (node.label !== t) continue;
			childExpanded[i] = true;
			childTrees[i].expandPath(q);
			break;
		}
	}
	export function toggleExpanded(i: number) {
		childExpanded[i] = !childExpanded[i];
	}
</script>

<div
	bind:this={element}
	class="grid items-start grid-cols-[1rem,1fr] gap-1 {classes}"
	class:hidden={!expanded}
>
	{#each tree as elmnt, i (i)}
		{#if isForest(elmnt)}
			<div class="grid items-start grid-cols-subgrid grid-rows-subgrid col-span-2">
				<!-- svelte-ignore event_directive_deprecated -->
				<button
					type="button"
					class="ps-2 text-start gap-4 grid items-start grid-cols-subgrid grid-rows-subgrid items-center col-span-2 truncate"
					on:click={() => toggleExpanded(i)}
				>
					<Fa
						icon={faCaretRight}
						size="sm"
						class="transition-all"
						style="transform: rotate({childExpanded[i] ? 90 : 0}deg);"
					/>
					{elmnt.label}
				</button>
			</div>
			{#if childExpanded[i] !== undefined}
				<svelte:self
					bind:this={childTrees[i] as TreeComponent<T>}
					class="col-start-2"
					tree={elmnt.forest}
					bind:expanded={childExpanded[i]}
					{leaf}
					isRoot={false}
				/>
			{/if}
		{:else}
			<div class="col-span-2">
				{@render leaf(elmnt)}
			</div>
		{/if}
	{/each}
</div>
