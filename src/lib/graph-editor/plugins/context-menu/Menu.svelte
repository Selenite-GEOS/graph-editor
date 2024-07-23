<script lang="ts">
	import type { MenuItem } from '$graph-editor/plugins/context-menu/types';
	import { tick, untrack } from 'svelte';
	import { flattenTree, makeTree, TreeComponent, type Tree } from './tree';

	type Props = {
		items: MenuItem[];
		onclick?: () => void;
		class?: string;
		sort?: boolean
	};
	let { items, onclick, class: classes = '', sort = true }: Props = $props();

	const tree = $derived.by(() => {
		untrack(() => {
			focusedIndex = -1;
		});
		return makeTree({ items, pathKey: 'path', sort: sort ? (a, b) => {
			return a.label.localeCompare(b.label);
		} : undefined });
	});
	const itemsInTree = $derived(flattenTree(tree));
	let focusedIndex = $state(-1);
	let focusedItem: MenuItem | undefined = $derived(itemsInTree[focusedIndex]);

	export function getFocusedItem(): MenuItem | undefined {
		return focusedItem;
	
	}
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
			focus?: () => void;
		} | undefined;
		if (elmnt?.focus)
			elmnt.focus();
	}
</script>

<TreeComponent
	bind:this={treeCmpnt}
	bind:element={treeElement}
	{tree}
	class="p-2 bg-neutral bg-opacity-100 text-neutral-content {classes}"
>
	{#snippet leaf(item: MenuItem)}
		<!-- svelte-ignore event_directive_deprecated -->
		<button
			type="button"
			id={item.id}
			class="transition-all duration-100 p-0.5 ps-4 rounded-btn w-full text-start bg-transparent hover:bg-base-300 hover:text-base-content"
			title={item.description}
			on:click={() => {
				if (onclick) onclick();
				item.action();
			}}>{item.label}</button
		>
	{/snippet}
</TreeComponent>
