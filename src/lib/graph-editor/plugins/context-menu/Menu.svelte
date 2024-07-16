<script lang="ts">
	import type { MenuItem } from '$graph-editor/plugins/context-menu/types';
	import { tick, untrack } from 'svelte';
	import { flattenTree, makeTree, TreeComponent, type Tree } from './tree';

	type Props = {
		items: MenuItem[];
		onclick?: () => void;
		class?: string;
	};
	let { items, onclick, class: classes = '' }: Props = $props();

	const tree = $derived.by(() => {
		untrack(() => {
			focusedIndex = -1;
		});
		return makeTree({ items, pathKey: 'path' });
	});
	const itemsInTree = $derived(flattenTree(tree));
	let focusedIndex = $state(-1);
	let focusedItem: MenuItem | undefined = $derived(itemsInTree[focusedIndex]);
	let treeCmpnt = $state<TreeComponent<MenuItem>>();
	let treeElement = $state<HTMLElement>();
	export function expandAll() {
		treeCmpnt?.expandAll();
	}
	export function collapseAll() {
		treeCmpnt?.collapseAll();
	}
	export function focusNext() {
		if (itemsInTree.length === 0) return;
		focusedIndex = (focusedIndex + 1) % itemsInTree.length;
		focusFocusedItem();
	}

	export function focusPrevious() {
		if (itemsInTree.length === 0) return;
		if (focusedIndex === -1) focusedIndex = itemsInTree.length - 1;
		else focusedIndex = (itemsInTree.length + focusedIndex - 1) % itemsInTree.length;
		focusFocusedItem();
	}

	async function focusFocusedItem() {
		if (!focusedItem) return;
		console.debug('Focus', { ...focusedItem });
		treeCmpnt?.expandPath(focusedItem.path);
		await tick();
		const elmnt = treeElement?.querySelector(`#${focusedItem.id}`) as HTMLElement & {
			focus: () => void;
		};
		elmnt.focus();
	}
</script>

<TreeComponent
	bind:this={treeCmpnt}
	bind:element={treeElement}
	{tree}
	class="p-2 bg-slate-900 bg-opacity-100 text-white {classes}"
>
	{#snippet leaf(item: MenuItem)}
		<!-- svelte-ignore event_directive_deprecated -->
		<button
			type="button"
			id={item.id}
			class=" p-1 rounded-sm w-full text-start"
			title={item.description}
			on:click={() => {
				if (onclick) onclick();
				item.action();
			}}>{item.label}</button
		>
	{/snippet}
</TreeComponent>
